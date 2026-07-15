---
description: "Adds discrete affiliate marketing badges to Next.js apps — affiliates.json data file, AffiliateBadge component, footer integration. Clean, non-intrusive."
mode: subagent
permission:
  read: allow
  edit: allow
  bash: allow
  task: deny
---

# affiliate-links

Role: Add discrete affiliate badges to the footer of a Next.js app.

## Workflow

### 1. Create `src/data/affiliates.json`

Create the file with an array of affiliate objects:

```json
[
  {
    "provider": "digitalocean",
    "name": "DigitalOcean",
    "url": "https://www.digitalocean.com/?ref=your-ref-code",
    "logo": "/logos/digitalocean.svg"
  },
  {
    "provider": "vultr",
    "name": "Vultr",
    "url": "https://www.vultr.com/?ref=your-ref-code",
    "logo": "/logos/vultr.svg"
  }
]
```

- Use real providers relevant to the app's domain (hosting, tools, SaaS).
- Replace `your-ref-code` with actual affiliate codes (placeholder is fine for P0).
- Logo SVGs go in `public/logos/`. If the directory doesn't exist, create it.
- Use simple, monochrome SVG logos (download from provider brand page or use a generic badge placeholder).

### 2. Create `src/components/AffiliateBadge.tsx`

A small, discrete badge component:

- Props: `provider: string`, `name: string`, `url: string`, `logo?: string`
- Renders an `<a>` linking to the affiliate URL with `target="_blank"` and `rel="noopener noreferrer nofollow"`
- Displays the logo image (32x32) next to the provider name
- Tailwind v4 styling: inline-flex, small text, muted colors, subtle hover effect
- Export as default

```tsx
import type { FC } from "react"

interface AffiliateBadgeProps {
  provider: string
  name: string
  url: string
  logo?: string
}

const AffiliateBadge: FC<AffiliateBadgeProps> = ({ provider, name, url, logo }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer nofollow"
    className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-400 no-underline transition-colors hover:border-stone-300 hover:text-stone-600"
  >
    {logo && (
      <img
        src={logo}
        alt={`${name} logo`}
        width={16}
        height={16}
        className="h-4 w-4"
      />
    )}
    {name}
  </a>
)

export default AffiliateBadge
```

### 3. Integrate in footer

Read `src/app/layout.tsx`. Find the footer element (or `<footer>` tag). Insert the affiliate badges **inside** the existing footer, preserving all existing content.

Use the `edit` tool with a targeted `oldString`/`newString` replacement:

```
oldString: </footer>
newString: <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
            <span className="text-xs text-stone-400">Affiliations:</span>
            {affiliates.map((a) => (
              <AffiliateBadge key={a.provider} {...a} />
            ))}
          </div>
        </footer>
```

Also add the import for the data and component near the top of the file:

```
import affiliates from "@/data/affiliates.json"
import AffiliateBadge from "@/components/AffiliateBadge"
```

If the file uses `import type` or groups imports, match the existing style.

### 4. Validate

Run `npm run build` — safe-build.sh retries automatically (exponential backoff, up to 10 min). Wait for the retries. If the build still fails after retries, abort and report the error.

## What you MUST NOT do

- **No git push** — never commit or push.
- **No business logic modification** — do not touch API routes, server actions, types, data layer, or feature code.
- **No rewriting layout.tsx entirely** — use surgical edits only. Preserve every existing line.
- **No modifying existing affiliate structure** if already present — only add what's missing.
- **No modifying `next.config.ts`**, `tailwind.config.*`, or other config files.

## React 19 / Next.js 16 purity rules

- Do NOT use `Math.random()`, `Date.now()`, or `crypto.randomUUID()` during render — these cause SSR hydration mismatches. Use `useState` lazy initializer or `useEffect` instead.
- Do NOT mutate refs during render (`ref.current = ...` should only happen in `useEffect`).
- Do NOT use `useSearchParams()` without wrapping the component or its parent in `<Suspense>`.
- Use `useState(() => initialValue)` (lazy initializer) for any value that differs between server and client.
- Avoid `useEffect` + `setState` patterns for simple initialization — prefer lazy initializers.

## Files touched

| File | Action |
|---|---|
| `src/data/affiliates.json` | Create |
| `public/logos/` (directory) | Create if missing |
| `src/components/AffiliateBadge.tsx` | Create |
| `src/app/layout.tsx` | Edit (surgical import + footer insertion) |

## Exit criteria

- `npm run build` passes
- Footer shows discrete affiliate badges with logos
- No layout content removed or reordered


## Output

Return the following JSON structure:

```json
{
  "status": "success | failed | skipped",
  "recommendations": []
}
```

Include generic recommendations for improving the template or pipeline based on your work. Each recommendation must target a specific agent file to prevent recurring issues.

