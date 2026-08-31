# Redis Caching Tutorial: PulseCore Final Doctor Cache

Redis is the fast cache layer in PulseCore. It is currently wired only into the Doctors service.

## 1. What Redis Does Here

PostgreSQL remains the source of truth. Redis stores short-lived JSON copies of doctor profiles so repeated reads can avoid hitting PostgreSQL.

Current scope:

- cached: doctor list reads
- cached: doctor profile reads by profile ID or Auth user ID
- not cached: patients, appointments, lab, pharmacy, billing, notifications
- not used for: JWT refresh tokens, authorization, Kafka, appointment locks, primary persistence

## 2. Final Redis Compose Config

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

## 3. Doctors Service Environment

```yaml
- REDIS_URL=redis://redis:6379
- REDIS_CONNECT_TIMEOUT_MS=1000
- REDIS_RETRY_COOLDOWN_MS=5000
- DOCTOR_LIST_CACHE_TTL_SECONDS=300
- DOCTOR_PROFILE_CACHE_TTL_SECONDS=300
```

## 4. Shared Redis Adapter

The generic adapter lives in:

```text
packages/common/src/redis-client.js
```

It handles:

- lazy connection
- JSON serialization
- TTL writes
- malformed JSON cleanup
- fail-open behavior when Redis is unavailable
- Prometheus cache operation counters

## 5. Doctor Cache Policy

The domain-specific cache rules live in:

```text
services/doctors/src/cache/doctorProfileCache.js
```

Keys:

```text
doctors:profiles:v1:all
doctors:profiles:v1:<doctorProfileId>
doctors:profiles:v1:<doctorUserId>
```

The Doctors service uses cache-aside reads:

```text
GET doctor list
  -> check Redis list key
  -> if hit, return cached JSON
  -> if miss, query PostgreSQL
  -> write list and profile keys back to Redis
```

Profile creation invalidates and warms:

```text
POST doctor profile
  -> write PostgreSQL
  -> delete doctors:profiles:v1:all
  -> set profile key by profile ID
  -> set profile key by Auth user ID
```

## 6. Failure Mode

Redis failures do not break the app. Cache calls return miss/failure values and the service continues through PostgreSQL.

This is intentional because Redis is an optimization, not the system of record.

## 7. Demo Checklist

1. Open `http://localhost/api/doctors/health`.
2. Login to the app and visit pages that load doctors.
3. Inspect Redis keys:

```bash
docker exec pulsecore-redis redis-cli keys 'doctors:*'
```

4. Fetch doctors again.
5. Watch cache operation counters on a service `/metrics` endpoint or in Prometheus.
