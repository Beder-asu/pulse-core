# Loki Tutorial: PulseCore Final Logging Status

Loki is present in the Compose stack and provisioned in Grafana, but application log shipping is opt-in. The verified logging path remains Docker container stdout logs.

## 1. Final Loki Compose Config

```yaml
loki:
  image: grafana/loki:2.9.0
  container_name: pulsecore-loki
  ports:
    - "3100:3100"
  volumes:
    - ./monitoring/loki-config.yaml:/etc/loki/local-config.yaml
  networks:
    - hospital-network
  restart: unless-stopped
```

Loki is available at:

```text
http://localhost:3100
```

## 2. Final Loki Server Config

The mounted file is `monitoring/loki-config.yaml`.

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093
```

## 3. Grafana Data Source

Grafana provisions Loki from `monitoring/grafana/provisioning/datasources/datasource.yml`.

```yaml
- name: Loki
  uid: loki
  type: loki
  access: proxy
  url: http://loki:3100
  isDefault: false
  editable: false
```

## 4. Application Logger Wiring

The shared logger lives at `packages/common/src/logger.js`.

By default, every service logs to console:

```javascript
const transports = [
  new winston.transports.Console(...)
];
```

Loki transport is only added when:

```env
ENABLE_LOKI_LOGGING=true
```

When enabled, logs are sent to:

```env
LOKI_URL=http://loki:3100
```

The Loki label is:

```javascript
labels: { app: process.env.SERVICE_NAME || 'unknown-service' }
```

## 5. What Is Verified

Verified:

- Loki container exists in Compose.
- Grafana has a Loki data source.
- Application services log to Docker stdout.

Conservative status:

- Loki application log shipping is opt-in.
- It should not be presented as the default verified log path unless `ENABLE_LOKI_LOGGING=true` has been enabled and tested in the current run.

## 6. Demo Checklist

Default demo:

```bash
docker compose logs auth-service
docker compose logs appointments-service
docker compose logs notification-service
```

If Loki logging is enabled and verified, use Grafana Explore with queries like:

```logql
{app="auth-service"}
```

```logql
{app="appointments-service"} |= "Kafka"
```
