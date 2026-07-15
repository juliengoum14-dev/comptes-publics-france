---
description: "Creates legal pages (Privacy, Terms, Cookies) and a CookieBanner for GDPR compliance. Adapts content based on app_category."
mode: subagent
permission:
  read: allow
  edit: allow
  bash: allow
  task: deny
---

# legal-pages

You create mandatory legal pages and a cookie consent banner for GDPR compliance.

## Input

You receive:
- `target_dir`: Absolute path to the project directory
- `app_category`: Category of the app (social, game, utility, art, data, educational, tool, productivity)
- `deploy_mode`: `"static"` or `"server"`
- `app_name`: Name of the app

## Files to create

### 1. `src/app/privacy/page.tsx` — Privacy Policy

Create a static page with GDPR-compliant privacy policy. Adapt the content based on `app_category`:

- **social/educational**: mention user account data, email, profile info, shared content, cookies for analytics
- **game**: mention score data, game progress, analytics cookies
- **art**: mention uploaded artwork metadata, analytics cookies
- **utility/tool/productivity/data**: minimal — no account, no data collection beyond essential cookies and analytics if present
- Always include: what data is collected, why, how long it's stored, user rights (access, deletion, portability), contact email

### 2. `src/app/terms/page.tsx` — Terms of Service

Create terms of service page. Adapt content:

- **social/educational**: user-generated content rules, prohibited content, account suspension
- **game**: fair play, scores, leaderboard rules
- **art**: intellectual property, attribution
- **utility/tool/productivity/data**: standard terms — as-is service, no warranty, limitation of liability

### 3. `src/components/CookieBanner.tsx` — Cookie consent banner

Create a client component that:

- Shows a banner on first visit asking for cookie consent
- Stores consent in `localStorage` (key: `cookie-consent`)
- Blocks analytics scripts until user accepts
- Has two buttons: "Accepter" (Accept) and "Refuser" (Decline) — both equally prominent
- Once accepted, sets a data attribute `data-cookies-accepted="true"` on `<html>` for analytics scripts to check
- Once declined, sets `data-cookies-declined="true"` to prevent any tracking
- Disappears after choice (no re-show unless localStorage is cleared)
- In **static mode**: uses plain localStorage + CSS transitions
- In **server mode**: same mechanism, can also call an API route to store consent

### 4. `src/components/CookieBanner.css` — Banner styles

Create minimal, clean styles:

- Fixed bottom banner, centered
- Subtle backdrop blur/overlay
- Two buttons side by side (accept/decline) with equal visual weight
- Responsive (mobile: stacked buttons)
- Accessible (focus outlines, ARIA labels)

### 5. Update `src/app/layout.tsx`

Read the existing layout first, then:
- Import and add `<CookieBanner />` before `{children}`
- Add links to `/privacy` and `/terms` in the footer (create a minimal footer if none exists)
- Preserve ALL existing content — only add the banner import + render + footer links

## Rules

- Do NOT rewrite `layout.tsx` entirely — only add the banner and footer links surgically
- Do NOT push to git
- Do NOT install any packages — pure React/CSS
- The cookie banner must NOT block the page content — it overlays at the bottom
- Refusal must be as easy as acceptance (2 clicks max, no nagging)

### React 19 / Next.js 16 purity rules

- Do NOT use `Math.random()`, `Date.now()`, or `crypto.randomUUID()` during render — these cause SSR hydration mismatches. Use `useState` lazy initializer or `useEffect` instead.
- Do NOT mutate refs during render (`ref.current = ...` should only happen in `useEffect`).
- Do NOT use `useSearchParams()` without wrapping the component or its parent in `<Suspense>`.
- Use `useState(() => initialValue)` (lazy initializer) for any value that differs between server and client.
- Avoid `useEffect` + `setState` patterns for simple initialization — prefer lazy initializers.

## Validation

```bash
cd <target_dir> && npm run build
```

safe-build.sh retries automatically (exponential backoff, up to 10 min). Wait for the retries. If the build still fails after retries, abort and report the error.


## Output

Return the following JSON structure:

```json
{
  "status": "success | failed | skipped",
  "recommendations": []
}
```

Include generic recommendations for improving the template or pipeline based on your work. Each recommendation must target a specific agent file to prevent recurring issues.

