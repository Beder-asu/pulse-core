# Docker Compose Guide: PulseCore Final Stack

This tutorial explains the `docker-compose.yml` file as it exists now. The current Compose stack runs the React frontend, Nginx gateway, eight Node/Express services, PostgreSQL, Redis, Kafka, Prometheus, Loki, Jaeger, Grafana, and the one-shot `db-setup` initialization job.

## 1. Why Compose Exists Here

PulseCore is not one process. The application needs:

- one public gateway
- one built frontend
- eight backend services
- PostgreSQL databases for each service
- Redis for doctor read caching
- Kafka for appointment notification events
- Prometheus, Jaeger, Loki, and Grafana for observability
- a startup job that pushes Prisma schemas and seeds demo data

Compose gives those containers one shared Docker network and a reproducible startup order.

## 2. Required Environment Variables

The final Compose file intentionally refuses to start without required local secrets:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-this-local-db-password
JWT_SECRET=change-this-long-jwt-secret
INTERNAL_SERVICE_SECRET=change-this-internal-service-secret
DEMO_USER_PASSWORD=change-this-demo-user-password
GRAFANA_ADMIN_PASSWORD=change-this-grafana-password
```

`GRAFANA_ADMIN_USER` is optional and defaults to `admin`.

## 3. Core Persistence Services

PostgreSQL is exposed to the host on `localhost:5434`, but containers use the internal address `postgres:5432`.

```yaml
postgres:
  image: postgres:16-alpine
  container_name: pulsecore-postgres
  environment:
    POSTGRES_USER: ${POSTGRES_USER:?Set POSTGRES_USER in .env}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}
  ports:
    - "5434:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./docker/postgres/init-databases.sql:/docker-entrypoint-initdb.d/init-databases.sql:ro
  networks:
    - hospital-network
  restart: unless-stopped
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 5s
    timeout: 5s
    retries: 20
```

Redis is persistent through append-only files and the named `redis_data` volume.

```yaml
redis:
  image: redis:7.2-alpine
  container_name: pulsecore-redis
  command: ["redis-server", "--appendonly", "yes"]
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  networks:
    - hospital-network
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 5s
    timeout: 3s
    retries: 10
```

## 4. Database Setup Job

`db-setup` is not a server. It is expected to stop after success.

```yaml
db-setup:
  build:
    context: .
    dockerfile: Dockerfile.migrate
  container_name: pulsecore-db-setup
  environment:
    - POSTGRES_HOST=postgres
    - POSTGRES_PORT=5432
    - POSTGRES_USER=${POSTGRES_USER:?Set POSTGRES_USER in .env}
    - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}
    - DEMO_USER_PASSWORD=${DEMO_USER_PASSWORD:?Set DEMO_USER_PASSWORD in .env}
  networks:
    - hospital-network
  depends_on:
    postgres:
      condition: service_healthy
  restart: "no"
```

The job runs `npm run db:setup`, which calls `scripts/migrate_all.js` and `scripts/seed_all.js`.

## 5. Frontend and Gateway

The production frontend is a static Nginx container. The public entrypoint is the separate API gateway at `http://localhost`.

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: pulsecore-frontend
  expose:
    - "80"
  networks:
    - hospital-network
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "wget", "-q", "--spider", "http://127.0.0.1/health"]
    interval: 10s
    timeout: 3s
    retries: 5
```

```yaml
api-gateway:
  image: nginx:alpine
  container_name: pulsecore-gateway
  ports:
    - "80:80"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/cors.conf:/etc/nginx/cors.conf:ro
  networks:
    - hospital-network
  restart: unless-stopped
```

## 6. Service Pattern

Each service builds from the repository root because the image needs the root workspace files and `packages/common`.

```yaml
doctors-service:
  build:
    context: .
    dockerfile: services/doctors/Dockerfile
  container_name: pulsecore-doctors
  ports:
    - "3002:3002"
  environment:
    - POSTGRES_BASE_URL=postgresql://${POSTGRES_USER:?Set POSTGRES_USER in .env}:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}@postgres:5432/doctors_db
    - PORT=3002
    - SERVICE_NAME=doctors-service
    - NODE_ENV=production
    - JWT_SECRET=${JWT_SECRET:?Set JWT_SECRET in .env}
    - INTERNAL_SERVICE_SECRET=${INTERNAL_SERVICE_SECRET:?Set INTERNAL_SERVICE_SECRET in .env}
    - REDIS_URL=redis://redis:6379
    - REDIS_CONNECT_TIMEOUT_MS=1000
    - REDIS_RETRY_COOLDOWN_MS=5000
    - DOCTOR_LIST_CACHE_TTL_SECONDS=300
    - DOCTOR_PROFILE_CACHE_TTL_SECONDS=300
  networks:
    - hospital-network
  depends_on:
    db-setup:
      condition: service_completed_successfully
  restart: unless-stopped
```

Most services depend only on `db-setup`. Appointments and notification also depend on healthy Kafka.

## 7. Observability Services

Compose starts:

- Prometheus at `http://localhost:9090`
- Grafana at `http://localhost:3000`
- Jaeger at `http://localhost:16686`
- Loki API at `http://localhost:3100`

Grafana provisions Prometheus and Loki data sources. Jaeger is viewed directly in the Jaeger UI.

## 8. Volumes and Network

```yaml
volumes:
  postgres_data:
  redis_data:

networks:
  hospital-network:
    driver: bridge
```

Only PostgreSQL and Redis have named volumes. Kafka, Jaeger all-in-one, Prometheus, Loki, and Grafana use their container/image defaults in this local stack.

## 9. Final Startup Command

```bash
docker compose up -d --build
```

Then open:

- App: `http://localhost`
- Gateway API health checks: `http://localhost/api/<service>/health`
- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Jaeger: `http://localhost:16686`
