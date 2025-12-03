# Railway Deployment Guide - TwoFeetUp

Complete reference for deploying TwoFeetUp projects to Railway without errors.

---

## Quick Start Decision Tree

```
What type of project are you deploying?
|
+-- Next.js with Prisma/Database?
|   --> Use DOCKERFILE builder (Section 2.1)
|
+-- Vite/React static site?
|   --> Use DOCKERFILE with Nginx (Section 2.3)
|
+-- Express/Node.js API only?
|   --> Use NIXPACKS builder (Section 2.2)
|
+-- Monorepo (frontend + backend)?
|   --> Use NIXPACKS with nixpacks.toml (Section 2.4)
|
+-- Python/Flask?
|   --> Use Procfile (Section 2.5)
```

---

## 1. Railway Configuration Files

Every Railway project needs a `railway.json` file in the project root. This tells Railway how to build and deploy your application.

### Schema Reference
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE | NIXPACKS",
    "dockerfilePath": "Dockerfile",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "node server.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 2. Copy-Paste Templates

### 2.1 Next.js + Prisma (Dockerfile Builder)

**railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Dockerfile**
```dockerfile
# Stage 1: Dependencies
FROM oven/bun:1.3-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY prisma ./prisma
# Placeholder DATABASE_URL for Prisma generate during build
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN bun install --frozen-lockfile

# Stage 2: Build
FROM oven/bun:1.3-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN bun run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install Prisma CLI for migrations
RUN npm install -g prisma

# Copy Prisma files
COPY --from=deps /app/prisma ./prisma
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

# Copy application files
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000

# Run migrations before starting
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

**next.config.js** (required setting)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... other config
}
module.exports = nextConfig
```

**Health check endpoint** (pages/api/health.ts or app/api/health/route.ts)
```typescript
// App Router (app/api/health/route.ts)
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
}

// Pages Router (pages/api/health.ts)
export default function handler(req, res) {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

---

### 2.2 Express/Node.js Backend (Nixpacks)

**railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "node dist/server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**nixpacks.toml** (optional, for custom configuration)
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "node dist/server.js"
```

