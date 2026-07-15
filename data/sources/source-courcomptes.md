# Source Cour des Comptes

## Métadonnées

- **URL de base** : https://www.ccomptes.fr
- **Formats disponibles** : PDF / HTML / données structurées sur data.gouv.fr
- **Périmètre** : État + APU + Sécurité sociale + Collectivités locales
- **Granularité** : rapports détaillés par mission/programme + analyses transverses
- **Périodicité** : annuelle + thématique
- **Séries disponibles** : depuis ~2010 selon les rapports
- **Licence** : ouverte
- **API disponible** : non (PDF) / oui via data.gouv.fr
- **Fiabilité** : source officielle (institution constitutionnelle)
- **Dernière mise à jour** : juin 2026 (RSPFP 2026)
- **Facilité d'accès** : téléchargement PDF direct

## Rapports clés

| Rapport | Périodicité | Contenu |
|---|---|---|
| Situation et perspectives des FP (RSPFP) | Annuelle (juillet) | Ensemble APU, analyse + perspectives |
| Budget de l'État (RBDE) | Annuelle (avril) | Exécution budgétaire détaillée |
| Certification des comptes de l'État | Annuelle (avril-mai) | Fiabilité des comptes |
| Sécurité sociale | Annuelle (mai) | Comptes de la SS |
| Finances publiques locales | Annuelle (juin-octobre) | Collectivités |
| Notes d'analyse par mission | Annuelle (avril) | Analyses détaillées par mission budgétaire |

## URLs directes

- Cour des comptes : https://www.ccomptes.fr
- RSPFP 2026 PDF : https://www.ccomptes.fr/sites/default/files/2026-06/20260625-RSPFP-2026.pdf
- RBDE 2025 synthèse : https://program-evaluation.ccomptes.fr/sites/default/files/2026-04/20260422-synthese-RBDE-2025.pdf
- Situation FP début 2025 : https://www.ccomptes.fr/sites/default/files/2025-02/20250213-Situation-des-finances-publiques-debut-2025_0.pdf
- Data.gouv.fr Cour : https://www.data.gouv.fr/organizations/cour-des-comptes/datasets
- Recettes fiscales 2025 : https://program-evaluation.ccomptes.fr/sites/default/files/2026-04/NEB-2026-Recettes-fiscales.pdf
- Dépenses fiscales 2025 : https://www.ccomptes.fr/sites/default/files/2026-04/NEB-2026-Depenses-fiscales.pdf

## Observations

- Rapports très détaillés mais format PDF uniquement
- Nombreuses données chiffrées dans les rapports
- 237 jeux de données sur data.gouv.fr
- Analyse critique et recommandations
- Calendrier prévisible des publications

## Statut

```json
{"status": "success", "source": "courcomptes", "urls_found": ["https://www.ccomptes.fr", "https://www.ccomptes.fr/sites/default/files/2026-06/20260625-RSPFP-2026.pdf", "https://program-evaluation.ccomptes.fr/sites/default/files/2026-04/20260422-synthese-RBDE-2025.pdf", "https://www.data.gouv.fr/organizations/cour-des-comptes/datasets"], "sub_agents_used": 0, "has_structured_data": false, "summary": "Rapports PDF très riches en données. Pas de données brutes structurées natives (sauf data.gouv.fr). Analyse critique de référence.", "recommendations": ["Priorité moyenne : données dans PDF à parser", "Utiliser rapports pour validation croisée", "237 datasets sur data.gouv.fr complémentaires", "Parser PDF pour extraire séries chiffrées"]}
```
