# Source INSEE — Comptes nationaux

## Métadonnées

- **URL de base** : https://www.insee.fr/fr/statistiques
- **Formats disponibles** : XLSX / CSV / PDF / HTML
- **Périmètre** : APU (S13) — État (S13111), ODAC (S13112), APUL (S1313), ASSO (S1314)
- **Granularité** : par sous-secteur institutionnel, par nature économique, par fonction
- **Périodicité** : annuelle (mai) + trimestrielle + premiers résultats (mars)
- **Séries disponibles** : depuis 1949 (PIB), depuis 1978 (APU détaillés)
- **Licence** : ouverte (Open Data)
- **API disponible** : oui — https://api.insee.fr/
- **Fiabilité** : source officielle (Institut national de la statistique)
- **Dernière mise à jour** : 29 mai 2026 (comptes annuels 2025, base 2020)
- **Facilité d'accès** : téléchargement direct XLSX/CSV

## Tableaux clés

| Code | Description |
|---|---|
| 7.301 | Compte des APU (S13) |
| 7.302 | Compte de l'administration centrale (S1311) |
| 7.303 | Compte de l'État (S13111) |
| 7.304 | Compte des ODAC (S13112) |
| 7.305 | Compte des APUL (S1313) |
| 7.306 | Compte des ASSO (S1314) |
| 3.201 | Dépenses et recettes des APU |
| 3.215 | Dépenses et recettes par sous-secteur |
| 3.216 | Prélèvements obligatoires |
| 3.217 | Principaux impôts par catégorie |
| 3.101-3.108 | Dette et déficit Maastricht |

## URLs directes

- Comptes nationaux 2025 : https://www.insee.fr/fr/statistiques/8988934
- APU 2025 : https://www.insee.fr/fr/statistiques/8988833
- Finances publiques 2025 : https://www.insee.fr/fr/statistiques/8988841
- Dette Maastricht 2025 : https://www.insee.fr/fr/statistiques/8988843
- Dépenses/recettes APU 2025 : https://www.insee.fr/fr/statistiques/8988845
- Info rapide mars 2026 : https://www.insee.fr/fr/statistiques/8956575
- Données ouvertes catalogue : https://www.insee.fr/fr/statistiques/series

## Observations

- Base 2020 depuis mai 2024 (changement méthodologique majeur)
- Publication annuelle fin mai, premiers résultats fin mars
- Données trimestrielles publiées 30 jours après fin de trimestre
- API REST avec documentation sur api.insee.fr
- Jeu de données "Comptes des administrations publiques" disponible en open data

## Statut

```json
{"status": "success", "source": "insee", "urls_found": ["https://www.insee.fr/fr/statistiques/8988934", "https://www.insee.fr/fr/statistiques/8988833", "https://www.insee.fr/fr/statistiques/8988841", "https://www.insee.fr/fr/statistiques/8988843", "https://www.insee.fr/fr/statistiques/8988845", "https://www.insee.fr/fr/statistiques/8956575", "https://api.insee.fr/"], "sub_agents_used": 0, "has_structured_data": true, "summary": "Source officielle complète pour les comptes des APU. Données structurées XLSX/CSV, séries longues, API disponible.", "recommendations": ["Priorité haute : données structurées et fiables", "Utiliser API INSEE pour automatisation", "Vérifier rupture base 2020 pour séries historiques"]}
```
