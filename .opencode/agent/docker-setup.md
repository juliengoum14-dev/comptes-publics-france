---
description: "Creates a multi-stage Dockerfile and .dockerignore for server-mode Next.js deployment on Railway/Fly.io/Render."
mode: subagent
permission:
  read: allow
  edit: allow
  bash: allow
  task: deny
---

# docker-setup

You create a Dockerfile and .dockerignore for server-mode Next.js deployment.

## Input

You receive:
- `target_dir`: Absolute path to the project directory
- `deploy_mode`: Must be `"server"` — otherwise skip entirely

## Files to create

### 1. `Dockerfile`

Create a multi-stage Dockerfile optimized for Next.js server mode:

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Build stage
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production runner
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production dependencies and build output
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "run", "start"]
```

### 2. `.dockerignore`

Create at the project root:

```
node_modules
.git
.gitignore
.env
.env.local
.env.*.local
*.md
.next
out/
dist/
.opencode/
README.md
AGENTS.md
data/
e2e/
promo/
```

## Rules

- Only create these files if `deploy_mode` is `"server"`
- If `deploy_mode` is `"static"`, skip and report: "Skipped docker-setup: static mode does not need a Dockerfile"
- Do NOT push to git
- Do NOT modify any existing files

## Validation

No build validation needed (Dockerfile is not compiled). Just ensure the files exist.

## Output

```json
{
  "status": "created | skipped",
  "files_created": ["Dockerfile", ".dockerignore"],
  "mode": "server | static",
  "reason": "Created for server-mode deployment | Skipped: static mode"
}
```


## Output

Return the following JSON structure:

```json
{
  "status": "success | failed | skipped",
  "recommendations": []
}
```

Include generic recommendations for improving the template or pipeline based on your work. Each recommendation must target a specific agent file to prevent recurring issues.

