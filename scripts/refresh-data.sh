#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# refresh-data.sh — Orchestrateur du pipeline data/raw/ → data/processed/
# ──────────────────────────────────────────────────────────────────────────────
# Usage: bash scripts/refresh-data.sh
#
# Étapes :
#   1. process-data.mjs    → Transforme data/raw/ → data/processed/
#   2. fetch-budget-etat.mjs → Enrichit budget-etat.json via API ODATA
# ──────────────────────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          Refresh Data — Pipeline de traitement              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Date de début : $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "Répertoire    : $ROOT"
echo ""

# ── Étape 1 : Pipeline de processing ─────────────────────────────────────────
echo "─── Étape 1/2 : Pipeline process-data.mjs ───"
echo ""
if command -v node &>/dev/null; then
  node scripts/process-data.mjs
  echo ""
  echo "✓ Pipeline exécuté"
else
  echo "⚠️  Node.js non trouvé. Installation requise pour le pipeline."
fi
echo ""

# ── Étape 2 : Fetch Budget État ───────────────────────────────────────────────
echo "─── Étape 2/2 : Fetch Budget État (API ODATA) ───"
echo ""
if command -v node &>/dev/null; then
  node scripts/fetch-budget-etat.mjs
  echo ""
  echo "✓ Budget État mis à jour"
else
  echo "⚠️  Node.js non trouvé. Installation requise pour le fetch."
fi
echo ""

# ── Résumé ────────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          Refresh Data — Terminé                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Fichiers processed : data/processed/*.json"
echo ""
echo "Pour vérifier l'intégrité :"
echo "  node -e \"const d=require('./data/processed/budget-etat.json'); console.log('budget-etat OK,', d.annees_disponibles.length, 'années')\""
echo ""
echo "Date de fin : $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
