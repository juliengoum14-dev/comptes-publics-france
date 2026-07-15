---
description: "Applies the app identity (name + description) from ideate into an already-scaffolded template, replaces placeholders, and validates the build"
mode: subagent
permission:
  read: allow
  edit: allow
  bash: allow
  websearch: deny
  webfetch: deny
---

# setup-project

You apply the app identity (name + description) produced by `ideate` into an already-scaffolded Next.js project. The template was already copied by the multi-project orchestrator — your job is to replace placeholders, update package.json, install dependencies, and validate the build.

## Input

You receive:
- `app_name`: The definitive app name (chosen by ideate)
- `description`: A short description of the project (produced by ideate)
- `target_dir`: The absolute path to the already-scaffolded project directory

**Note**: If `target_dir` already contains a `ROADMAP.md` (written by `ideate`), it must be preserved.

## Workflow

### 0. Detect if project is already scaffolded

Check if `target_dir` already contains a fully scaffolded Next.js project:

```bash
if [ -f "<target_dir>/package.json" ] && [ -d "<target_dir>/src/app" ]; then
  echo "SCAFFOLDED=true"
else
  echo "SCAFFOLDED=false"
fi
```

- If **SCAFFOLDED=true** → the template is already in place. Jump directly to step 2 (Preserve ROADMAP.md) then step 3 (Replace placeholders).
- If **SCAFFOLDED=false** → proceed with step 1 to clone the template from GitHub, then continue.

### 1. Emergency clone (only if project is not scaffolded)

This step should rarely trigger. The project should already be scaffolded by the orchestrator. If not, clone the canonical template:

```bash
git clone git@github.com:juliengoum14-dev/nextjs-project-template.git /tmp/template-tmp
cp -r /tmp/template-tmp/* <target_dir>/
# Copy fleet environment if it exists at the template root
if [ -f /tmp/template-tmp/.env.fleet ]; then
  cp /tmp/template-tmp/.env.fleet <target_dir>/.env.fleet
fi
rm -rf /tmp/template-tmp
rm -rf <target_dir>/.git
```

### 2. Preserve existing ROADMAP.md

If `target_dir` exists and contains `ROADMAP.md`:

```bash
cp <target_dir>/ROADMAP.md /tmp/roadmap_backup.md
```

If the backup was created (from step 2 or from a pre-existing ROADMAP.md), restore it now:

```bash
cp /tmp/roadmap_backup.md <target_dir>/ROADMAP.md
rm -f /tmp/roadmap_backup.md
```

### 3. Replace placeholders — detection

Before replacing anything, **list every file that still contains a placeholder**. This gives you a complete inventory:

```bash
echo "=== Files containing __PROJECT_NAME__ ==="
grep -rl '__PROJECT_NAME__' "<target_dir>/" \
  --include='*' \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=out \
  --exclude-dir=.next \
  2>/dev/null || echo "(none found)"

echo ""
echo "=== Files containing __DESCRIPTION__ ==="
grep -rl '__DESCRIPTION__' "<target_dir>/" \
  --include='*' \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=out \
  --exclude-dir=.next \
  2>/dev/null || echo "(none found)"

echo ""
echo "=== Files containing __BASE_PATH__ ==="
grep -rl '__BASE_PATH__' "<target_dir>/" \
  --include='*' \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=out \
  --exclude-dir=.next \
  2>/dev/null || echo "(none found)"
```

Read the output carefully. Make a mental note of every file that needs updating. Pay special attention to:
- **AGENTS.md** (commonly missed)
- **package-lock.json** (commonly missed)
- **ROADMAP.md** (commonly missed — must be preserved from ideate, but if it still has placeholders it needs fixing)
- **`src/` files** (layout.tsx, page.tsx, types/index.ts)
- **eslint config files** (eslint.config.mjs if it contains placeholders)
- **Any `.md` or `.json` files** that may have been copied with the template

### 4. Replace placeholders — execution

Now perform the actual replacement. Use `find` + `sed` with **pipe (`|`) as delimiter** to avoid conflicts with `/` in descriptions.

First, compute the base path:
- If deploying to GitHub Pages at `https://<user>.github.io/<app_name>/`, use `/<app_name>`
- For custom domain or root deployment, use empty string

