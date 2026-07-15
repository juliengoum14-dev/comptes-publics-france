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

export interface BudgetEtat {
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
