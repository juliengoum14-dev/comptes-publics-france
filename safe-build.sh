#!/bin/bash
# =============================================================================
# safe-build.sh — Wrapper de build avec lock par app + retry exponential
# =============================================================================
# Résout 4 problèmes :
#
# 1. **Builds concurrents dans le même app** (Phase 3/7/8/10 parallèles)
#    → Lock par répertoire : un seul build à la fois par app.
#    Les autres builds PATIENTENT (pas d'échec, pas de conflit).
#
# 2. **Orphelins de processus** (bash tool timeout)
#    → Trap SIGTERM/SIGINT → kill -- -$$ (tout le groupe meurt)
#    → PID file → kill exact par PID possible en dernier recours
#
# 3. **Kill war entre subagents**
#    → Plus besoin de kill : le lock libère la FD automatiquement
#    → Même si le process est SIGKILLé, le lock est libéré à la
#      mort du process (le kernel ferme les FDs)
#
# 4. **Échecs transitoires de build** (ressources contention, OOM temporaire)
#    → Retry exponential : jusqu'à 10 minutes de retry avec backoff
#    → Timeout de 5 min par tentative de build
#    → Les agents n'ont PAS à gérer les retries — c'est le wrapper qui le fait
#
# Usage : bash safe-build.sh <commande> [args...]
#   Ex: bash safe-build.sh next build
#       bash safe-build.sh npm run build
#
# Lock :
#   - Basé sur le répertoire courant (PWD)
#   - Utilise flock(1) sur un fd → attend si un build tourne déjà
#   - Libéré automatiquement à la fin (même en cas de kill)
#   - Fichier : /tmp/safe-build-lock-<hash_du_pwd>.lock
#
# PID file (pour kill de dernier recours) :
#   /tmp/safe-build-<PID>.pid
# =============================================================================

set -euo pipefail

# === Configuration ===
LOCK_HASH=$(echo "$PWD" | md5sum | head -c 10)
LOCK_FILE="/tmp/safe-build-lock-${LOCK_HASH}.lock"
PID_FILE="/tmp/safe-build-$$.pid"
CLEAN_EXIT=false
MAX_RETRY_DURATION=600   # 10 minutes de retry total
BUILD_TIMEOUT=300        # 5 minutes par tentative de build
BUILD_LOG=""             # Rempli avant chaque tentative de build

# === Fonction de nettoyage (process group) ===
# Appelée sur SIGTERM/SIGINT ou EXIT (si signal)
cleanup() {
  local exit_code=$?
  
  # Supprimer le fichier PID
  rm -f "$PID_FILE" 2>/dev/null || true
  
  # Si on sort proprement (commande terminée), ne pas tuer
  if [ "$CLEAN_EXIT" = true ]; then
    exit $exit_code
  fi
  
  # Marquer clean pour éviter double kill via EXIT trap
  CLEAN_EXIT=true
  
  # Sinon, on a reçu un signal → tuer tout le groupe processus
  kill -- -$$ 2>/dev/null || true
  sleep 1
  kill -9 -- -$$ 2>/dev/null || true
  
  exit $exit_code
}

# === Classification d'erreur ===
# Retourne 0 (true) si l'erreur est réessayable (infrastructure),
# 1 (false) si c'est une erreur logicielle (TypeScript, import, etc.)
is_infrastructure_error() {
  local exit_code=$1
  local log_file=$2

  # Exit code 124 = timeout (commande tuée par timeout)
  [ "$exit_code" = 124 ] && return 0

  # Exit codes de signal : 137=SIGKILL, 143=SIGTERM, 134=SIGABRT, 139=SIGSEGV
  case "$exit_code" in
    134|137|139|143) return 0 ;;
  esac

  # Vérifier la sortie pour des patterns d'infrastructure
  if [ -f "$log_file" ]; then
    # OOM / mémoire
    if grep -qiE '(Killed|out of memory|JavaScript heap out of memory|FATAL ERROR|Cannot allocate memory|ENOMEM|heap limit)' "$log_file" 2>/dev/null; then
      return 0
    fi
    # Disque / permission / réseau
    if grep -qiE '(ENOSPC|EACCES|EPERM|EADDRINUSE|ECONNRESET|ECONNREFUSED|ERR_SSL|reason: socket hang up)' "$log_file" 2>/dev/null; then
      return 0
    fi
    # Internal Next.js error (pas une erreur utilisateur)
    if grep -qiE '(InternalError|internal error|unhandledRejection)' "$log_file" 2>/dev/null; then
      return 0
    fi
  fi

  # Si on n'a pas reconnu un pattern d'infrastructure → erreur logicielle
  return 1
}

