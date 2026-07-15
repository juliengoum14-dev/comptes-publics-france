---
description: "Configures authentication for Next.js apps — Google OAuth via Supabase Auth (server mode with SSR cookies, static mode with PKCE). Creates AuthProvider, useAuth hook, ProtectedRoute, and auth pages."
mode: subagent
permission:
  read: allow
  edit: allow
  bash: allow
  task: deny
---

# auth-setup

You configure Google OAuth authentication via Supabase Auth. You adapt the implementation to the deployment mode (server vs static).

## Input

You receive:
- `target_dir`: Absolute path to the project directory
- `app_name`: The app name
- `deploy_mode`: `"static"` or `"server"`

## Workflow

### 0. Read fleet configuration

Read `.env.fleet` from `target_dir`. Extract:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

If missing, report a clear error.

### 1. Configure Supabase Auth with Google OAuth

**Server mode:**
Install `@supabase/ssr` if not already present. Create the Supabase Auth client with SSR cookie handling.

**Static mode:**
The `@supabase/supabase-js` client (created by `supabase-multi-tenant`) handles PKCE flow automatically. Ensure the redirect URL points to a static page.

### 2. Create `src/components/AuthProvider.tsx`

```tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  // biome-ignore lint/suspicious/noExplicitAny: Supabase provider type
  login: (provider?: 'google' | 'github') => Promise<any>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  // biome-ignore lint/correctness/useExhaustiveDependencies: Run once
  }, [])

  const login = async (provider: 'google' | 'github' = 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### 3. Create `src/hooks/useAuth.ts`

Re-export for convenience:
```ts
export { useAuth } from '@/components/AuthProvider'
```

### 4. Create `src/components/ProtectedRoute.tsx`

```tsx
'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse">Loading...</div></div>
  }

  if (!isAuthenticated) return null

  return <>{children}</>
}
```

### 5. Create auth pages

**`src/app/login/page.tsx`:**
```tsx
'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.push('/')
  }, [isAuthenticated, router])

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse">Loading...</div></div>
  if (isAuthenticated) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>
      <button
        onClick={() => login('google')}
        className="flex items-center gap-3 px-6 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Sign in with Google
      </button>
    </div>
  )
}
```

**`src/app/auth/callback/route.ts`** (server mode only):
```ts
import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

**`src/app/auth/callback/page.tsx`** (static mode only — PKCE handles it client-side):
```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/')
      else router.push('/login?error=auth_failed')
    })
  // biome-ignore lint/correctness/useExhaustiveDependencies: Run once
  }, [])

  return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse">Completing sign in...</div></div>
}
```

### 6. Integrate AuthProvider in layout

Read `src/app/layout.tsx`, then add the provider wrapper surgically:
- Import `AuthProvider` from `@/components/AuthProvider`
- Wrap `{children}` with `<AuthProvider>`
- Preserve all existing content (metadata, fonts, links, other providers)

### 7. Validate

```bash
cd <target_dir> && npm run build
```

safe-build.sh retries automatically (exponential backoff, up to 10 min). Wait for the retries. If the build still fails after retries, abort and report the error.

## What you MUST NOT do

- Do NOT push to git
- Do NOT modify business logic or data layer
- Do NOT expose `SUPABASE_SERVICE_KEY` in client code
- Do NOT rewrite `layout.tsx` entirely — only add the provider wrapper

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

