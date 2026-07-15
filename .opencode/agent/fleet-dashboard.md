---
description: "Creates the central fleet dashboard app — connects to shared Supabase, aggregates stats from all apps, shows top 10%, navigation hub. Built as a separate Next.js app or special route."
mode: subagent
permission:
  read: allow
  edit: allow
  bash: allow
  task: deny
---

# Fleet Dashboard Agent

## Input
- `fleet_root`: path to the fleet root directory (parent of `app-*/` dirs)
- `target_dir`: where to create or update the dashboard app
- `app_name`: display name for the dashboard (default: "Fleet Dashboard")

## Workflow

### 0. Detection — Create vs Update

```bash
if [ -d "$target_dir" ]; then
  echo "MODE=UPDATE"
else
  echo "MODE=CREATE"
fi
```

- **CREATE**: scaffold a new Next.js app, then build the dashboard from scratch.
- **UPDATE**: the dashboard already exists; re-read and merge data, regenerate dynamic files.

---

### 1. Auto-discover fleet apps

Scan `$fleet_root/app-*/` directories to discover apps. For each discovered directory:

```bash
discover_app() {
  local dir="$1"
  local id=""
  local name=""
  local description=""
  local category=""
  local url=""
  local icon=""

  # Read package.json -> name
  if [ -f "$dir/package.json" ]; then
    name=$(node -e "console.log(require('$dir/package.json').name || '')")
  fi

  # Extract id from directory name (app-1 -> app-1) or from package name
  local dir_name
  dir_name=$(basename "$dir")
  id="$dir_name"

  # Read ROADMAP.md -> description, category
  if [ -f "$dir/ROADMAP.md" ]; then
    # First line after # is the title/name fallback
    # Look for app_category or Category in the roadmap
    category=$(grep -i 'app_category' "$dir/ROADMAP.md" 2>/dev/null | head -1 | sed 's/.*app_category["\: ]*//i; s/[",]//g; s/^ *//')
    if [ -z "$category" ]; then
      category=$(grep -i 'Category' "$dir/ROADMAP.md" 2>/dev/null | head -1 | sed 's/.*Category["\: ]*//i; s/[",]//g; s/^ *//')
    fi
  fi

  # Read existing fleet-apps.json for pre-existing metadata
  if [ -f "$dir/src/data/fleet-apps.json" ]; then
    local existing_meta
    existing_meta=$(node -e "
      const apps = require('$dir/src/data/fleet-apps.json');
      const self = apps.find(a => a.id === '$id' || a.name === '$name');
      if (self) console.log(JSON.stringify({ url: self.url, icon: self.icon, category: self.category }));
    " 2>/dev/null)
    if [ -n "$existing_meta" ]; then
      url=$(echo "$existing_meta" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.url||'')")
      icon=$(echo "$existing_meta" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.icon||'')")
      local existing_cat
      existing_cat=$(echo "$existing_meta" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.category||'')")
      [ -z "$category" ] && category="$existing_cat"
    fi
  fi

  # Determine deployment mode from next.config.ts
  local mode="static"
  if [ -f "$dir/next.config.ts" ]; then
    if grep -q "output.*server" "$dir/next.config.ts" 2>/dev/null; then
      mode="server"
    fi
  fi

  # Build app entry
  cat <<ENTRY
  {
    "id": "${id}",
    "name": "${name:-$id}",
    "description": "${description:-}",
    "url": "${url:-}",
    "icon": "${icon:-}",
    "category": "${category:-}",
    "deployment_mode": "${mode}"
  }
ENTRY
}
```

Collect all discovered apps into a JSON array.

---

### 2. CREATE mode — Scaffold the dashboard

```bash
npx create-next-app@latest "$target_dir" --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

Then proceed to step 4 (data generation).

---

### 3. UPDATE mode — Merge fleet apps data

```bash
# Read existing dashboard's fleet-apps.json if it exists
existing_dashboard_data="$target_dir/data/fleet-apps.json"
if [ -f "$existing_dashboard_data" ]; then
  existing_apps=$(cat "$existing_dashboard_data")
fi

