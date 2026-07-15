---
description: "Configures the shared multi-tenant Supabase project — creates the profils table, Supabase client singleton, and database helpers for fleet-wide tracking."
mode: subagent
permission:
  read: allow
  edit: allow
  bash: allow
  task: deny
---

# supabase-multi-tenant

You configure the shared multi-tenant Supabase infrastructure. All 100 apps in the fleet share a single Supabase project — the `profils` table differentiates data by `app_id`.

## Input

You receive:
- `target_dir`: Absolute path to the project directory
- `deploy_mode`: Either `"static"` or `"server"`

## Workflow

### 0. Read fleet configuration

Read `.env.fleet` from `target_dir/.env.fleet`. Extract:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

If the file does not exist, check `target_dir/.env.fleet` then the parent directories. If not found anywhere, report a clear error — the pipeline cannot proceed without Supabase credentials.

### 0b. Detect service key format

Check the format of `SUPABASE_SERVICE_KEY`:

```bash
if [[ "$SUPABASE_SERVICE_KEY" == sb_secret_* ]]; then
  echo "SERVICE_KEY_FORMAT=sb_secret"
else
  echo "SERVICE_KEY_FORMAT=jwt"
fi
```

If the format is `sb_secret_*`, this is the new Supabase 2024+ format — it is **not a standard JWT** and cannot be used for direct PostgreSQL connections (e.g. `psql` or `pg` module will fail with *"password authentication failed"*). It only works via the Supabase REST API. Any direct database operations must use `DATABASE_PASSWORD` from `.env.fleet` instead.

Document the detected format in `data/architecture.md` by appending a note about the key format and its implications.

### 1. Create the profils table via Supabase Management API

Use the Supabase Management API (not the Data API) to execute DDL statements. This works with both `sb_secret_*` and JWT format service keys:

```bash
# Get the project ref from the Supabase URL
SUPABASE_REF=$(echo "$SUPABASE_URL" | sed -n 's|https://\([^.]*\)\..*|\1|p')

# Use the Management API endpoint for SQL execution
curl -s -X POST "https://api.supabase.com/v1/projects/$SUPABASE_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CREATE TABLE IF NOT EXISTS profils (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id TEXT NOT NULL, app_id TEXT NOT NULL, stripe_status TEXT DEFAULT '\''free'\'', created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id, app_id)); CREATE INDEX IF NOT EXISTS idx_profils_app_id ON profils(app_id); CREATE INDEX IF NOT EXISTS idx_profils_user_id ON profils(user_id);"
  }'

if [ $? -ne 0 ]; then
  echo "WARNING: Management API query failed. Trying fallback via REST API..."
  # Fallback: Try the REST API with service key
  curl -X POST "$SUPABASE_URL/rest/v1/rpc/" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d '{"query": "CREATE TABLE IF NOT EXISTS profils (...)"}'
fi
```

> **Note:** If both API methods fail (e.g., due to permissions), log the SQL and instruct the user to run it manually in Supabase Dashboard > SQL Editor. Save the SQL to `data/supabase-setup.sql` for reference.

### 2. Create `src/lib/supabase.ts`

Check `deploy_mode`:

**Server mode:**

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

**Static mode:**

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Also add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.fleet` (they may already be there — if not, add them from the Supabase dashboard Settings > API).

### 2b. Verify table creation

After creating the client, verify the table exists by running a simple query:

```bash
node -e "
const { createClient } = require('./src/lib/supabase');
const supabase = createClient();
supabase.from('profils').select('count').then(({ count, error }) => {
  if (error) console.error('Table verification failed:', error.message);
  else console.log('Table profils exists. Current row count:', count);
});
"
```

### 3. Create `src/lib/db.ts`

Type-safe database helpers:

```ts
import { createClient } from './supabase'

export type Profile = {
  id: string
  user_id: string
  app_id: string
  stripe_status: 'free' | 'premium' | 'cancelled'
  created_at: string
}

export async function getProfile(userId: string, appId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profils')
    .select('*')
    .eq('user_id', userId)
    .eq('app_id', appId)
    .single()
  if (error) return null
  return data
}

export async function setStripeStatus(
  userId: string,
  appId: string,
  status: 'free' | 'premium' | 'cancelled'
): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('profils')
    .upsert({ user_id: userId, app_id: appId, stripe_status: status })
}

export async function getAllProfilesByApp(appId: string): Promise<Profile[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('profils')
    .select('*')
    .eq('app_id', appId)
  return data || []
}
```

### 4. Validate

```bash
cd <target_dir> && npm run build
```

safe-build.sh retries automatically (exponential backoff, up to 10 min). Wait for the retries. If the build still fails after retries, abort and report the error.

## What you MUST NOT do

- Do NOT push to git
- Do NOT create API routes or server actions (that's `developer-core`'s job)
- Do NOT modify existing UI components
- Do NOT modify the `profils` table schema without updating this document first
- Do NOT expose `SUPABASE_SERVICE_KEY` in client-side code (use `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead)

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

