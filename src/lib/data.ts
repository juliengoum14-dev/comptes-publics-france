import { readFileSync } from "fs";
import { join } from "path";
import type {
  SyntheseData,
  RecettesData,
  DepensesData,
  ApuData,
  SeriesLonguesData,
  BudgetEtatData,
  ArbreNatureData,
  NatureParSecteurData,
  ProjectionsData,
  SmbMensuelData,
  CofogDepensesData,
  MissionsHistoriqueData,
} from "@/types";

const DATA_DIR = join(process.cwd(), "data", "processed");

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, file), "utf-8")) as T;
}

export function loadSynthese(): SyntheseData {
  return loadJson<SyntheseData>("synthese.json");
}

export function loadRecettes(): RecettesData {
  return loadJson<RecettesData>("recettes-apu.json");
}

export function loadDepenses(): DepensesData {
  return loadJson<DepensesData>("depenses-apu.json");
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

export function loadProjections(): ProjectionsData {
  return loadJson<ProjectionsData>("projections-ragot.json");
}

export function loadMissionsHistorique(): MissionsHistoriqueData {
  return loadJson<MissionsHistoriqueData>("missions-historique.json");
}

export function loadSmbMensuel(): SmbMensuelData {
  return loadJson<SmbMensuelData>("smb-mensuel.json");
}

export function loadCofogDepenses(): CofogDepensesData {
  return loadJson<CofogDepensesData>("cofog-depenses.json");
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
    projections: loadProjections(),
    missionsHistorique: loadMissionsHistorique(),
    smb: loadSmbMensuel(),
    cofog: loadCofogDepenses(),
  };
}
