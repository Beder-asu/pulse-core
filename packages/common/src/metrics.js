const promBundle = require('express-prom-bundle');

// This middleware tracks HTTP request duration and status codes,
// and automatically exposes a /metrics endpoint for Prometheus.
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

module.exports = {
  metricsMiddleware,
};
