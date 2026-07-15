# Comptes Publics France

> Dashboard des recettes et dépenses publiques de la France

## Agents disponibles

Ce projet utilise deux agents orchestrateurs qui délèguent systématiquement le travail à des sous-agents :

| Agent | Rôle | Sous-agents créés |
|---|---|---|
| `research-agent` | Orchestre l'exploration de 8 sources officielles en parallèle, chaque source = 1 sous-agent | `source-insee`, `source-budget`, `source-datagouv`, `source-courcomptes`, `source-fipeco`, `source-eurostat`, `source-bdf`, `source-ofce` |
| `data-agent` | Orchestre le téléchargement et le processing : chaque download + chaque fichier JSON produit = 1 sous-agent | `fetch-*`, `process-*`, `validation-consolidation` |

### Workflow recommandé

```
1. Lancer le research-agent   → 8 sous-agents en parallèle → data/sources/source-catalogue.md
2. Lancer le data-agent        → downloads en parallèle → processing en parallèle → data/processed/*.json
3. Développer le dashboard     → composants React qui consomment data/processed/*.json
```

## Key quirks

- **Next.js 16 breaking changes** — Bundled docs in `node_modules/next/dist/docs/` are the source of truth, not nextjs.org. Check them before writing any code.
- **Tailwind v4** — CSS-native (`@import "tailwindcss"` in `globals.css`). No `tailwind.config.js`, no `content` paths, no `@tailwind` directives. Do not generate a config file.
- **Static mode** (`output: "export"`) — No API routes, no server actions, no cookies. Build produces `out/`.
- **TypeScript strict** — Full strict mode enabled. No `any`, no `@ts-ignore`, no `@ts-expect-error` unless justified.
- **No test framework** — Only verification is `npm run build` (which runs TypeScript check + build).
- **safe-build.sh** — Wrapper automatique pour `npm run build`. Ne JAMAIS l'appeler directement — utiliser `npm run build` qui le déclenche automatiquement.

## Project structure

```
├── src/
│   ├── app/              # App router pages
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/       # Reusable components (dashboard, graphiques)
│   └── types/            # TypeScript interfaces
├── public/               # Static assets
├── data/
│   ├── raw/              # Données brutes téléchargées
│   ├── processed/        # Données nettoyées et structurées (JSON)
│   ├── reports/          # Rapports des agents
│   └── sources/          # Catalogue des sources documenté
├── .github/workflows/    # CI/CD
├── safe-build.sh
├── .husky/
└── .opencode/
    └── agent/
        ├── research-agent.md
        └── data-agent.md
```

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Build with safe-build.sh (retry + lock) |
| `npm run lint` | ESLint |

## Règles immuables

1. **Toujours déléguer** — Les agents `research-agent` et `data-agent` ne font JAMAIS le travail directement. Ils décomposent les tâches et délèguent chaque sous-tâche à un sous-agent via `task()`. Un agent qui fait du curl, du pandas ou du websearch directement au lieu de déléguer est en faute.
2. **Parallélisation max** — Tous les sous-agents indépendants sont lancés dans un même message (appels `task()` concurrents). Ne pas séquencer ce qui peut être parallélisé.
3. **Agents = écriture données uniquement** — `research-agent` écrit `data/sources/`, `data/reports/` ; `data-agent` écrit `data/raw/`, `data/processed/`. Aucun agent ne modifie `src/`.
4. **Always validate data** — Après chaque production de données, valide la cohérence (totaux, séries temporelles, plausibilité).
5. **Préserver les sources** — Les fichiers bruts téléchargés dans `data/raw/` ne sont jamais supprimés par un agent (sauf cleanup explicite).
4. **PROCESS SAFETY** — Ne jamais kill de processus par nom/pattern. Voir la section dédiée dans le template original.
5. **BUILD FAILURE** — safe-build.sh retente automatiquement. Ne rien faire pendant 10 minutes. Après 10min, si erreur logicielle, corriger ; sinon, reporter.