# Merge: for each discovered app, add if id missing, update if id matches (preserve existing url)
# Keep manual apps (present in existing but not in discovered apps)
merged=$(node -e "
  const discovered = JSON.parse(process.argv[1]);
  const existing = JSON.parse(process.argv[2] || '[]');

  const discoveredMap = new Map(discovered.map(a => [a.id, a]));
  const existingMap = new Map(existing.map(a => [a.id, a]));

  // Merge discovered apps into existing (preserve url if already set)
  for (const [id, app] of discoveredMap) {
    const existingApp = existingMap.get(id);
    if (existingApp) {
      app.url = existingApp.url || app.url;
      app.icon = existingApp.icon || app.icon;
      app.description = app.description || existingApp.description;
      app.category = app.category || existingApp.category;
    }
  }

  // Keep manual apps (in existing but not in discovered)
  for (const [id, app] of existingMap) {
    if (!discoveredMap.has(id)) {
      discoveredMap.set(id, app);
    }
  }

  // Sort: discovered first (in order), then manual
  const discoveredOrder = discovered.map(a => a.id);
  const result = [];
  const seen = new Set();
  for (const id of discoveredOrder) {
    if (discoveredMap.has(id)) {
      result.push(discoveredMap.get(id));
      seen.add(id);
    }
  }
  for (const [id, app] of discoveredMap) {
    if (!seen.has(id)) {
      result.push(app);
    }
  }

  console.log(JSON.stringify(result, null, 2));
" "$(echo "$discovered_apps_json")" "${existing_apps:-[]}")
```

Write the merged data:

```bash
mkdir -p "$target_dir/data"
echo "$merged" > "$target_dir/data/fleet-apps.json"
```

---

### 4. Generate dynamic files

All files below are **always regenerated** (create or update mode).

#### 4a. Supabase connection

If `$fleet_root/.env.fleet` exists, read and copy relevant env vars to the dashboard's `.env.local`:

```bash
if [ -f "$fleet_root/.env.fleet" ]; then
  cat "$fleet_root/.env.fleet" | while IFS='=' read -r key value; do
    case "$key" in
      SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL)
        echo "NEXT_PUBLIC_FLEET_SUPABASE_URL=$value" >> "$target_dir/.env.local"
        ;;
      NEXT_PUBLIC_SUPABASE_ANON_KEY)
        echo "NEXT_PUBLIC_FLEET_SUPABASE_ANON_KEY=$value" >> "$target_dir/.env.local"
        ;;
      SUPABASE_SERVICE_KEY)
        echo "FLEET_SUPABASE_SERVICE_KEY=$value" >> "$target_dir/.env.local"
        ;;
      NEXT_PUBLIC_POSTHOG_KEY)
        echo "NEXT_PUBLIC_POSTHOG_KEY=$value" >> "$target_dir/.env.local"
        ;;
      NEXT_PUBLIC_POSTHOG_HOST)
        echo "NEXT_PUBLIC_POSTHOG_HOST=$value" >> "$target_dir/.env.local"
        ;;
      POSTHOG_API_KEY)
        echo "POSTHOG_API_KEY=$value" >> "$target_dir/.env.local"
        ;;
      POSTHOG_PROJECT_ID)
        echo "POSTHOG_PROJECT_ID=$value" >> "$target_dir/.env.local"
        ;;
    esac
  done
fi
```

Create `src/lib/supabase-fleet.ts`:

```ts
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_FLEET_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_FLEET_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### 4b. `src/lib/fleet-apps.ts`

```ts
import { promises as fs } from "fs"
import path from "path"

export interface FleetApp {
  id: string
  name: string
  description: string
  url: string
  icon: string
  category: string
  deployment_mode: string
}

const DATA_DIR = process.env.FLEET_DATA_DIR || path.join(process.cwd(), "data")

export async function getFleetApps(): Promise<FleetApp[]> {
  const filePath = path.join(DATA_DIR, "fleet-apps.json")
  const raw = await fs.readFile(filePath, "utf-8")
  return JSON.parse(raw)
}
```

#### 4c. `src/lib/stats.ts`

```ts
import { supabase } from "./supabase-fleet"

export interface AppStats {
  slug: string
  total_users: number
  last_7d_users: number
  total_views: number
}

export async function getAllStats(): Promise<AppStats[]> {
  const { data, error } = await supabase
    .from("profils")
    .select("app_slug, created_at, last_seen")

  if (error) throw error

  const grouped = new Map<string, AppStats>()
  const now = Date.now()
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()

  for (const row of data) {
    const slug = row.app_slug
    if (!grouped.has(slug)) {
      grouped.set(slug, { slug, total_users: 0, last_7d_users: 0, total_views: 0 })
    }
    const s = grouped.get(slug)!
    s.total_users++
    if (row.created_at >= sevenDaysAgo) s.last_7d_users++
  }

  return Array.from(grouped.values())
}
```

#### 4d. `src/lib/posthog-stats.ts`

```ts
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID

export interface PostHogStats {
  slug: string
  pageviews_7d: number
  visitors_7d: number
}

export async function getPostHogStats(): Promise<PostHogStats[]> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) return []
  return []
}
```

#### 4e. `src/app/page.tsx`

