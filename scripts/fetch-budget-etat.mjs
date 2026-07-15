#!/usr/bin/env node
/**
 * Enrichissement de data/processed/budget-etat.json via l'API ODATA
 * de data.economie.gouv.fr.
 *
 * Usage: node scripts/fetch-budget-etat.mjs
 *
 * API ODATA : https://data.economie.gouv.fr/api/explore/v2.1/
 *
 * Datasets utilisés :
 *   - PLF 2025 dépenses : plf25-depenses-2025-du-bg-et-des-ba-selon-nomenclatures-destination-et-nature
 *   - PLF 2025 recettes : plf25-recettes-fiscales-2025-du-bg-et-des-ba-selon-nomenclature-destination
 *
 * Prérequis : Node.js 18+ (fetch natif)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const PROCESSED_FILE = join(ROOT, 'data', 'processed', 'budget-etat.json');

const API_BASE = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets';
const PLF_DEPENSES_2025 = `${API_BASE}/plf25-depenses-2025-du-bg-et-des-ba-selon-nomenclatures-destination-et-nature/records`;
const PLF_RECETTES_2025 = `${API_BASE}/plf25-recettes-fiscales-2025-du-bg-et-des-ba-selon-nomenclature-destination/records`;
const CATALOG_URL = `${API_BASE}`;

const LIMIT = 100; // 100 records par page
const MAX_RECORDS = 2500; // maximum total

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function fetchJSON(url, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.warn(`  ⚠️  HTTP ${res.status} ${url}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`  ⚠️  ${err.message}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAllPages(baseUrl, limit = LIMIT, maxRecords = MAX_RECORDS) {
  const all = [];
  let offset = 0;
  while (offset < maxRecords) {
    const url = `${baseUrl}?limit=${limit}&offset=${offset}`;
    const data = await fetchJSON(url);
    if (!data?.results?.length) break;
    all.push(...data.results);
    console.log(`    → fetched ${all.length}/${data.total_count || '?'}`);
    if (all.length >= (data.total_count || maxRecords)) break;
    offset += limit;
  }
  return all;
}

function aggregateByProgramme(records) {
  const programmes = new Map();
  const missions = new Map();

  for (const r of records) {
    const progKey = `${r.code_mission}-${r.programme}`;
    if (!programmes.has(progKey)) {
      programmes.set(progKey, {
        code_mission: r.code_mission,
        mission: r.mission,
        programme: r.programme,
        libelle_programme: r.libelle_programme,
        type_mission: r.type_mission,
        ministere: r.ministere,
        ae_plf: 0,
        cp_plf: 0,
        ae_prev_fdc_adp: 0,
        cp_prev_fdc_adp: 0,
        actions: [],
      });
    }
    const prog = programmes.get(progKey);
    prog.ae_plf += Number(r.ae_plf) || 0;
    prog.cp_plf += Number(r.cp_plf) || 0;
    prog.ae_prev_fdc_adp += Number(r.ae_prev_fdc_adp) || 0;
    prog.cp_prev_fdc_adp += Number(r.cp_prev_fdc_adp) || 0;

    if (r.action && !prog.actions.some(a => a.code === r.action)) {
      prog.actions.push({
        code: r.action,
        libelle: r.libelle_action,
        sous_actions: r.sous_action ? [{ code: r.sous_action, libelle: r.libelle_sousaction }] : [],
      });
    }

    if (!missions.has(r.code_mission)) {
      missions.set(r.code_mission, {
        code_mission: r.code_mission,
        mission: r.mission,
        type_mission: r.type_mission,
        ae_plf: 0,
        cp_plf: 0,
        programmes: new Set(),
      });
    }
    const miss = missions.get(r.code_mission);
    miss.ae_plf += Number(r.ae_plf) || 0;
    miss.cp_plf += Number(r.cp_plf) || 0;
    miss.programmes.add(r.programme);
  }

  function toMds(v) { return Math.round(v / 1e9 * 100) / 100; }

  return {
    missions: Array.from(missions.values()).map(m => ({
      ...m,
      ae_mds: toMds(m.ae_plf),
      cp_mds: toMds(m.cp_plf),
      programmes: Array.from(m.programmes).sort((a, b) => a - b),
      nb_programmes: m.programmes.size,
    })),
    programmes: Array.from(programmes.values()).map(p => ({
      ...p,
      ae_mds: toMds(p.ae_plf),
      cp_mds: toMds(p.cp_plf),
      ae_prev_mds: toMds(p.ae_prev_fdc_adp),
      cp_prev_mds: toMds(p.cp_prev_fdc_adp),
    })),
  };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n━━━ Fetch Budget État — data.economie.gouv.fr ODATA ━━━\n');

  // 1. Charger l'existant
  const current = existsSync(PROCESSED_FILE)
    ? JSON.parse(readFileSync(PROCESSED_FILE, 'utf-8'))
    : null;

  if (current) {
    console.log(`✓ Fichier existant : ${PROCESSED_FILE} (màj: ${current.meta?.mise_a_jour})`);
  }

  // 2. Fetch PLF dépenses 2025
  console.log('\n── Fetch PLF 2025 dépenses ──');
  const plfRecords = await fetchAllPages(PLF_DEPENSES_2025);
  console.log(`  ✓ ${plfRecords.length} enregistrements PLF dépenses récupérés`);

  // 3. Agréger par programme / mission
  let aggregated = null;
  let totalAE = 0;
  let totalCP = 0;

  if (plfRecords.length > 0) {
    aggregated = aggregateByProgramme(plfRecords);
    // Raw euros sum → Md€ (milliards)
    const totalMdsAE = aggregated.missions.reduce((s, m) => s + m.ae_mds, 0);
    const totalMdsCP = aggregated.missions.reduce((s, m) => s + m.cp_mds, 0);
    totalAE = Math.round(totalMdsAE * 100) / 100;
    totalCP = Math.round(totalMdsCP * 100) / 100;
    console.log(`  ✓ ${aggregated.missions.length} missions, ${aggregated.programmes.length} programmes`);
    console.log(`  ✓ Total AE PLF 2025 : ${totalAE} Md€`);
    console.log(`  ✓ Total CP PLF 2025 : ${totalCP} Md€`);
  }

  // 4. Construire le fichier enrichi
  const now = new Date().toISOString();
  const enriched = current ? JSON.parse(JSON.stringify(current)) : {};

  // Métadonnées enrichies
  enriched.meta = {
    ...enriched.meta,
    last_fetched: now,
    fetched_by: 'scripts/fetch-budget-etat.mjs',
    api_base: API_BASE,
    odata_datasets: {
      plf_depenses_2025: PLF_DEPENSES_2025,
      plf_recettes_2025: PLF_RECETTES_2025,
    },
    api_status: plfRecords.length > 0 ? 'OK' : 'INDISPONIBLE',
  };

  // Données PLF
  if (aggregated) {
    enriched.plf_2025 = {
      source: 'data.economie.gouv.fr — PLF 2025 dépenses (ODATA)',
      unite: 'Md€',
      total_ae_mds: totalAE,
      total_cp_mds: totalCP,
      nb_missions: aggregated.missions.length,
      nb_programmes: aggregated.programmes.length,
      nb_enregistrements: plfRecords.length,
      missions: aggregated.missions
        .sort((a, b) => b.ae_mds - a.ae_mds)
        .map(m => ({
          code_mission: m.code_mission,
          mission: m.mission,
          type: m.type_mission,
          ae_mds: m.ae_mds,
          cp_mds: m.cp_mds,
          nb_programmes: m.nb_programmes,
        })),
      programmes: aggregated.programmes
        .sort((a, b) => b.ae_mds - a.ae_mds)
        .map(p => ({
          code_mission: p.code_mission,
          mission: p.mission,
          numero: p.programme,
          programme: p.libelle_programme,
          type_mission: p.type_mission,
          ministere: p.ministere,
          ae_mds: p.ae_mds,
          cp_mds: p.cp_mds,
          actions: p.actions.length,
        })),
    };
  }

  // Compléter la section depenses_par_mission existante
  if (aggregated) {
    enriched.depenses_par_mission = aggregated.missions
      .sort((a, b) => (b.ae_mds - a.ae_mds))
      .map(m => {
        const progs = aggregated.programmes
          .filter(p => p.code_mission === m.code_mission)
          .sort((a, b) => b.ae_mds - a.ae_mds);

        return {
          mission: m.mission,
          code_mission: m.code_mission,
          type_mission: m.type_mission,
          ae_mds: m.ae_mds,
          cp_mds: m.cp_mds,
          programmes: progs.map(p => ({
            numero: p.programme,
            programme: p.libelle_programme,
            ae_mds: p.ae_mds,
            cp_mds: p.cp_mds,
            actions: p.actions.length,
          })),
        };
      });

    // Ajouter le total
    enriched.depenses_par_mission.unshift({
      mission: 'TOTAL PLF 2025',
      code_mission: 'TOTAL',
      unite: 'Md€',
      ae_mds: totalAE,
      cp_mds: totalCP,
      programmes: [],
    });
  }

  enriched.annees_disponibles = [...new Set([
    ...(enriched.annees_disponibles || []),
    2026,
  ])].sort();

  enriched.sources_api = {
    data_economie: {
      url: 'https://data.economie.gouv.fr/',
      api: API_BASE,
      licence: 'Licence Ouverte v2.0 (Etalab)',
    },
    budget_gouv: {
      url: 'https://www.budget.gouv.fr/',
      smb: 'https://www.budget.gouv.fr/budget-etat/smb',
    },
  };

  // 5. Écrire
  mkdirSync(join(ROOT, 'data', 'processed'), { recursive: true });
  writeFileSync(PROCESSED_FILE, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`\n✓ Écrit : ${PROCESSED_FILE} (${enriched.plf_2025?.missions?.length || 0} missions structurées)`);

  console.log('\n━━━ Terminé ━━━\n');
}

main().catch(err => {
  console.error('Erreur :', err);
  process.exit(1);
});
