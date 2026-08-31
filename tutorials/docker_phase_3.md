# Docker Phase 3: Final Service Images

This tutorial explains how PulseCore builds its Node.js service containers now.

## 1. Why Service Images Build From The Repo Root

Each backend service imports `@pulsecore/common`. Because this project uses npm workspaces, each service image needs:

- root `package.json`
- root `package-lock.json`
- `packages/common`
- the service's own source folder

That is why Compose uses root build context:

```yaml
auth-service:
  build:
    context: .
    dockerfile: services/auth/Dockerfile
```

This is different from a simple single-service tutorial where the build context might be `./services/auth`.

## 2. Final Service Dockerfile Pattern

All backend service Dockerfiles follow the same structure:

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl

COPY package*.json ./
COPY packages/common ./packages/common
COPY services/doctors ./services/doctors

RUN npm install --workspaces --include-workspace-root

WORKDIR /app/services/doctors
RUN /app/node_modules/.bin/prisma generate

EXPOSE 3002
CMD ["node", "--require", "/app/node_modules/@pulsecore/common/src/tracing.js", "src/server.js"]
```

The only service-specific differences are the copied service path, `WORKDIR`, exposed port, and Compose environment variables.

## 3. Why `prisma generate` Runs In The Image

Prisma Client must be generated inside the Linux image. A client generated on Windows may not match the container runtime. Each image runs:

```dockerfile
RUN /app/node_modules/.bin/prisma generate
```

The database schema push is not done in each service image. Schema setup happens once in the `db-setup` job.

## 4. Why OpenTelemetry Uses `--require`

Every service starts with:

```dockerfile
CMD ["node", "--require", "/app/node_modules/@pulsecore/common/src/tracing.js", "src/server.js"]
```

`--require` loads tracing before Express, Prisma, Redis, Kafka, or HTTP clients are imported. That gives OpenTelemetry the best chance to auto-instrument the service.

## 5. Final Migration Image

`Dockerfile.migrate` is the initialization image used by `db-setup`:

```dockerfile
FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache openssl

COPY package*.json ./
COPY packages/common ./packages/common
COPY services ./services
COPY scripts ./scripts

RUN npm install --workspaces --include-workspace-root

ENV POSTGRES_HOST=postgres
ENV POSTGRES_PORT=5432

CMD ["npm", "run", "db:setup"]
```

This image has all service schemas and seed scripts, so it can initialize every service database.

## 6. Final Frontend Image

The React app is built with Vite and served by Nginx:

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
```

The frontend container is internal. The public browser URL is still `http://localhost` through the gateway.

## 7. Ignore Rules

The root `.dockerignore` keeps generated and local files out of Docker contexts:

```dockerignore
.git
.gitignore
.gitattributes
.agents
.codex
**/node_modules
**/dist
**/build
**/.env
**/.env.*
!**/.env.example
coverage
.nyc_output
*.log
*.db
*.db-journal
*.sqlite
*.sqlite3
.DS_Store
Thumbs.db
```

Prisma migrations are intentionally not ignored.

## 8. Validation Commands

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

For service tests, build a service image and run tests inside it:

```bash
docker build -f services/doctors/Dockerfile .
```
