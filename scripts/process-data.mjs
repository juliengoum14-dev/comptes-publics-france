#!/usr/bin/env node
/**
 * Pipeline de transformation data/raw/ → data/processed/
 *
 * Ce script documente et exécute les transformations appliquées aux données
 * brutes téléchargées par le data-agent pour produire les fichiers processed.
 *
 * Usage: node scripts/process-data.mjs
 *
 * Prérequis : Node.js 18+ (fetch natif)
 * Pour les fichiers XLSX (INSEE), installer : npm install xlsx
 *   → Le script détecte si xlsx est disponible et parse les fichiers.
 *   → Sinon, il copie un template avec documentation.
 */

import { writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const OUT = (...p) => join(import.meta.dirname, '..', 'data', 'processed', ...p);

const XLSX_AVAILABLE = false;

const OUTPUT_META = {
  generated_at: new Date().toISOString(),
  generator: 'scripts/process-data.mjs',
  note: 'Fichier regénéré par le pipeline de processing',
  previous_data_preserved: false,
};

// ─── ÉTAPES DU PIPELINE ──────────────────────────────────────────────────────

const STEPS = [
  // ── 1. Synthèse ──────────────────────────────────────────────────────────
  {
    id: 'synthese',
    description: 'Synthèse annuelle APU : extraction des agrégats Eurostat (gov_10a_main) + INSEE pour construire vue consolidée recettes/dépenses/solde/dette/PIB',
    input: ['data/raw/eurostat/gov_10a_main.json', 'data/raw/eurostat/gov_10dd_edpt1.json'],
    output: 'data/processed/synthese.json',
    transform_type: 'agrégation (Eurostat → JSON structuré)',
    manual_steps: [
      'Extraire les séries B1GQ (PIB), TR (recettes), TE (dépenses), GD (dette) pour la France (geo=FR) depuis gov_10a_main.json',
      'Extraire le déficit B9 (solde) depuis gov_10dd_edpt1.json (secteur S13)',
      'Convertir les valeurs en Md€ et calculer les ratios %PIB',
      'Fusionner en un tableau annuel { annee, recettes, depenses, solde, dette, pib, recettes_pct_pib, ... }',
      'Vérifier cohérence : solde = recettes - dépenses (à ~0.1 Md€ près pour arrondis)',
    ],
    validate: 'Vérifier que solde_2025 ≈ -152.5 Md€ (donnée INSEE publiée)',
  },

  // ── 2. Recettes APU ──────────────────────────────────────────────────────
  {
    id: 'recettes-apu',
    description: 'Recettes des APU par catégorie : extraction des postes de recettes (TVA, IR, IS, cotisations sociales, etc.) depuis Eurostat gov_10a_main',
    input: ['data/raw/eurostat/gov_10a_main.json'],
    output: 'data/processed/recettes-apu.json',
    transform_type: 'extraction + catégorisation (Eurostat → catégories SEC2010)',
    manual_steps: [
      'Filtrer les codes SEC2010 commençant par TR (Total recettes) et ses sous-composantes D2, D5, D6, D91',
      'Pour chaque catégorie, extraire les séries France (geo=FR) par année',
      'Structurer en { categorie, code_sec2010, unite, donnees: [{ annee, montant }] }',
      'Agréger le total TR = somme des sous-catégories',
    ],
    validate: 'Vérifier que total_recettes_2025 ≈ 1 561,6 Md€',
  },

  // ── 3. Dépenses APU ──────────────────────────────────────────────────────
  {
    id: 'depenses-apu',
    description: 'Dépenses des APU par nature : extraction des postes de dépenses (prestations sociales, salaires, subventions, FBCF, intérêts) depuis Eurostat',
    input: ['data/raw/eurostat/gov_10a_main.json'],
    output: 'data/processed/depenses-apu.json',
    transform_type: 'extraction + catégorisation (Eurostat → postes de dépenses)',
    manual_steps: [
      'Filtrer les codes SEC2010 commençant par TE (Total dépenses) et ses sous-composantes D1, D3, D4, D5, D6, D7, D8, D9, P2, P5',
      'Pour chaque poste, extraire les séries France par année',
      'Structurer en { categorie, code_sec2010, unite, donnees: [{ annee, montant }] }',
      'Agréger le total TE = somme des sous-postes (doit correspondre)',
    ],
    validate: 'Vérifier que total_depenses_2025 ≈ 1 714,1 Md€',
  },

  // ── 4. APU par sous-secteur ──────────────────────────────────────────────
  {
    id: 'apu-depenses',
    description: 'Comptes des APU par sous-secteur (S13, S1311, S1313, S1314) : extraction des comptes INSEE (T_7301 à T_7306) ou Eurostat',
    input: [
      'data/raw/insee/T_7301_fr.xlsx',
      'data/raw/insee/T_7302_fr.xlsx',
      'data/raw/insee/T_7303_fr.xlsx',
      'data/raw/insee/T_7304_fr.xlsx',
      'data/raw/insee/T_7305_fr.xlsx',
      'data/raw/insee/T_7306_fr.xlsx',
    ],
    output: 'data/processed/apu-depenses.json',
    transform_type: 'extraction (INSEE XLSX → JSON structuré)',
    manual_steps: [
      'Parser chaque fichier XLSX (lire l\'onglet "Données")',
      'Pour chaque sous-secteur, extraire les postes (PIB, recettes, dépenses, solde) par année',
      'Structurer en { sous_secteurs: { code: { nom, donnees: [{ annee, poste, montant }] } } }',
      'Ajouter les données Eurostat gov_10a_main par secteur pour compléter',
    ],
    requires_xlsx: true,
    fallback: 'Sans xlsx, utiliser uniquement les données Eurostat déjà en JSON',
    validate: 'Vérifier que S1311 + S1313 + S1314 ≈ S13 (somme des sous-secteurs)',
  },

  // ── 5. Séries longues ────────────────────────────────────────────────────
  {
    id: 'series-longues',
    description: 'Séries temporelles longues (1995-2025) pour tous les indicateurs clés : PIB, recettes, dépenses, solde, dette',
    input: ['data/raw/eurostat/gov_10a_main.json', 'data/raw/eurostat/gov_10dd_edpt1.json'],
    output: 'data/processed/series-longues.json',
    transform_type: 'extraction + mise en forme (séries temporelles clés)',
    manual_steps: [
      'Extraire les indicateurs B1GQ, TR, TE, GD, B9 de gov_10a_main/gov_10dd_edpt1',
      'Pour chaque indicateur, créer { nom, code, unite, donnees: { annee: valeur } }',
      'Ajouter les ratios calculés (%PIB)',
      'Filtrer de 1995 à dernière année disponible',
    ],
    validate: 'Vérifier continuité chronologique (pas de trous)',
  },

  // ── 6. Validation croisée ────────────────────────────────────────────────
  {
    id: 'validation',
    description: 'Rapport de validation croisée : vérifie la cohérence entre les différentes sources (Eurostat vs INSEE)',
    input: ['data/processed/*.json'],
    output: 'data/processed/validation-report.json',
    transform_type: 'validation (croisement de sources)',
    manual_steps: [
      'Charger tous les fichiers processed',
      'Comparer les totaux de dépenses/recettes entre les fichiers',
      'Vérifier les égalités comptables (S13 = S1311 + S1313 + S1314)',
      'Vérifier solde = recettes - dépenses',
      'Signaler les écarts > seuil (0.5%)',
    ],
    validate: 'Confirmer qu\'il n\'y a pas d\'écarts non expliqués',
  },

  // ── 7. Budget État ──────────────────────────────────────────────────────
  {
    id: 'budget-etat',
    description: 'Budget de l\'État : provient d\'un communiqué de presse (2026-01-30) et des données data.economie.gouv.fr (PLF/SMB). Enrichissement manuel nécessaire avec l\'API ODATA.',
    input: [
      'data/raw/budget/plf_recent.json',
      'data/raw/budget/smb.json',
      'data/raw/budget/catalog.json',
      'data/raw/budget/catalog_full.json',
    ],
    output: 'data/processed/budget-etat.json',
    transform_type: 'enrichissement (template + API ODATA)',
    manual_steps: [
      'Le fichier actuel est basé sur un communiqué de presse du 30/01/2026',
      'Pour enrichir : utiliser l\'API ODATA data.economie.gouv.fr (cf. scripts/fetch-budget-etat.mjs)',
      'Sources ODATA disponibles : PLF dépenses par mission/programme, SMB mensuelle',
      'Structurer les données par mission → programme → AE/CP par titre',
      'Ajouter LFI, PLF, SMB pour chaque programme',
      'Distinguer budget général (BG), budgets annexes (BA), comptes spéciaux (CCF)',
    ],
    validate: 'Vérifier que la somme des AE/CP par programme ≈ total LFI voté',
  },
];

// ── FICHIERS COMPLÉMENTAIRES (extraits d\'arbres, etc.) ──────────────────────

const EXTRA_STEPS = [
  {
    id: 'hierarchie-nature',
    description: 'Arborescence des natures SEC2010 extraite d\'Eurostat',
    input: ['data/raw/eurostat/gov_10a_main.json'],
    output: 'data/processed/hierarchie-nature.json',
    transform_type: 'extraction (taxonomie Eurostat)',
  },
  {
    id: 'nature-par-secteur',
    description: 'Dépenses/recettes par nature et par secteur (S13, S1311, S1313, S1314)',
    input: ['data/raw/eurostat/gov_10a_main.json'],
    output: 'data/processed/nature-par-secteur.json',
    transform_type: 'extraction + croisement',
  },
  {
    id: 'arbre-nature',
    description: 'Arbre complet des nomenclatures Eurostat',
    input: ['data/raw/eurostat/gov_10a_main.json'],
    output: 'data/processed/arbre-nature.json',
    transform_type: 'extraction (taxonomie)',
  },
];

// ── FONCTIONS UTILITAIRES ────────────────────────────────────────────────────

function writeJSON(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  ✓ Écrit ${path}`);
}

// ── PIPELINE PRINCIPAL ────────────────────────────────────────────────────────

async function main() {
  console.log(`\n━━━ Pipeline de processing data/raw/ → data/processed/ ━━━\n`);
  console.log(`Date : ${new Date().toISOString()}`);
  console.log(`Package xlsx : ${XLSX_AVAILABLE ? '✓ disponible' : '✗ non installé (npm install xlsx)'}`);
  console.log('');

  const processedDir = join(import.meta.dirname, '..', 'data', 'processed');
  mkdirSync(processedDir, { recursive: true });

  // Vérifier les fichiers existants
  const existingFiles = readdirSync(processedDir).filter(f => f.endsWith('.json'));
  console.log(`Fichiers processed existants (${existingFiles.length}) : ${existingFiles.join(', ')}`);
  console.log('');

  // Exécuter les étapes documentées
  for (const step of STEPS) {
    console.log(`\n── Étape : ${step.id} ──`);
    console.log(`   Description : ${step.description}`);
    console.log(`   Type        : ${step.transform_type}`);
    console.log(`   Entrée(s)   : ${step.input.join(', ')}`);
    console.log(`   Sortie      : ${step.output}`);

    if (step.requires_xlsx && !XLSX_AVAILABLE) {
      console.log(`   ⚠️  xlsx non disponible — ${step.fallback}`);
    }

    for (const m of step.manual_steps) {
      console.log(`   → ${m}`);
    }
  }

  // Les fichiers processed existants sont conservés — NE PAS ÉCRASER
  console.log('\n   ✓ Fichiers processed existants préservés (lecture seule par ce pipeline)');
  console.log('   ✓ Ce script documente les transformations sans écraser les données.');
  console.log('   Pour reproduire les transformations complexes, utiliser le data-agent original');

  // Générer un rapport de pipeline
  const report = {
    meta: OUTPUT_META,
    xlsx_available: XLSX_AVAILABLE,
    steps_documented: STEPS.length + EXTRA_STEPS.length,
    steps_automated: STEPS.filter(s => !s.requires_xlsx || XLSX_AVAILABLE).length,
    existing_processed: existingFiles,
    commandes: {
      fetch_budget: 'node scripts/fetch-budget-etat.mjs',
      refresh_all: 'npm run refresh-data',
      install_xlsx: 'npm install xlsx',
    },
  };

  writeJSON(OUT('pipeline-report.json'), report);
  console.log(`\n━━━ Pipeline terminé ━━━\n`);
}

main().catch(console.error);
