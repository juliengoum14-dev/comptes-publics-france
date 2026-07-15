---
description: "Creates an offline feature-unlock system using local UUID + cryptographic salt. Enables premium feature gating without a backend — tokens stored in localStorage."
mode: subagent
permission:
  read: allow
  edit: allow
  bash: allow
  task: deny
---

# hash-unlock

You create a local license/unlock system that works entirely offline. Useful for gating premium features when no backend or Stripe is available — or as a fallback when the server is unreachable.

## Input

You receive:
- `target_dir`: Absolute path to the project directory

## Workflow

### 1. Create `src/lib/hash-unlock.ts`

```ts
// Offline feature unlock via UUID + HMAC salt
// All tokens are stored in localStorage, no backend needed

const STORAGE_PREFIX = 'fleet_unlock_'

function getAppSalt(): string {
  const stored = localStorage.getItem(`${STORAGE_PREFIX}salt`)
  if (stored) return stored
  const salt = crypto.randomUUID()
  localStorage.setItem(`${STORAGE_PREFIX}salt`, salt)
  return salt
}

export async function generateFeatureLicense(featureName: string): Promise<string> {
  const salt = getAppSalt()
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(salt),
    { name: 'HMAC', hash: 'SHA-256' } as HmacImportParams,
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    keyMaterial,
    encoder.encode(featureName)
  )
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyFeatureLicense(featureName: string, license: string): Promise<boolean> {
  const expected = await generateFeatureLicense(featureName)
  return license === expected
}

export function getFeatureStatus(featureName: string): {
  unlocked: boolean
  license: string | null
} {
  const license = localStorage.getItem(`${STORAGE_PREFIX}${featureName}`)
  return { unlocked: !!license, license }
}

export async function unlockFeature(featureName: string): Promise<{
  unlocked: boolean
  license: string
}> {
  const license = await generateFeatureLicense(featureName)
  localStorage.setItem(`${STORAGE_PREFIX}${featureName}`, license)
  return { unlocked: true, license }
}

export function isFeatureUnlocked(featureName: string): boolean {
  return getFeatureStatus(featureName).unlocked
}

export function lockFeature(featureName: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${featureName}`)
}
```

### 2. Create a convenience hook `src/hooks/useFeatureUnlock.ts`

```ts
'use client'

import { useState, useEffect } from 'react'
import { isFeatureUnlocked, unlockFeature, lockFeature } from '@/lib/hash-unlock'

export function useFeatureUnlock(featureName: string) {
  const [unlocked, setUnlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUnlocked(isFeatureUnlocked(featureName))
    setIsLoading(false)
  }, [featureName])

  const unlock = async () => {
    const result = await unlockFeature(featureName)
    setUnlocked(result.unlocked)
    return result
  }

  const lock = () => {
    lockFeature(featureName)
    setUnlocked(false)
  }

  return { unlocked, isLoading, unlock, lock }
}
```

### 3. Validate

```bash
cd <target_dir> && npm run build
```

safe-build.sh retries automatically (exponential backoff, up to 10 min). Wait for the retries. If the build still fails after retries, abort and report the error. The `crypto.subtle` API is available in all modern browsers and in Next.js client components. If TypeScript complains about `HmacImportParams`, cast to `any` or add a type assertion.

## What you MUST NOT do

- Do NOT push to git
- Do NOT use this for real security — this is obfuscation, not cryptographic security (the salt is in localStorage). For production payments, use Stripe + Supabase.
- Do NOT modify business logic or existing components — only create the utility module and hook

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

