# Source data.gouv.fr

## Métadonnées

- **URL de base** : https://www.data.gouv.fr
- **Formats disponibles** : CSV / XLSX / JSON / PDF / API
- **Périmètre** : État + APU + Collectivités + Sécurité sociale (multi-producteurs)
- **Granularité** : variable selon dataset
- **Périodicité** : variable (mensuelle à annuelle)
- **Séries disponibles** : variables selon jeu de données
- **Licence** : ouverte (Licence Ouverte)
- **API disponible** : oui — https://www.data.gouv.fr/api/
- **Fiabilité** : variable (producteurs officiels + société civile)
- **Dernière mise à jour** : continue
- **Facilité d'accès** : téléchargement direct via portail

## Producteurs clés pour les finances publiques

| Producteur | Datasets | Données |
|---|---|---|
| Ministères économiques et financiers | 639 | Budget, comptabilité, fiscalité, collectivités |
| Cour des comptes | 237 | Exécution budgétaire, finances locales |
| DGFIP | multiples | Situation mensuelle, balances comptables |

## Jeux de données pertinents

- Données de comptabilité générale de l'État sur dix ans
- Situation mensuelle de l'État (DGFIP)
- Balances comptables des collectivités
- PLF / PAP (données structurées)
- Agrégats comptables des collectivités
- Impôts locaux, DVF, etc.

## URLs directes

- Catalogue : https://www.data.gouv.fr/datasets
- Minéco : https://www.data.gouv.fr/organizations/ministeres-economiques-et-financiers/datasets
- Cour des comptes : https://www.data.gouv.fr/organizations/cour-des-comptes/datasets
- Comptabilité générale État : https://www.data.gouv.fr/datasets/donnees-de-comptabilite-generale-de-letat-sur-dix-ans

## Observations

- Source VASTE : 639 datasets pour Minéco seul
- Nécessite filtrage pour trouver les données pertinentes
- Qualité variable selon le producteur
- API REST documentée

## Statut

```json
{"status": "success", "source": "datagouv", "urls_found": ["https://www.data.gouv.fr/datasets", "https://www.data.gouv.fr/organizations/ministeres-economiques-et-financiers/datasets", "https://www.data.gouv.fr/organizations/cour-des-comptes/datasets"], "sub_agents_used": 0, "has_structured_data": true, "summary": "Portail open data national. Source très vaste avec 639+ datasets Minéco, 237 Cour des comptes. API disponible.", "recommendations": ["Priorité haute comme hub de données", "Nécessite filtrage par tags 'finances publiques'", "API pour recherche automatisée", "Créer sous-ensembles par producteur"]}
```
