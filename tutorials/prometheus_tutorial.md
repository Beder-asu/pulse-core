# Prometheus Tutorial: PulseCore Final Metrics

Prometheus collects time-series metrics from PulseCore services. The app does not push metrics to Prometheus; Prometheus pulls from each service's `/metrics` endpoint every 15 seconds.

## 1. Final Prometheus Config

The current file is `monitoring/prometheus.yml`.

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'hospital-services'
    static_configs:
      - targets:
        - 'auth-service:3008'
        - 'patients-service:3001'
        - 'doctors-service:3002'
        - 'appointments-service:3003'
        - 'lab-service:3004'
        - 'pharmacy-service:3005'
        - 'billing-service:3006'
        - 'notification-service:3007'
```

Prometheus itself is exposed at:

```text
http://localhost:9090
```

## 2. Service Metrics Middleware

Every service uses the shared middleware from `packages/common/src/metrics.js`.

```javascript
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { service: process.env.SERVICE_NAME || 'unknown-service' },
  promClient: {
    collectDefaultMetrics: {},
  },
});
```

This adds:

- HTTP request count and latency metrics
- method, path, and status labels
- an `up` metric
- Node.js default metrics such as heap and event loop metrics
- a `service` label from `SERVICE_NAME`

## 3. Important Labels

Prometheus adds labels such as:

- `job="hospital-services"`
- `instance="auth-service:3008"`

The app also adds:

- `service="auth-service"`

Grafana currently uses `instance` in several dashboard panels because it reliably identifies scrape targets. Raw Prometheus queries can use either `instance` or the app-provided `service` label depending on the metric.

## 4. Useful Queries

Service availability:

```promql
up{job="hospital-services"}
```

Request rate by instance:

```promql
sum by (instance) (rate(http_request_duration_seconds_count{job="hospital-services"}[5m]))
```

Request rate by service label:

```promql
sum by (service) (rate(http_request_duration_seconds_count{job="hospital-services"}[5m]))
```

p95 latency:

```promql
histogram_quantile(
  0.95,
  sum by (le, instance) (
    rate(http_request_duration_seconds_bucket{job="hospital-services"}[5m])
  )
)
```

Node heap usage:

```promql
nodejs_heap_size_used_bytes{job="hospital-services"}
```

## 5. Grafana Wiring

Grafana provisions Prometheus with UID `prometheus` from `monitoring/grafana/provisioning/datasources/datasource.yml`.

```yaml
- name: Prometheus
  uid: prometheus
  type: prometheus
  access: proxy
  url: http://prometheus:9090
  isDefault: true
  editable: false
```

The dashboard JSON lives at:

```text
monitoring/grafana/dashboards/hospital-dashboard.json
```

Its UID is:

```text
pulsecore-hospital-services
```

## 6. Demo Checklist

1. Open `http://localhost:9090/targets`.
2. Confirm `hospital-services` targets are `UP`.
3. Open `http://localhost:3000`.
4. Login with the Grafana credentials from `.env`.
5. Open the `PulseCore Hospital Services` dashboard.
