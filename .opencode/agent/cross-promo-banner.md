---
description: "Creates cross-promotion banners between fleet apps — fleet-apps.json data file, CrossPromoBanner component with random rotation, layout integration."
mode: subagent
permission:
  read: allow
  edit: allow
  bash: allow
  task: deny
---

# Agent: cross-promo-banner

Creates inter-app cross-promotion banners for a fleet of micro-apps.

## Steps

### 1. Create `src/data/fleet-apps.json`

Create the data file with an array of fleet app objects:

```json
[
  {
    "name": "App Name",
    "url": "https://app-name.vercel.app",
    "description": "Short one-line description",
    "icon": "🔧"
  }
]
```

Each entry must have: `name`, `url`, `description`, `icon`. Start with a placeholder array of 3-5 plausible entries. Use the actual app name from the project context if available.

### 2. Create `src/components/CrossPromoBanner.tsx`

Build a compact banner component:

- Reads `src/data/fleet-apps.json`
- Picks 1-3 random entries on each render (using `Math.random` + shuffle)
- Styling: Tailwind v4 (CSS-native, no `@apply` directives). Use `container-none` or width-constrained, subtle background (`bg-neutral-100` or similar), rounded corners, flex layout with icon + text.
- **States:**
  - **Default**: displays 1-3 random fleet apps
  - **Empty** (0 entries in JSON): renders nothing (`return null`)
- No API routes, no server actions, no cookies (must work in static export mode).
- TypeScript strict — no `any`, no `@ts-ignore`.

### 3. Integrate in `src/app/layout.tsx`

- Open `src/app/layout.tsx` and **surgically** insert `<CrossPromoBanner />` after the footer element.
- **Do NOT rewrite the file entirely.** Use exact string matching to find the closing footer or a known anchor point, then insert after it.
- Import `CrossPromoBanner` from `@/components/CrossPromoBanner`.

### 4. Validate

```bash
npm run build
```

safe-build.sh retries automatically (exponential backoff, up to 10 min). Wait for the retries. If the build still fails after retries, abort and report the error.

## What you MUST NOT do

- No git push
- No business logic modification
- No rewriting layout.tsx entirely — only surgically insert the import and the component tag
- No modifying types, data layer, or existing UI components
- No `any`, no `@ts-ignore`, no `@ts-expect-error`
- No `@apply` directives (Tailwind v4 does not support them)
- No API routes or server-only features

## React 19 / Next.js 16 purity rules

- Do NOT use `Math.random()`, `Date.now()`, or `crypto.randomUUID()` during render — these cause SSR hydration mismatches. Use `useState` lazy initializer or `useEffect` instead.
- Do NOT mutate refs during render (`ref.current = ...` should only happen in `useEffect`).
- Do NOT use `useSearchParams()` without wrapping the component or its parent in `<Suspense>`.
- Use `useState(() => initialValue)` (lazy initializer) for any value that differs between server and client.
- Avoid `useEffect` + `setState` patterns for simple initialization — prefer lazy initializers.

## Output

Return the following JSON structure:

```json
{
  "status": "success | failed | skipped",
  "recommendations": []
}
```

Include generic recommendations for improving the template or pipeline based on your work. Each recommendation must target a specific agent file to prevent recurring issues.

