import { readFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data", "processed");

export interface SyntheseAnnuelle {
  recettes: number;
  depenses: number;
  solde: number;
  dette: number;
  pib: number;
  recettes_pct_pib: number;
  depenses_pct_pib: number;
  dette_pct_pib: number;
}

export interface DonneesCles {
  recettes: number;
  depenses: number;
  solde: number;
  dette: number;
  pib: number;
  recettes_pct_pib: number;
  depenses_pct_pib: number;
  dette_pct_pib: number;
}

export interface BudgetEtatData {
  meta: Record<string, unknown>;
  synthese_etat: Record<string, {
    recettes_nettes_bg_meur?: number;
    depenses_pde_meur?: number;
    solde_budgetaire_meur?: number;
    solde_apuc_meur?: number;
    solde_apu_meur?: number;
    amélioration_vs_lfg_meur?: number;
    amélioration_vs_lfi_meur?: number;
    amélioration_vs_2024_meur?: number;
  }>;
  recettes_fiscales_etat: {
    categorie: string;
    montant_meur_2025?: number;
    variation_vs_lfg_meur?: number;
    note: string;
  }[];
  depenses_par_mission: {
    mission: string;
    programmes: string[];
    note?: string;
  }[];
  comptes_speciaux: Record<string, unknown>;
}

export interface SerieRecette {
  categorie: string;
  code_sec2010?: string;
  code?: string;
  unite: string;
  donnees: { annee: number; montant: number }[];
}

export interface SerieDepense {
  categorie: string;
  code?: string;
  code_sec2010?: string;
  unite: string;
  donnees: { annee: number; montant: number }[];
}

export interface MissionBudgetaire {
  mission: string;
  programmes: { programme: string; montant_meur: number }[];
}

export interface SyntheseData {
  meta: Record<string, unknown>;
  synthese_annuelle: Record<string, SyntheseAnnuelle>;
  donnees_cles_2025: DonneesCles;
}

export interface RecettesData {
  meta: Record<string, unknown>;
  recettes_par_categorie: SerieRecette[];
  total_recettes: { categorie: string; code_sec2010: string; unite: string; donnees: { annee: number; montant: number }[] };
}

export interface DepensesData {
  meta: Record<string, unknown>;
  depenses_par_categorie: SerieDepense[];
  missions_budgetaires: MissionBudgetaire[];
  total_depenses: { categorie: string; code_sec2010: string; unite: string; donnees: { annee: number; montant: number }[] };
}

export interface ApuData {
  meta: Record<string, unknown>;
  depenses_par_sous_secteur_eurostat: Record<string, { annee: number; total_depenses: number }[]>;
}

export interface SeriesLonguesData {
  meta: Record<string, unknown>;
  series: Record<string, { code: string; unite: string; donnees: Record<string, number> }>;
}

export interface TreeNode {
  code: string;
  label: string;
  values?: Record<string, number>;
  children?: TreeNode[];
}

export interface ArbreNatureData {
  meta: Record<string, unknown>;
  depenses: TreeNode;
  recettes: TreeNode;
}

export interface NatureParSecteurData {
  meta: Record<string, unknown>;
  labels: Record<string, string>;
  data: Record<string, Record<string, Record<string, number>>>;
}

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, file), "utf-8")) as T;
}

export function loadSynthese(): SyntheseData {
  return loadJson<SyntheseData>("synthese.json");
}

export function loadRecettes(): RecettesData {
  return loadJson<RecettesData>("recettes-etat.json");
}

export function loadDepenses(): DepensesData {
  return loadJson<DepensesData>("depenses-ministeres.json");
}

export function loadApu(): ApuData {
  return loadJson<ApuData>("apu-depenses.json");
}

export function loadSeriesLongues(): SeriesLonguesData {
  return loadJson<SeriesLonguesData>("series-longues.json");
}

export function loadBudgetEtat(): BudgetEtatData {
  return loadJson<BudgetEtatData>("budget-etat.json");
}

export function loadArbreNature(): ArbreNatureData {
  return loadJson<ArbreNatureData>("arbre-nature.json");
}

export function loadNatureParSecteur(): NatureParSecteurData {
  return loadJson<NatureParSecteurData>("nature-par-secteur.json");
}

export function getAllData() {
  return {
    synthese: loadSynthese(),
    recettes: loadRecettes(),
    depenses: loadDepenses(),
    apu: loadApu(),
    series: loadSeriesLongues(),
    budgetEtat: loadBudgetEtat(),
    arbreNature: loadArbreNature(),
    natureParSecteur: loadNatureParSecteur(),
  };
}
