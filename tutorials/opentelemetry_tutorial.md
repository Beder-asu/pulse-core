# OpenTelemetry and Jaeger Tutorial: PulseCore Final Tracing

OpenTelemetry instruments each Node.js service and exports traces directly to Jaeger. The OpenTelemetry Collector config exists in the repo, but the current `docker-compose.yml` does not run a Collector service.

## 1. Final Runtime Flow

```text
Node service
  -> packages/common/src/tracing.js
  -> OTLP gRPC exporter
  -> jaeger:4317
  -> Jaeger UI at http://localhost:16686
```

## 2. Tracing Bootstrap

Every service Dockerfile starts Node like this:

```dockerfile
CMD ["node", "--require", "/app/node_modules/@pulsecore/common/src/tracing.js", "src/server.js"]
```

`--require` loads tracing before the service imports Express, Prisma, Kafka, Redis, or HTTP clients.

## 3. Shared Tracing File

The active tracing setup is `packages/common/src/tracing.js`.

```javascript
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://jaeger:4317',
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  }),
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

Each service name comes from `SERVICE_NAME` in Compose.

## 4. Final Jaeger Compose Config

```yaml
jaeger:
  image: jaegertracing/all-in-one:latest
  container_name: pulsecore-jaeger
  environment:
    - COLLECTOR_ZIPKIN_HOST_PORT=:9411
    - COLLECTOR_OTLP_ENABLED=true
  ports:
    - "16686:16686"
    - "4317:4317"
    - "4318:4318"
  networks:
    - hospital-network
  restart: unless-stopped
```

Jaeger receives OTLP traces on `4317` and serves the UI on `16686`.

## 5. What The Collector File Means

`monitoring/otel-collector-config.yml` defines a possible Collector pipeline for traces, metrics, and logs. It is not mounted by any current Compose service.

Current truth:

- implemented and running: direct service to Jaeger traces
- present but not running: OpenTelemetry Collector config
- future option: add an `otel-collector` service and point services at it

## 6. What To Demo

1. Visit `http://localhost:16686`.
2. Choose a service such as `auth-service`, `appointments-service`, or `doctors-service`.
3. Click `Find Traces`.
4. Open a trace waterfall.
5. Explain that each request becomes spans, and the service name is attached from `SERVICE_NAME`.

## 7. Current Limitation

HTTP and framework spans are visible. Kafka processing happens inside instrumented services, but explicit trace-context propagation through Kafka message headers is not implemented yet. That means the appointment request trace and notification consumer work may not always appear as one connected distributed trace.
