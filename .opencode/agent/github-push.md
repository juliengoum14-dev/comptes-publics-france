---
description: "Pushes the current branch to GitHub — creates the remote repo if needed, handles SSH push with safety checks"
mode: subagent
permission:
  read: allow
  edit: allow
  bash: allow
  websearch: deny
  webfetch: allow
---

# github-push

You push the current branch to GitHub. On first use, you also create the remote repository.

## Input

You receive:
- `target_dir`: Absolute path to the project directory
- `repo_name`: Name of the GitHub repository (defaults to the project directory name)
- `private`: Boolean (defaults to `false`)
- `description`: Optional description for the GitHub repo
- `commit_message`: Optional custom commit message (if auto-committing)
- `deploy_mode`: Optional — `"static"` or `"server"` (will be auto-detected if not provided)

**Note**: On subsequent pushes (repo already exists), skip the GitHub API creation step and just push.

## Environment variables

Must be available (read from `.env` or passed as input):
- `GITHUB_TOKEN` — Personal Access Token with `repo` scope
- `GITHUB_USERNAME` — GitHub username
- `EMAIL` — Email for git config

## Workflow

### 1. Create the remote repository

Use the GitHub API via a temp file to avoid exposing the token in process listings:

```bash
auth_file=$(mktemp) && trap 'rm -f "$auth_file"' EXIT
grep '^GITHUB_TOKEN=' .env | sed 's/^GITHUB_TOKEN=/Authorization: token /' > "$auth_file"

# First, verify GITHUB_TOKEN has access
TOKEN_CHECK=$(curl -s -o /dev/null -w "%{http_code}" -X GET https://api.github.com/user \
  -H "@$auth_file" \
  -H "Accept: application/vnd.github.v3+json")

if [ "$TOKEN_CHECK" != "200" ]; then
  echo "ERROR: GITHUB_TOKEN does not have valid access. Check token permissions (requires repo scope)."
  exit 1
fi

# Check if token has org access if the repo is under an org
if [ -n "$GITHUB_ORG" ]; then
  ORG_CHECK=$(curl -s -o /dev/null -w "%{http_code}" -X GET "https://api.github.com/orgs/$GITHUB_ORG" \
    -H "@$auth_file" \
    -H "Accept: application/vnd.github.v3+json")
  if [ "$ORG_CHECK" != "200" ]; then
    echo "WARNING: Token does not have admin access to org '$GITHUB_ORG'. Falling back to user account."
  fi
fi

curl -s -X POST https://api.github.com/user/repos \
  -H "@$auth_file" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{"name": "<repo_name>", "private": <private>, "description": "<description>"}'
```

### 2. Initialize or reuse Git in the project

If Git is not yet initialized:

```bash
cd <target_dir>
git init
git config user.name "<GITHUB_USERNAME>"
git config user.email "<EMAIL>"
```

Stage all files, but **exclude `.opencode/` and `AGENTS.md`** unless the project is the template itself (`repo_name` is `nextjs-project-template`):

```bash
# If repo is the template, stage everything including .opencode and AGENTS.md
if [ "<repo_name>" = "nextjs-project-template" ]; then
  git add -A
else
  git add -A
  git reset -- .opencode/ AGENTS.md
fi

git commit -m "Initial commit by OpenCode automator"
```

If Git is already initialized with existing commits, skip this step.

### 3. Verify before pushing

Before pushing, run:
- `cd <target_dir> && npm run build` to verify the build passes. safe-build.sh retries automatically (exponential backoff, up to 10 min). Wait for the retries. If the build still fails after retries, abort and report the error.
- `git status` to confirm there are no unexpected files staged

### 4. Configure remote and push (SSH)

```bash
git branch -M main
git remote add origin git@github.com:<GITHUB_USERNAME>/<repo_name>.git
git push -u origin main
```

### 5. Configure deployment (mode-dependent)

Detect the deployment mode (check `next.config.ts` for `output: "export"`):

**If static mode** (`output: "export"` present) — Enable GitHub Pages:

```bash
curl -s -X POST "https://api.github.com/repos/<GITHUB_USERNAME>/<repo_name>/pages" \
  -H "@$auth_file" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{"build_type": "workflow"}'

# Wait and verify GitHub Pages is configured
sleep 5
PAGES_CHECK=$(curl -s -o /dev/null -w "%{http_code}" -X GET "https://api.github.com/repos/<GITHUB_USERNAME>/<repo_name>/pages" \
  -H "@$auth_file" \
  -H "Accept: application/vnd.github.v3+json")

if [ "$PAGES_CHECK" != "200" ]; then
  echo "WARNING: GitHub Pages configuration may have failed. Check https://github.com/<GITHUB_USERNAME>/<repo_name>/settings/pages"
  echo "Manual steps required:"
  echo "1. Go to Settings > Pages"
  echo "2. Set Source to 'GitHub Actions'"
  echo "3. The site will be available at https://<GITHUB_USERNAME>.github.io/<repo_name>/"
fi

> Note: If Pages is already configured, use `PUT` instead of `POST` on the same endpoint.

**If server mode** (`output: "export"` absent) — Skip GitHub Pages setup. The app needs a platform like Railway / Fly.io / Render / Vercel to run. Report the repo URL and suggest next steps for deployment.

### 6. Report

Return the GitHub repository URL and the deployment mode detected.

## Security

- **Never log, display, or persist** GITHUB_TOKEN
- Token is only used for the GitHub API call (creating the repo), never in git remote URLs (SSH is used for git)
- Read token from `.env` file in the workspace root, not from user message


## Output

Return the following JSON structure:

```json
{
  "status": "success | failed | skipped",
  "recommendations": []
}
```

Include generic recommendations for improving the template or pipeline based on your work. Each recommendation must target a specific agent file to prevent recurring issues.