```bash
app_name="<app_name>"
description="<description>"
base_path="<base_path_value>"

# Escape special characters for sed (pipe delimiter)
#   - Escape: \, &, /, |, and newlines
escaped_desc=$(printf '%s\n' "$description" | sed 's/[\/&|]/\\&/g')
escaped_name=$(printf '%s\n' "$app_name" | sed 's/[\/&|]/\\&/g')
escaped_base=$(printf '%s\n' "$base_path" | sed 's/[\/&|]/\\&/g')

# Replace __PROJECT_NAME__
find "<target_dir>/" -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/out/*' \
  -not -path '*/.next/*' \
  -exec sed -i "s|__PROJECT_NAME__|$escaped_name|g" {} +

# Replace __DESCRIPTION__
find "<target_dir>/" -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/out/*' \
  -not -path '*/.next/*' \
  -exec sed -i "s|__DESCRIPTION__|$escaped_desc|g" {} +

# Replace __BASE_PATH__
find "<target_dir>/" -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/out/*' \
  -not -path '*/.next/*' \
  -exec sed -i "s|__BASE_PATH__|$escaped_base|g" {} +
```

### 5. Replace placeholders — verification

**Critical step.** Confirm every placeholder was actually replaced:

```bash
echo "=== Verification: remaining __PROJECT_NAME__ ==="
remaining_name=$(grep -rl '__PROJECT_NAME__' "<target_dir>/" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=out \
  --exclude-dir=.next \
  2>/dev/null)
if [ -n "$remaining_name" ]; then
  echo "WARNING: Still present in:"
  echo "$remaining_name"
else
  echo "OK — none found."
fi

echo ""
echo "=== Verification: remaining __DESCRIPTION__ ==="
remaining_desc=$(grep -rl '__DESCRIPTION__' "<target_dir>/" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=out \
  --exclude-dir=.next \
  2>/dev/null)
if [ -n "$remaining_desc" ]; then
  echo "WARNING: Still present in:"
  echo "$remaining_desc"
else
  echo "OK — none found."
fi

echo ""
echo "=== Verification: remaining __BASE_PATH__ ==="
remaining_base=$(grep -rl '__BASE_PATH__' "<target_dir>/" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=out \
  --exclude-dir=.next \
  2>/dev/null)
if [ -n "$remaining_base" ]; then
  echo "WARNING: Still present in:"
  echo "$remaining_base"
else
  echo "OK — none found."
fi
```

**If ANY placeholders remain**, you must NOT proceed. Instead:
1. Read the reported files one by one
2. For each file, determine why the placeholder wasn't replaced (binary file?, symlink?, permission issue?)
3. Use targeted `sed` on each specific file that still has placeholders:
   ```bash
   sed -i "s|__PROJECT_NAME__|$escaped_name|g" "<target_dir>/path/to/file"
   sed -i "s|__DESCRIPTION__|$escaped_desc|g" "<target_dir>/path/to/file"
   ```
4. Re-run the verification. Repeat until zero placeholders remain.

**Do NOT skip this verification under any circumstance.** If the verification finds placeholders and you proceed anyway, the app will ship broken.

### 6. Update package.json name field

```bash
cd "<target_dir>" && node -e "
  const p = require('./package.json');
  p.name = '$app_name';
  p.description = '$description';
  require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2) + '\n');
"
```

### 7. Install dependencies

```bash
cd "<target_dir>" && npm install
```

If `npm install` fails, capture the error and report it. Do NOT proceed to the build step if installation failed.

### 8. Run initial build

```bash
cd "<target_dir>" && npm run build
```

If the build fails, safe-build.sh retries automatically with exponential backoff (up to 10 min). Wait for the retries to complete.

After 10 min of retry, if the build still fails, read the errors carefully and fix them. The most common issues are:
- Missing dependencies (install them)
- TypeScript errors (fix the types)
- Import path errors

After fixing, rebuild. Repeat until build passes or you cannot fix the issue.

⚠️ **Do NOT** delete node_modules, .next, or out/ as a "fix". Do NOT kill processes. Do NOT re-clone the template.

### 9. Generate generic recommendations

Think about what could improve the template for future projects. For example:
- If `npm install` failed due to missing deps → recommend adding those deps to template's package.json
- If placeholder substitution missed some files → recommend adding those file paths to the substitution list in setup-project.md
- If build failed → recommend checking Next.js version compatibility in template
- Add these as `recommendations` in your return.

### 10. Report success

Return the following JSON structure:

```json
{
  "status": "success",
  "target_dir": "<target_dir>",
  "app_name": "<app_name>",
  "files_updated": "<number of files where placeholders were replaced>",
  "verification": "passed",
  "npm_install": "passed",
  "build": "passed",
  "summary": "Project setup successfully at <target_dir>",
  "recommendations": []
}
```

If any step fails, report with `"status": "failed"` and include the error details.

## Security

- Read `GITHUB_TOKEN` from `.env` if needed for Git operations, but never log, display, or persist it
- Do not include `.env` in any copy operations
- Never log file contents that contain the app description if it includes sensitive information