# === Installation des traps ===
trap cleanup SIGTERM SIGINT
trap cleanup EXIT

# === Lock par app : attendre son tour ===
exec 200>"$LOCK_FILE"
if ! flock -x -w 900 200 2>/dev/null; then
  echo "❌ safe-build: timeout 900s en attendant le lock build pour $PWD"
  exit 1
fi

# === Enregistrer le PID ===
echo "$$" > "$PID_FILE"

# === Retry exponential : la commande est relancée automatiquement ===
# Les agents n'ont PAS à gérer ça — safe-build.sh s'en charge.
# Si le build échoue pour une raison transitoire (contenance, OOM, lock),
# on retente avec un backoff exponentiel.
start_time=$(date +%s)
attempt=0
EXIT_CODE=1

while true; do
  attempt=$((attempt + 1))
  
  # Capturer stdout+stderr dans un fichier temporaire
  BUILD_LOG=$(mktemp /tmp/safe-build-output-XXXXXX.log)
  
  # Exécuter la commande avec timeout
  # NOTE: ne PAS utiliser if timeout...; le $? après fi ne reflète pas
  # l'exit code de timeout (bash retourne 0 si aucune condition matchée).
  # On utilise || pour capturer proprement l'exit code.
  EXIT_CODE=0
  timeout $BUILD_TIMEOUT "$@" >"$BUILD_LOG" 2>&1 || EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    cat "$BUILD_LOG"
    rm -f "$BUILD_LOG"
    break
  fi
  
  # Afficher la sortie du build échoué
  cat "$BUILD_LOG"
  
  elapsed=$(($(date +%s) - start_time))
  
  # Vérifier si on a dépassé la durée max de retry
  if [ $elapsed -ge $MAX_RETRY_DURATION ]; then
    echo "❌ safe-build: build failed after ${elapsed}s (${attempt} attempts, max ${MAX_RETRY_DURATION}s)"
    rm -f "$BUILD_LOG"
    break
  fi
  
  # Classifier l'erreur
  if is_infrastructure_error $EXIT_CODE "$BUILD_LOG"; then
    # Exponential backoff : min(2^attempt, 60) secondes
    sleep_sec=$((2 ** attempt))
    [ $sleep_sec -gt 60 ] && sleep_sec=60
    # Ne pas dépasser le temps restant
    remaining=$((MAX_RETRY_DURATION - elapsed))
    [ $sleep_sec -gt $remaining ] && sleep_sec=$remaining
    
    echo "⚠️ safe-build: infra error detected — retrying in ${sleep_sec}s (attempt ${attempt}, exit ${EXIT_CODE}, ${elapsed}s elapsed / ${MAX_RETRY_DURATION}s max)"
    sleep $sleep_sec
    
    # Ré-enregistrer le PID (au cas où le timeout aurait créé un nouveau process group)
    echo "$$" > "$PID_FILE"
  else
    echo "❌ safe-build: software error detected (exit ${EXIT_CODE}) — no retry"
    rm -f "$BUILD_LOG"
    break
  fi
  
  rm -f "$BUILD_LOG"
done

# === Sortie propre ===
CLEAN_EXIT=true
rm -f "$PID_FILE"
# Le lock est libéré automatiquement quand le fd 200 est fermé
# (ça arrive ici à la sortie du script)

exit $EXIT_CODE
