# Source Banque de France

## Métadonnées

- **URL de base** : https://www.banque-france.fr
- **Formats disponibles** : HTML / XLSX / PDF / API Webstat
- **Périmètre** : Dette publique, titres de dette, balance des paiements
- **Granularité** : par instrument, par secteur, par détenteur (résident/non-résident)
- **Périodicité** : trimestrielle + mensuelle
- **Séries disponibles** : depuis 2017+ (selon séries)
- **Licence** : ouverte
- **API disponible** : oui — Webstat (https://webstat.banque-france.fr)
- **Fiabilité** : source officielle (Banque centrale)
- **Dernière mise à jour** : T1 2025 (émissions et détention de titres)
- **Facilité d'accès** : téléchargement direct + API Webstat

## Données disponibles

- **Émission et détention de titres français** : trimestriel
- **Dette publique** : fiches pédagogiques + données
- **Comptes financiers** : avec les autres secteurs institutionnels
- **Balance des paiements** : données de la nation
- **Titres de dette financière** : par secteur émetteur
- **Statistiques monétaires** : agrégats

## Agence France Trésor (AFT)

- URL : https://www.aft.gouv.fr
- Données sur l'encours de la dette négociable de l'État
- Courbe des taux OAT
- Détention par groupe de porteurs
- Bulletins mensuels

## URLs directes

- Banque de France dette publique : https://www.banque-france.fr/fr/publications-et-statistiques/publications/la-dette-publique
- Webstat : https://webstat.banque-france.fr
- Émissions titres T1 2025 : https://www.banque-france.fr/fr/statistiques/credit/emission-et-detention-de-titres-francais-2025-q1
- Émissions titres 2024 : https://www.banque-france.fr/fr/statistiques/credit/emission-et-detention-de-titres-francais-2024-q4
- Titres de dette : https://www.banque-france.fr/fr/titres-de-dette-financiere
- AFT : https://www.aft.gouv.fr/fr/principaux-chiffres-dette

## Observations

- Source complémentaire pour la dette (approche par titres/détention)
- Données très granulaires sur la structure de la dette
- API Webstat pour extraction automatisée
- AFT donne l'encours quotidien de la dette négociable

## Statut

```json
{"status": "success", "source": "bdf", "urls_found": ["https://www.banque-france.fr", "https://webstat.banque-france.fr", "https://www.aft.gouv.fr", "https://www.banque-france.fr/fr/statistiques/credit/emission-et-detention-de-titres-francais-2025-q1"], "sub_agents_used": 0, "has_structured_data": true, "summary": "Source pour la dette et les titres. Données très granulaires sur détention. API Webstat.", "recommendations": ["Priorité moyenne pour dette détaillée", "API Webstat pour extraction", "Complément INSEE pour analyse dette", "AFT pour dette État temps réel"]}
```