**Health check endpoint**
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
```

---

### 2.3 Vite Static Site (Nginx Dockerfile)

**railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "healthcheckPath": "/",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Dockerfile**
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
ENV PORT=3000
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf**
```nginx
server {
    listen ${PORT};
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /health {
        return 200 'ok';
        add_header Content-Type text/plain;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

---

### 2.4 Monorepo (Frontend + Backend)

**railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build && cd backend && npm install && npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "cd backend && node dist/server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**nixpacks.toml**
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install", "cd backend && npm install"]

[phases.build]
cmds = ["npm run build", "cd backend && npx prisma generate && npm run build"]

[start]
cmd = "cd backend && node dist/server.js"
```

---

### 2.5 Python/Flask

**Procfile** (in project root)
```
web: python app.py
```

Or with Gunicorn:
```
web: gunicorn app:app --bind 0.0.0.0:$PORT
```

**requirements.txt**
```
flask>=2.0
flask-cors>=3.0
gunicorn>=20.0
# Add other dependencies
```

**app.py health check**
```python
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/health')
def health():
    return jsonify(status='ok')

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
```

---

### 2.6 .dockerignore (Standard Template)

```
# Dependencies
node_modules/
.pnp/
.pnp.js

# Build outputs
.next/
dist/
build/
out/

# Environment files
.env
.env.local
.env.development
.env.production
.env*.local

# Development
.git/
.gitignore
.vscode/
.idea/

# Docker
Dockerfile
docker-compose*.yml
.dockerignore

# Tests
coverage/
.nyc_output/
__tests__/
*.test.js
*.spec.js

# Documentation
README.md
CHANGELOG.md
docs/

# Misc
*.log
npm-debug.log*
yarn-debug.log*
.DS_Store
Thumbs.db
```

---

## 3. Environment Variables

### 3.1 Standard Variables (All Projects)

Set these in Railway Dashboard > Variables:

```bash
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
```

### 3.2 Database (PostgreSQL/Prisma)

When you add a PostgreSQL database in Railway, it auto-creates `DATABASE_URL`. Reference it:

```bash
# In Railway dashboard, the variable is auto-set
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Or reference the specific service
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
```

### 3.3 Email (Gmail SMTP)

Standard TwoFeetUp email configuration:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@twofeetup.com
SMTP_PASS=[16-character-app-password]
SMTP_FROM_NAME=TwoFeetUp
FRONTEND_URL=https://your-app.up.railway.app
```

**Getting Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "TwoFeetUp Railway"
4. Copy the 16-character password (remove spaces)

### 3.4 Service-to-Service Networking

Reference other Railway services in the same project:

```bash
# Private domain (internal, faster)
POCKETBASE_URL=http://${{Pocketbase.RAILWAY_PRIVATE_DOMAIN}}:8090

# Public domain (external access)
API_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

### 3.5 AI/ML API Keys

Common API keys used in TwoFeetUp projects:

```bash
# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini
GOOGLE_AI_API_KEY=...

# OpenAI
OPENAI_API_KEY=sk-...

# Groq
GROQ_API_KEY=gsk_...

# Fireflies.ai
FIREFLIES_API_KEY=...
```

### 3.6 PocketBase

```bash
POCKETBASE_URL=http://localhost:8090
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
```

### 3.7 Authentication

```bash
JWT_SECRET=[generate-secure-random-string]
NEXTAUTH_SECRET=[generate-secure-random-string]
NEXTAUTH_URL=https://your-app.up.railway.app
```

---

## 4. Common Errors & Solutions

### 4.1 Build Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `prisma generate failed: Cannot find module` | Missing DATABASE_URL during build | Add placeholder `ENV DATABASE_URL="postgresql://x:x@localhost:5432/x"` in Dockerfile |
| `bun install: frozen lockfile` | bun.lock doesn't match package.json | Run `bun install` locally to update lock, or remove `--frozen-lockfile` |
| `npm ERR! ENOMEM` | Out of memory during build | Split build steps, reduce parallelism |
| `Error: Cannot find module 'xyz'` | Dependencies not installed | Check package.json, run clean install |
| `Next.js: standalone output not found` | Missing config | Add `output: 'standalone'` to next.config.js |

### 4.2 Runtime Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Health check failed` | Endpoint not responding | Verify `/api/health` exists and returns 200 |
| `Container keeps restarting` | Crash on startup | Check logs, verify env vars, check PORT usage |
| `EADDRINUSE: Port already in use` | Hardcoded port | Always use `process.env.PORT` |
| `Cannot connect to database` | Wrong DATABASE_URL | Use Railway's auto-injected variable |
| `Error: listen EACCES` | Permission denied on port | Use port > 1024, run as non-root |

### 4.3 Database Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Database not running or wrong URL | Check DATABASE_URL, verify DB service is up |
| `P1001: Can't reach database` | Network issue | Use Railway's internal networking |
| `P3009: Migrate failed` | Schema conflicts | Check migration files, consider `prisma migrate reset` |
| `Unique constraint violation` | Duplicate data | Check seed data, clean database |

### 4.4 Health Check Failures

**Symptoms:** Deployment never goes live, shows "unhealthy"

**Checklist:**
1. Health endpoint exists at the exact path in `healthcheckPath`
2. Endpoint returns HTTP 200 status
3. Response returns within `healthcheckTimeout` seconds
4. Application has finished starting before health check runs

**Debug steps:**
```bash
# Test locally
curl http://localhost:3000/api/health

# Check Railway logs for startup errors
# Look for: "listening on port 3000" or similar
```

---

## 5. Security Best Practices

### 5.1 Non-Root User in Dockerfile

```dockerfile
# Add after FROM in runner stage
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Before EXPOSE
USER nextjs
```

### 5.2 Never Commit Secrets

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json
```

### 5.3 Use Railway Secrets

- Store all secrets in Railway Dashboard > Variables
- Never put secrets in Dockerfile or railway.json
- Use variable references: `${{Postgres.DATABASE_URL}}`

### 5.4 Keep Dependencies Updated

```bash
# Check for vulnerabilities
npm audit
bun audit

# Update dependencies
npm update
bun update
```

---

## 6. Pre-Deployment Checklist

Before deploying, verify:

```markdown
## Configuration Files
- [ ] railway.json exists in project root
- [ ] Correct builder specified (DOCKERFILE or NIXPACKS)
- [ ] Dockerfile exists (if using DOCKERFILE builder)

## Health Check
- [ ] Health endpoint implemented (/api/health or /health)
- [ ] Endpoint returns 200 status with JSON body
- [ ] healthcheckPath in railway.json matches endpoint

## Environment
- [ ] All required env vars documented
- [ ] Secrets stored in Railway dashboard, not in code
- [ ] PORT uses process.env.PORT (not hardcoded)

## Security
- [ ] .dockerignore excludes .env files
- [ ] Non-root user in Dockerfile
- [ ] No secrets in logs or error messages

## Database (if applicable)
- [ ] Migrations included in startup CMD
- [ ] Placeholder DATABASE_URL in Dockerfile for build
- [ ] Prisma client generated

## Next.js Specific
- [ ] output: 'standalone' in next.config.js
- [ ] Static files copied in Dockerfile
- [ ] Public folder copied

## Final Steps
- [ ] Test build locally: docker build -t test .
- [ ] Test run locally: docker run -p 3000:3000 test
- [ ] Commit and push to trigger Railway deployment
```

---

## 7. Debugging Deployments

### 7.1 View Build Logs

1. Railway Dashboard > Your Project > Deployments
2. Click on the failed deployment
3. View "Build Logs" tab

### 7.2 View Runtime Logs

1. Railway Dashboard > Your Project > Service
2. Click "View Logs" or Deployments > Deploy Logs

### 7.3 Common Log Patterns

**Successful startup:**
```
Listening on port 3000
Server started successfully
Database connected
```

**Failed startup:**
```
Error: Missing required environment variable
Cannot connect to database
Module not found
```

### 7.4 SSH into Container (if needed)

Railway provides a shell for debugging:
1. Service > Settings > Enable "Public Networking"
2. Use Railway CLI: `railway shell`

---

## 8. Advanced Patterns

### 8.1 Multi-Service Projects

Create separate services in Railway for:
- Frontend (Next.js/Vite)
- Backend (Express/API)
- Database (PostgreSQL)
- PocketBase (if used)

Link them using internal networking:
```bash
# In Backend service
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}

# In Frontend service
NEXT_PUBLIC_API_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

### 8.2 Scheduled Jobs (Cron)

Use Railway's built-in cron:
```json
{
  "deploy": {
    "cronSchedule": "0 0 * * *"
  }
}
```

### 8.3 Custom Domains

1. Railway Dashboard > Service > Settings > Domains
2. Add custom domain
3. Update DNS with CNAME record to Railway domain

### 8.4 Volumes for Persistent Storage

For file uploads that persist:
1. Railway Dashboard > Service > Settings > Volumes
2. Add volume mounted to `/app/uploads`
3. Configure application to use that path

---

## 9. Quick Reference

### Builders Comparison

| Builder | Best For | Pros | Cons |
|---------|----------|------|------|
| DOCKERFILE | Next.js, Prisma, custom builds | Full control, optimized images | More setup |
| NIXPACKS | Express, simple Node.js | Zero config, auto-detection | Less control |
| Procfile | Python, legacy | Simple | Limited options |

### Port Reference

| Service Type | Default Port | Environment Variable |
|--------------|--------------|---------------------|
| Next.js | 3000 | PORT |
| Express | 3000 | PORT |
| Vite dev | 5173 | PORT |
| PostgreSQL | 5432 | (managed by Railway) |
| PocketBase | 8090 | (custom) |

### Health Check Standards

| Path | Timeout | Use Case |
|------|---------|----------|
| /api/health | 30s | Next.js API routes |
| /health | 30s | Express/Node.js |
| / | 30s | Static sites |

---

## 10. TwoFeetUp Specific Patterns

### Standard Email Configuration
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@twofeetup.com
SMTP_PASS=[app-password]
SMTP_FROM_NAME=TwoFeetUp
```

### PocketBase Integration
```bash
POCKETBASE_URL=http://${{Pocketbase.RAILWAY_PRIVATE_DOMAIN}}:8090
NEXT_PUBLIC_POCKETBASE_URL=https://${{Pocketbase.RAILWAY_PUBLIC_DOMAIN}}
```

### Common AI Services
```bash
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
FIREFLIES_API_KEY=...
```

---

*Last updated: November 2025*
*Based on patterns from 15+ TwoFeetUp production deployments*
