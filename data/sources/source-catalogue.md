# Catalogue des sources — Comptes Publics France

> Généré par le research-agent le 15 juillet 2026

## Synthèse exécutive

8 sources explorées couvrant les deux périmètres du projet (Budget de l'État et APU). **5 sources offrent des données structurées téléchargeables** (INSEE, Budget/PLF, data.gouv.fr, Eurostat, Banque de France), **3 sources sont en PDF/HTML** (Cour des Comptes, Fipeco, OFCE).

**Données clés 2025 (INSEE, 27 mars 2026)** :
- Déficit public : 152,5 Md€ (5,1% du PIB)
- Dette publique : 3 460,5 Md€ (115,6% du PIB)
- Recettes APU : 1 561,6 Md€ (+3,9%)
- Dépenses APU : 1 714,1 Md€ (+2,5%)

**Recommandation** : Prioriser l'INSEE pour les données APU consolidées, le portail Budget.gouv.fr pour le budget de l'État, et Eurostat pour les comparaisons européennes. Utiliser data.gouv.fr comme hub pour trouver des jeux complémentaires.

## Tableau récapitulatif

| # | Source | Priorité | Données structurées | Format | API | Périmètre |
|---|---|---|---|---|---|---|
| 1 | [INSEE](source-insee.md) | **Haute** | Oui | XLSX/CSV | Oui | APU complet |
| 2 | [Budget / PLF](source-budget.md) | **Haute** | Oui | XLSX/CSV | Oui | Budget État |
| 3 | [data.gouv.fr](source-datagouv.md) | **Haute** | Oui | CSV/JSON | Oui | Multi-producteurs |
| 4 | [Eurostat](source-eurostat.md) | **Haute** | Oui | CSV/SDMX | Oui | APU UE |
| 5 | [Cour des Comptes](source-courcomptes.md) | Moyenne | Non (PDF) | PDF | Non | APU+État |
| 6 | [Fipeco](source-fipeco.md) | Moyenne | Non (PDF) | PDF | Non | APU pédagogique |
| 7 | [Banque de France](source-bdf.md) | Moyenne | Oui | XLSX/API | Oui | Dette |
| 8 | [OFCE](source-ofce.md) | Basse | Non | HTML/PDF | Non | Prévisions |

## Détail par priorité

### Haute priorité — données structurées, téléchargement direct, mise à jour régulière

**1. INSEE** (`source-insee.md`)
- Source officielle des comptes nationaux
- Tableaux 7.301-7.306 (comptes APU par sous-secteur)
- Tableaux 3.201-3.217 (dépenses/recettes simplifiés)
- Tableaux 3.101-3.108 (dette/déficit Maastricht)
- API REST disponible
- Base 2020 depuis mai 2024

**2. Budget / Direction du Budget** (`source-budget.md`)
- PLF/LFI/PAP (lois de finances)
- SMB (suivi mensuel exécution)
- Portail data.economie.gouv.fr avec API ODATA
- Données par mission/programme/titre

**3. data.gouv.fr** (`source-datagouv.md`)
- 639 datasets Ministères économiques et financiers
- 237 datasets Cour des comptes
- Hub central de l'open data français
- API REST pour recherche/filtrage

**4. Eurostat** (`source-eurostat.md`)
- Données APU harmonisées (ESA 2010)
- Tableaux gov_10q_ggnfa, gov_10a_main, gov_10dd_edpt1
- API SDMX pour extraction automatisée
- Comparaisons européennes

### Priorité moyenne — exploitables avec parsing ou API

**5. Cour des Comptes** (`source-courcomptes.md`)
- Rapports PDF très riches (RSPFP, RBDE, certifications)
- 237 datasets sur data.gouv.fr
- Analyses critiques et recommandations
- Calendrier prévisible

**6. Fipeco** (`source-fipeco.md`)
- Fiches encyclopédiques pédagogiques
- Séries longues (dépenses 1975-2024)
- Analyse des structures des FP
- PDF uniquement

**7. Banque de France** (`source-bdf.md`)
- Données très granulaires sur la dette
- API Webstat
- Émission et détention de titres
- Complément INSEE/AFT

### Priorité basse — partielles ou redondantes

**8. OFCE** (`source-ofce.md`)
- Prévisions macroéconomiques et budgétaires
- Analyses d'impact des mesures
- Pas de données brutes
- Utile pour contexte et validation

## Recommandations pour le data-agent

### Phase 1 — Téléchargement prioritaire

1. **INSEE** : Automatiser via API le téléchargement des tableaux 7.301-7.306 et 3.201-3.217 pour les années N-5 à N
2. **Budget/PLF** : Récupérer les données SMB mensuelles + PLF N et N-1 via data.economie.gouv.fr API
3. **Eurostat** : Extraire les séries France pour gov_10a_main et gov_10dd_edpt1 via API SDMX
4. **data.gouv.fr** : Filtrer les datasets pertinents (tags : finances publiques, budget, comptes publics)

### Phase 2 — Parsing

5. **Cour des Comptes** : Parser les PDF RSPFP et RBDE pour extraire les séries de recettes/dépenses par sous-secteur
6. **Fipeco** : Extraire les séries longues (dépenses 1975-2024) du PDF

### Phase 3 — Consolidation

7. **Banque de France** : Données dette par détenteur (API Webstat)
8. **OFCE** : Utiliser pour les prévisions et analyses de contexte (non structuré)

### Points d'attention

- **Rupture base INSEE** : Passage base 2020 en mai 2024. Les séries antérieures peuvent présenter des ruptures.
- **Périmètres** : Budget État (comptabilité budgétaire) ≠ APU (comptabilité nationale). Ne pas mélanger.
- **Calendrier** : Publications INSEE fin mai (comptes annuels) + fin mars (premiers résultats). Cour des comptes : avril (RBDE), juin (RSPFP), mai (SS).
- **Licences** : Toutes les sources sont en open data / licence ouverte.

## Rapport de fin

```json
{
  "status": "success",
  "sources_explored": 8,
  "sources_prioritized": 7,
  "sources_excluded": 0,
  "sub_agents_launched": 8,
  "sub_agents_failed": 0,
  "report_path": "data/sources/source-catalogue.md",
  "source_files": [
    "data/sources/source-insee.md",
    "data/sources/source-budget.md",
    "data/sources/source-datagouv.md",
    "data/sources/source-courcomptes.md",
    "data/sources/source-fipeco.md",
    "data/sources/source-eurostat.md",
    "data/sources/source-bdf.md",
    "data/sources/source-ofce.md"
  ],
  "top_priority_sources": [
    {
      "name": "INSEE - Comptes des APU",
      "priority": "haute",
      "reason": "Données officielles complètes, format CSV/XLSX structuré, séries depuis 1978, API disponible"
    },
    {
      "name": "Direction du Budget / PLF",
      "priority": "haute",
      "reason": "Budget de l'État détaillé, SMB mensuelle, API data.economie.gouv.fr"
    },
    {
      "name": "data.gouv.fr",
      "priority": "haute",
      "reason": "Hub open data avec 639+ datasets Minéco, 237 Cour des comptes, API REST"
    },
    {
      "name": "Eurostat",
      "priority": "haute",
      "reason": "Données APU harmonisées UE, API SDMX, comparaisons internationales, séries trimestrielles fraîches"
    }
  ],
  "recommendations": [
    "Automatiser téléchargement INSEE via API pour tableaux 7.301-7.306 et 3.201-3.217",
    "Récupérer SMB mensuelle via data.economie.gouv.fr pour suivi infra-annuel",
    "Extraire Eurostat gov_10a_main + gov_10dd_edpt1 via API SDMX",
    "Parser PDF Cour des Comptes (RSPFP + RBDE) pour séries détaillées par sous-secteur",
    "Distinguer périmètre 'Budget État' vs 'APU' dans les traitements",
    "Vérifier rupture de série INSEE base 2020 pour les données historiques",
    "Planifier les téléchargements selon le calendrier des publications"
  ]
}
```
