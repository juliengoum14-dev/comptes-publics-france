# Comptes Publics France — Données traitées

> Généré par le data-agent le 15 juillet 2026

## Fichiers produits

| Fichier | Contenu | Source | Années |
|---|---|---|---|
| `recettes-etat.json` | Recettes de l'État/APU par catégorie (TVA, IR, IS, cotisations sociales, etc.) | Eurostat + INSEE | 1995–2025 |
| `depenses-ministeres.json` | Dépenses APU par nature (prestations, salaires, subventions, FBCF, intérêts) | Eurostat | 1995–2025 |
| `apu-depenses.json` | Comptes APU par sous-secteur (S13, S1311, S1313, S1314) | INSEE | 1949–2025 |
| `series-longues.json` | Séries temporelles (PIB, recettes, dépenses, dette, déficit, en Md€ et % PIB) | Eurostat | 1995–2025 |
| `synthese.json` | Vue d'ensemble annuelle (recettes, dépenses, solde, dette, % PIB) | Eurostat | 1995–2025 |
| `validation-report.json` | Rapport de validation croisée | — | — |

## Structure

### recettes-etat.json
- `recettes_par_categorie[]`: { categorie, code_sec2010, unite, donnees[{ annee, montant }] }
- `total_recettes`: agrégat TR (total recettes APU)
- `annees_couvertes`: [1995, 2025]

### depenses-ministeres.json
- `depenses_par_categorie[]`: { categorie, code_sec2010, unite, donnees[{ annee, montant }] }
- `total_depenses`: agrégat TE (total dépenses APU)
- `missions_budgetaires`: structure des missions PLF (à enrichir)

### apu-depenses.json
- `sous_secteurs`: { code: { nom, donnees[{ annee, poste, montant }], nb_lignes, annees } }
- `depenses_par_sous_secteur_eurostat`: { code_secteur: [{ annee, total_depenses }] }

### series-longues.json
- `series`: { nom: { code, unite, donnees: { annee: valeur } } }
- Indicateurs : PIB, Dépenses APU, Recettes APU, Dette, Déficit (+ % PIB)

### synthese.json
- `synthese_annuelle`: { annee: { recettes, depenses, solde, dette, pib, recettes_pct_pib, depenses_pct_pib, dette_pct_pib } }
- `donnees_cles_2025`: dernières données disponibles

## Périmètre

- **APU** (S13) : ensemble des administrations publiques (comptabilité nationale SEC 2010)
- **S1311** : administration centrale (État + ODAC)
- **S1313** : administrations publiques locales
- **S1314** : administrations de sécurité sociale

## Notes

- Base 2020 (INSEE), ESA 2010 (Eurostat)
- Montants en Md€ sauf indication contraire (% PIB)
- Rupture de série possible entre données INSEE base 2020 et séries antérieures
- Budget État (PLF) ≠ APU : le périmètre APU inclut les collectivités et la Sécurité sociale
