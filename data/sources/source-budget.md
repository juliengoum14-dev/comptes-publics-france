# Source Direction du Budget / PLF

## Métadonnées

- **URL de base** : https://www.budget.gouv.fr + https://data.economie.gouv.fr
- **Formats disponibles** : PDF / XLSX / CSV / HTML
- **Périmètre** : Budget de l'État (recettes + dépenses par mission/programme/titre)
- **Granularité** : par mission, programme, action, titre, nature, destination
- **Périodicité** : annuelle (PLF/LFI) + mensuelle (SMB)
- **Séries disponibles** : depuis 2017 (SMB), depuis 2000+ (données budgétaires historiques)
- **Licence** : ouverte (Licence Ouverte)
- **API disponible** : oui — https://data.economie.gouv.fr/api/
- **Fiabilité** : source officielle (Direction du Budget)
- **Dernière mise à jour** : juin 2026 (SMB mai 2026)
- **Facilité d'accès** : téléchargement direct + portail open data

## Données disponibles

- **PLF 2025/2026** : Projets de loi de finances avec annexes
- **PAP** : Projets Annuels de Performance (par mission/programme)
- **LFI** : Loi de finances initiale votée
- **SMB** : Situation Mensuelle du Budget (exécution infra-annuelle)
- **Budget Vert** : Classification environnementale des dépenses
- **Chiffres clés** : Synthèses budgétaires
- **Données exploituables** : Fichiers standard ouverts

## URLs directes

- Budget.gouv.fr : https://www.budget.gouv.fr/budget-etat
- SMB : https://www.budget.gouv.fr/budget-etat/smb
- PLF 2025 : https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2025
- Data économie : https://data.economie.gouv.fr/
- PLF dépenses : https://data.economie.gouv.fr/explore/dataset/plf25-depenses-2025-du-bg-et-des-ba-selon-nomenclatures-destination-et-nature/
- Budget Vert : https://www.data.economie.gouv.fr/explore/dataset/plf25-budget-vert-justification-des-credits-budgetaires-et-des-taxes-affectees/api/

## Observations

- Données très structurées pour le budget de l'État
- Attention : périmètre budgétaire ≠ périmètre comptabilité nationale (APU)
- SMB permet un suivi mensuel de l'exécution
- Formats ouverts disponibles pour la plupart des données

## Statut

```json
{"status": "success", "source": "budget", "urls_found": ["https://www.budget.gouv.fr/", "https://data.economie.gouv.fr/", "https://www.budget.gouv.fr/budget-etat/smb", "https://data.economie.gouv.fr/explore/dataset/plf25-depenses-2025-du-bg-et-des-ba-selon-nomenclatures-destination-et-nature/"], "sub_agents_used": 0, "has_structured_data": true, "summary": "Source officielle pour le budget de l'État. Données structurées, API ODATA, suivi mensuel SMB.", "recommendations": ["Priorité haute pour budget État", "Utiliser API data.economie.gouv.fr", "Distinguer budget État vs APU en comptabilité nationale"]}
```
