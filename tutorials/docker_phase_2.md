# Docker Phase 2: Final Gateway, Redis, and Kafka Wiring

This file used to be a phase-by-phase setup note. It now documents the final PulseCore gateway, Redis, and Kafka configuration that exists in `docker-compose.yml`.

## 1. API Gateway

The browser talks to one public origin:

```text
http://localhost
```

Nginx owns port `80` on the host and routes:

- `/api/auth` to `auth-service:3008`
- `/api/patients` to `patients-service:3001`
- `/api/doctors` to `doctors-service:3002`
- `/api/appointments` to `appointments-service:3003`
- `/api/lab` to `lab-service:3004`
- `/api/pharmacy` to `pharmacy-service:3005`
- `/api/billing` to `billing-service:3006`
- `/api/notifications` to `notification-service:3007`
- everything else to the frontend container

Final Compose entry:

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
  depends_on:
    frontend:
      condition: service_healthy
    db-setup:
      condition: service_completed_successfully
    auth-service:
      condition: service_started
    patients-service:
      condition: service_started
    doctors-service:
      condition: service_started
    appointments-service:
      condition: service_started
    lab-service:
      condition: service_started
    pharmacy-service:
      condition: service_started
    billing-service:
      condition: service_started
    notification-service:
      condition: service_started
```

## 2. Redis

Redis is currently used by the Doctors service for cache-aside doctor list and profile reads. It is not the database, not the JWT session store, and not an appointment lock.

Final Compose entry:

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

The Doctors service receives:

```yaml
- REDIS_URL=redis://redis:6379
- REDIS_CONNECT_TIMEOUT_MS=1000
- REDIS_RETRY_COOLDOWN_MS=5000
- DOCTOR_LIST_CACHE_TTL_SECONDS=300
- DOCTOR_PROFILE_CACHE_TTL_SECONDS=300
```

## 3. Kafka

Kafka runs in KRaft mode, so there is no Zookeeper container.

Final Compose entry:

```yaml
kafka:
  image: confluentinc/cp-kafka:7.5.0
  container_name: pulsecore-kafka
  ports:
    - "9092:9092"
  environment:
    KAFKA_NODE_ID: 1
    KAFKA_PROCESS_ROLES: broker,controller
    KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:29093
    KAFKA_LISTENERS: PLAINTEXT://kafka:29092,CONTROLLER://kafka:29093,PLAINTEXT_HOST://0.0.0.0:9092
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
    KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
    KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    CLUSTER_ID: ADUDsqPd7-TKj2h5CMXyrw
  networks:
    - hospital-network
  restart: unless-stopped
  healthcheck:
    test: ["CMD-SHELL", "kafka-topics --bootstrap-server localhost:9092 --list >/dev/null 2>&1"]
    interval: 10s
    timeout: 5s
    retries: 12
    start_period: 20s
```

Appointments and notification use the internal broker address:

```yaml
- KAFKA_BROKERS=kafka:29092
```

The host port `localhost:9092` is for host-side inspection tools. Containers should use `kafka:29092`.

## 4. What To Demo

1. Start the stack with `docker compose up -d --build`.
2. Confirm `pulsecore-kafka` is healthy.
3. Book an appointment in the app.
4. Show that the notification appears after the Kafka consumer handles the `AppointmentCreated` event.
5. Open Jaeger and search for `appointments-service` and `notification-service` traces.