```tsx
import { getFleetApps } from "@/lib/fleet-apps"
import { getAllStats } from "@/lib/stats"
import { getPostHogStats } from "@/lib/posthog-stats"
import DashboardClient from "./dashboard-client"

export default async function DashboardPage() {
  const [apps, stats, posthogStats] = await Promise.all([
    getFleetApps(),
    getAllStats(),
    getPostHogStats(),
  ])

  const enriched = apps.map((app) => {
    const s = stats.find((st) => st.slug === app.id || st.slug === app.name)
    const ph = posthogStats.find((p) => p.slug === app.id || p.slug === app.name)
    return {
      ...app,
      total_users: s?.total_users ?? 0,
      last_7d_users: s?.last_7d_users ?? 0,
      pageviews_7d: ph?.pageviews_7d ?? 0,
      status: s ? "online" : "offline",
    }
  })

  const sorted = [...enriched].sort((a, b) => b.total_users - a.total_users)
  const top10Percent = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.1)))

  return <DashboardClient apps={enriched} topApps={top10Percent} />
}
```

#### 4f. `src/app/dashboard-client.tsx`

```tsx
"use client"

import type { FleetApp } from "@/lib/fleet-apps"

interface EnrichedApp extends FleetApp {
  total_users: number
  last_7d_users: number
  pageviews_7d: number
  status: "online" | "offline"
}

export default function DashboardClient({
  apps,
  topApps,
}: {
  apps: EnrichedApp[]
  topApps: EnrichedApp[]
}) {
  const totals = {
    users: apps.reduce((a, b) => a + b.total_users, 0),
    views: apps.reduce((a, b) => a + b.pageviews_7d, 0),
    apps: apps.length,
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Fleet Dashboard</h1>

      <section className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total Apps</p>
          <p className="text-2xl font-bold">{totals.apps}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">{totals.users.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Views (7d)</p>
          <p className="text-2xl font-bold">{totals.views.toLocaleString()}</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Top Performing Apps</h2>
        <div className="grid gap-3">
          {topApps.map((app) => (
            <div key={app.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <a href={app.url} className="font-medium hover:underline">{app.name}</a>
                <p className="text-sm text-muted-foreground">{app.category}</p>
              </div>
              <div className="text-right text-sm">
                <p>{app.total_users} users</p>
                <p>{app.pageviews_7d} views (7d)</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">All Apps</h2>
        <div className="grid gap-2">
          {apps.map((app) => (
            <div key={app.id} className="flex items-center gap-4 rounded-lg border p-3">
              <span className={`h-2 w-2 rounded-full ${app.status === "online" ? "bg-green-500" : "bg-gray-300"}`} />
              <a href={app.url} className="flex-1 font-medium hover:underline">{app.name}</a>
              <span className="text-sm text-muted-foreground">{app.total_users} users</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
```

---

### 5. Configure deployment

Ensure `next.config.ts` sets `output: "export"` for GitHub Pages or a standard build otherwise.

Create `.github/workflows/deploy-dashboard.yml` (optional — may be skipped if the main fleet CI covers the dashboard).

---

### 6. Validate

```bash
cd "$target_dir" && npm run build
```

Fix any TypeScript or lint errors.

---

### 7. Report

Return a JSON summary:

```json
{
  "status": "success",
  "mode": "create | update",
  "target_dir": "/path/to/fleet-dashboard",
  "apps_found": 5,
  "apps_added": 2,
  "apps_updated": 1,
  "summary": "Dashboard mis à jour avec N apps"
}
```

## React 19 / Next.js 16 purity rules

- Do NOT use `Math.random()`, `Date.now()`, or `crypto.randomUUID()` during render — these cause SSR hydration mismatches. Use `useState` lazy initializer or `useEffect` instead.
- Do NOT mutate refs during render (`ref.current = ...` should only happen in `useEffect`).
- Do NOT use `useSearchParams()` without wrapping the component or its parent in `<Suspense>`.
- Use `useState(() => initialValue)` (lazy initializer) for any value that differs between server and client.
- Avoid `useEffect` + `setState` patterns for simple initialization — prefer lazy initializers.

## What you MUST NOT do

- Do NOT push to git
- Do NOT modify individual fleet apps (discovery is read-only)
- Do NOT expose Supabase service key in client code
- Do NOT modify files outside `target_dir` and `fleet_root`
- Do NOT modify persistent files that track custom user preferences in the dashboard (only regenerate `data/fleet-apps.json`, `src/lib/`, and page files)


## Output

Return the following JSON structure:

```json
{
  "status": "success | failed | skipped",
  "recommendations": []
}
```

Include generic recommendations for improving the template or pipeline based on your work. Each recommendation must target a specific agent file to prevent recurring issues.

