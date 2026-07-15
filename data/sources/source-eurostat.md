# Source Eurostat

## Métadonnées

- **URL de base** : https://ec.europa.eu/eurostat/web/government-finance-statistics
- **Formats disponibles** : CSV / TSV / JSON / API SDMX / HTML
- **Périmètre** : APU (S13) de tous les États membres UE
- **Granularité** : par sous-secteur, par instrument, par fonction (COFOG)
- **Périodicité** : annuelle (T+9 mois) + trimestrielle (T+3 mois)
- **Séries disponibles** : depuis 1995 (standard), depuis 1970 (certaines séries)
- **Licence** : ouverte (Creative Commons BY)
- **API disponible** : oui — API SDMX 2.1
- **Fiabilité** : source officielle (Commission européenne)
- **Dernière mise à jour** : avril 2026 (données 2025 complètes)
- **Facilité d'accès** : téléchargement direct + API

## Tableaux clés pour la France

| Code | Description |
|---|---|
| gov_10q_ggnfa | Comptes non financiers trimestriels des APU |
| gov_10q_ggfa | Comptes financiers trimestriels des APU |
| gov_10a_ggfa | Comptes financiers annualisés |
| gov_10dd_edpt1 | Procédure déficit excessif (dette/déficit) |
| gov_10a_main | Principaux agrégats des APU |
| gov_10a_exp | Dépenses par fonction (COFOG) |
| gov_10a_taxag | Recettes fiscales détaillées |

## URLs directes

- Portail GFS : https://ec.europa.eu/eurostat/web/government-finance-statistics
- Database : https://ec.europa.eu/eurostat/web/government-finance-statistics/database
- Statistics Explained : https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Government_finance_statistics
- Données trimestrielles : https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Government_finance_statistics_-_quarterly_data
- API documentation : https://ec.europa.eu/eurostat/api/help/

## Observations

- Source idéale pour comparaisons européennes
- Données France 2025 : déficit 5,1% PIB, dette 115,6% PIB
- Méthodologie ESA 2010 (harmonisée)
- API SDMX puissante pour extraction automatisée
- Données trimestrielles très fraîches (T+3 mois)

## Statut

```json
{"status": "success", "source": "eurostat", "urls_found": ["https://ec.europa.eu/eurostat/web/government-finance-statistics", "https://ec.europa.eu/eurostat/web/government-finance-statistics/database", "https://ec.europa.eu/eurostat/api/help/"], "sub_agents_used": 0, "has_structured_data": true, "summary": "Source européenne complète avec API SDMX. Données France 2025 disponibles. Comparaisons internationales.", "recommendations": ["Priorité haute pour données APU consolidées", "API SDMX pour extraction automatisée", "Données trimestrielles plus fraîches qu'INSEE", "Utile pour benchmarks européens"]}
```
