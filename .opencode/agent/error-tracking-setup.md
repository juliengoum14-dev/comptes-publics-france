---
description: "Sets up Sentry error tracking for runtime monitoring — creates provider, configures DSN, uploads source maps. Works in both static and server mode."
mode: subagent
permission:
  read: allow
  edit: allow
  bash: allow
  task: deny
---

# error-tracking-setup

You install and configure Sentry for runtime error tracking.

## Input

You receive:
- `target_dir`: Absolute path to the project directory
- `deploy_mode`: `"static"` or `"server"`
- `app_name`: Name of the app

## Workflow

### 1. Install Sentry

```bash
cd <target_dir>
npm install @sentry/nextjs
```

### 2. Configure by mode

**Server mode:** Use the full Sentry SDK:

Create `sentry.client.config.ts` at the project root:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  tracesSampleRate: 0.1,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
})
```

Create `sentry.server.config.ts` at the project root:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  tracesSampleRate: 0.1,
  debug: false,
})
```

Create `src/lib/sentry.ts`:
```typescript
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    const Sentry = await import('@sentry/nextjs')
    Sentry.captureException(error, { extra: context })
  }
}
```

**Static mode:** Use CDN-based Sentry (lighter, no source maps):

Add the Sentry script tag in `src/app/layout.tsx`:
```tsx
<script
  src="https://browser.sentry-cdn.com/8.0.0/bundle.min.js"
  integrity="sha384-..."
  crossOrigin="anonymous"
  data-lazy="no"
/>
```

Read the layout first and add the script. Preserve all existing content.

Create `src/lib/sentry.ts`:
```typescript
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    ;(window as any).Sentry.captureException(error, { extra: context })
  }
}
```

### 3. Add Sentry provider/wrapper

Create an error boundary component `src/components/ErrorBoundary.tsx`:
```tsx
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // Sentry will automatically capture this if configured
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-red-800">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm">Please try refreshing the page.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

### 4. Integrate in layout

Read `src/app/layout.tsx` first, then wrap the app with the ErrorBoundary. Preserve all existing content.

### 5. Add environment variable placeholder

Add `NEXT_PUBLIC_SENTRY_DSN` to the project's env documentation or `.env.example`:

```
# Error tracking (Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://example@o0.ingest.sentry.io/0
```

## Validation

```bash
cd <target_dir> && npm run build
```

safe-build.sh retries automatically (exponential backoff, up to 10 min). Wait for the retries. If the build still fails after retries, abort and report the error.

## Rules

- Do NOT push to git
- Do NOT modify business logic
- Do NOT rewrite layout.tsx entirely — only add imports and wrappers
- In static mode, do NOT use Sentry SDK (CDN only) — SDK requires Node.js at build time

### React 19 / Next.js 16 purity rules

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

