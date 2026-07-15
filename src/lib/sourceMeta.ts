export interface SourceInfo {
  source: string
  url: string
  methodology: string
}

const SOURCE_REGISTRY: Record<string, SourceInfo> = {
  "Synthèse Eurostat + INSEE": {
    source: "Synthèse Eurostat + INSEE",
    url: "https://www.insee.fr/fr/statistiques/8988845",
    methodology: "Consolidation Eurostat (gov_10a_main) + INSEE comptes nationaux base 2020",
  },
  "Eurostat (gov_10a_main)": {
    source: "Eurostat (gov_10a_main)",
    url: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10a_main",
    methodology: "Principaux agrégats des APU — nomenclature SEC 2010",
  },
  "INSEE (T_7301-7306), Eurostat": {
    source: "INSEE (T_7301-7306), Eurostat",
    url: "https://www.insee.fr/fr/statistiques/8988833",
    methodology: "Comptes des APU par sous-secteur — base 2020 (T_7301–T_7306)",
  },
  "INSEE, Eurostat": {
    source: "INSEE, Eurostat",
    url: "https://www.insee.fr/fr/statistiques/8988845",
    methodology: "Dépenses et recettes des APU — flux monétaires SEC 2010 (t_3201–t_3217)",
  },
  "Eurostat (gov_10a_main, gov_10dd_edpt1)": {
    source: "Eurostat (gov_10a_main, gov_10dd_edpt1)",
    url: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10a_main",
    methodology: "Séries longues APU + dette Maastricht — SEC 2010, 1995–2025",
  },
  "Eurostat gov_10a_main (SDMX)": {
    source: "Eurostat gov_10a_main (SDMX)",
    url: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10a_main",
    methodology: "Ventilation nature × sous-secteur — extraction SDMX",
  },
  "Communiqué de presse economie.gouv.fr (30 janv. 2026), Direction du Budget, INSEE S13111": {
    source: "Communiqué de presse economie.gouv.fr (30 janv. 2026), Direction du Budget, INSEE S13111",
    url: "https://www.budget.gouv.fr/budget-etat/smb",
    methodology: "Comptabilité budgétaire de l'État — solde SMB janvier 2026. Données APUC (S13111) consolidées",
  },
}

const DEFAULT: SourceInfo = {
  source: "INSEE, Eurostat",
  url: "https://www.insee.fr/fr/statistiques/8988845",
  methodology: "SEC 2010 — comptes nationaux base 2020",
}

export function getSourceInfo(source: string): SourceInfo {
  if (!source) return DEFAULT
  if (SOURCE_REGISTRY[source]) return SOURCE_REGISTRY[source]

  for (const [key, info] of Object.entries(SOURCE_REGISTRY)) {
    if (source.includes(key) || key.includes(source)) return info
  }

  return { ...DEFAULT, source }
}
