export interface RecetteEtat {
  annee: number
  categorie: string
  montant_meur: number
  part_pib?: number
  variation_annuelle_pct?: number
  source: string
  url?: string
}

export interface DepenseMinistere {
  annee: number
  ministere: string
  mission: string
  autorisations_engagement_meur: number
  credits_paiement_meur: number
  effectifs?: number
  source: string
  url?: string
}

export interface ApuDepense {
  annee: number
  sous_secteur: string
  nature: string
  montant_meur: number
  part_pib?: number
  source: string
  url?: string
}

export interface SyntheseFinances {
  annee: number
  perimetre: "Etat" | "APU" | "APUC" | "APUL" | "ASSO"
  recettes_meur: number
  depenses_meur: number
  solde_meur: number
  dette_pct_pib?: number
  source_recettes: string
  source_depenses: string
}

export interface SyntheseAnnuelle {
  recettes: number
  depenses: number
  solde: number
  dette: number
  pib: number
  recettes_pct_pib: number
  depenses_pct_pib: number
  dette_pct_pib: number
}

export interface DonneesCles {
  recettes: number
  depenses: number
  solde: number
  dette: number
  pib: number
  recettes_pct_pib: number
  depenses_pct_pib: number
  dette_pct_pib: number
}

export interface BudgetEtatData {
  meta: Record<string, unknown>
  synthese_etat: Record<string, {
    recettes_nettes_bg_meur?: number
    depenses_pde_meur?: number
    solde_budgetaire_meur?: number
    solde_apuc_meur?: number
    solde_apu_meur?: number
    amélioration_vs_lfg_meur?: number
    amélioration_vs_lfi_meur?: number
    amélioration_vs_2024_meur?: number
  }>
  recettes_fiscales_etat: {
    categorie: string
    montant_meur_2025?: number
    variation_vs_lfg_meur?: number
    note: string
  }[]
  depenses_par_mission: {
    mission: string
    programmes: string[]
    note?: string
  }[]
  comptes_speciaux: Record<string, unknown>
}

export interface SerieRecette {
  categorie: string
  code_sec2010?: string
  code?: string
  unite: string
  donnees: { annee: number; montant: number }[]
}

export interface SerieDepense {
  categorie: string
  code?: string
  code_sec2010?: string
  unite: string
  donnees: { annee: number; montant: number }[]
}

export interface MissionBudgetaire {
  mission: string
  programmes: { programme: string; montant_meur: number }[]
}

export interface SyntheseData {
  meta: Record<string, unknown>
  synthese_annuelle: Record<string, SyntheseAnnuelle>
  donnees_cles_2025: DonneesCles
}

export interface RecettesData {
  meta: Record<string, unknown>
  recettes_par_categorie: SerieRecette[]
  total_recettes: { categorie: string; code_sec2010: string; unite: string; donnees: { annee: number; montant: number }[] }
}

export interface DepensesData {
  meta: Record<string, unknown>
  depenses_par_categorie: SerieDepense[]
  missions_budgetaires: MissionBudgetaire[]
  total_depenses: { categorie: string; code_sec2010: string; unite: string; donnees: { annee: number; montant: number }[] }
}

export interface ApuData {
  meta: Record<string, unknown>
  depenses_par_sous_secteur_eurostat: Record<string, { annee: number; total_depenses: number }[]>
}

export interface SeriesLonguesData {
  meta: Record<string, unknown>
  series: Record<string, { code: string; unite: string; donnees: Record<string, number> }>
}

export interface TreeNode {
  code: string
  label: string
  values?: Record<string, number>
  children?: TreeNode[]
}

export interface ArbreNatureData {
  meta: Record<string, unknown>
  depenses: TreeNode
  recettes: TreeNode
}

export interface NatureParSecteurData {
  meta: Record<string, unknown>
  labels: Record<string, string>
  data: Record<string, Record<string, Record<string, number>>>
}

export interface ProjectionEntry {
  annee: number
  valeur: number
}

export interface CofogArbreData {
  meta: Record<string, unknown>
  depenses: TreeNode
}

export interface SmbMensuelEntry {
  mois: number
  total_ae_meur: number
  total_cp_meur: number
  taux_execution_ae_pct: number
  taux_execution_cp_pct: number
}

export interface SmbCumulEntry {
  mois: number
  ae_cumul_meur: number
  cp_cumul_meur: number
}

export interface SmbMensuelData {
  meta: Record<string, unknown>
  mensuel: SmbMensuelEntry[]
  cumul: SmbCumulEntry[]
  total_lfi_ae_meur: number
  total_lfi_cp_meur: number
}

export interface ProjectionsData {
  meta: Record<string, unknown>
  projections: Record<string, ProjectionEntry[]>
}

export interface MissionAnnuelle {
  mission: string
  code_mission: string
  type_mission: string
  ae_meur: number
  cp_meur: number
}

export interface MissionsHistoriqueData {
  meta: Record<string, unknown>
  missions_par_annee: Record<string, MissionAnnuelle[]>
}

export interface EffectifsData {
  meta: Record<string, unknown>
  effectifs: Record<string, Record<string, number>>
}

export interface FinanceurEntry {
  financeur: string
  label: string
  values: Record<string, number>
  detail: { code: string; label: string; values: Record<string, number> }[]
}

export interface FinanceursData {
  meta: Record<string, unknown>
  financeurs: Record<string, FinanceurEntry[]>
}
