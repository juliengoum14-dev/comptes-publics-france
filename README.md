# Comptes Publics France

**Rendre les comptes publics compréhensibles pour les citoyens.**

À l'approche des élections de 2027, ce projet a pour ambition de mettre les finances publiques françaises à la portée de toutes et tous. Recettes de l'État, dépenses par ministère, comptes des administrations publiques, dette, déficit — chaque donnée est sourcée, documentée et présentée de manière visuelle et interactive.

## Pourquoi ?

Le débat public sur les finances de la France souffre d'un manque de données accessibles. Les chiffres existent (INSEE, Direction du Budget, Cour des Comptes, Eurostat) mais restent noyés dans des tableaux techniques. Ce dashboard les rend **explorables, comparables et compréhensibles** sans diplôme d'économie.

## Ce que contient ce projet

- Recettes et dépenses de l'État (exécution budgétaire)
- Comptes des administrations publiques (APU : État + Sécurité sociale + Collectivités)
- Séries longues (PIB, dette, déficit, prélèvements obligatoires)
- Visualisations interactives (soldes, tendances, répartition par nature et par ministère)

## Sources

INSEE, Eurostat, Direction du Budget, data.gouv.fr, Cour des Comptes, Fipeco, Banque de France, OFCE — toutes les données sont en open data.

## Stack

Next.js 16 · TypeScript · Tailwind v4 · Recharts · Static export

## Développement

```bash
npm install
npm run dev      # localhost:3000
npm run build    # export statique dans out/
```
