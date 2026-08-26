# The Deep Dive: Prometheus & Time-Series Data

## 1. Architectural Philosophy: The Pull Model
At the core of Prometheus's design is the **Pull-based Architecture**.

In traditional monitoring (like StatsD or Graphite), applications push their data to a central metrics server via UDP or TCP.
**The Push Problem:** If a sudden traffic spike hits your cluster, your 8 microservices spawn thousands of concurrent threads. Each thread attempts to push metrics to the central server, effectively launching an internal DDoS attack on your monitoring infrastructure. If the central server goes down, your apps might block or drop critical data.

**The Pull Solution:** Prometheus reverses this. Your applications are completely passive. They simply maintain a lightweight `/metrics` endpoint in memory. Every 15 seconds, the Prometheus server reaches out (scrapes) the endpoints. If a microservice crashes, Prometheus simply records a "scrape failure" and moves on. The application is completely decoupled from the monitoring infrastructure's performance.

## 2. The Internal Engine: TSDB
Prometheus is a custom-built **Time-Series Database (TSDB)**. It is not relational (like SQL) or document-based (like MongoDB). It stores streams of timestamped values belonging to the same metric and the same set of labeled dimensions.

**The Data Model:**
Every time-series is uniquely identified by its metric name and optional key-value pairs called labels.
```text
<metric_name>{<label_name>=<label_value>, ...}
```
Example: `http_requests_total{method="POST", status="500", service="auth-service"}`

Because Prometheus compresses data in two-hour blocks using delta-encoding (storing only the *difference* between the last timestamp and the current one), it can store millions of data points on a tiny hard drive.

## 3. The 4 Core Metric Types
To understand Prometheus, you must understand its 4 primitive data types:

1. **Counter:** A cumulative metric that represents a single monotonically increasing counter whose value can only increase or be reset to zero on restart.
   - *Use Case:* Total number of HTTP requests, total number of errors, total bytes sent.
2. **Gauge:** A metric that represents a single numerical value that can arbitrarily go up and down.
   - *Use Case:* Active HTTP connections, CPU usage, Memory heap size.
3. **Histogram:** Samples observations (usually things like request durations or response sizes) and counts them in configurable buckets. It also provides a sum of all observed values.
   - *Use Case:* Tracking how many requests took < 100ms, how many took < 500ms, and how many took < 1s. This is crucial for calculating SLA percentiles (e.g., 99th percentile latency).
4. **Summary:** Similar to a histogram, but calculates configurable quantiles over a sliding time window directly on the client side.

## 4. How it operates in our Node.js Stack
When we injected `express-prom-bundle` and `prom-client` into our Node.js services, we actually activated several things under the hood:

### V8 Engine Metrics
`prom-client` taps directly into the Node.js `v8` module. It exposes internal metrics that are normally invisible:
- `nodejs_heap_space_size_used_bytes`: Exactly how much memory the Garbage Collector is managing.
- `nodejs_eventloop_lag_seconds`: How long the single-threaded Event Loop is blocked by synchronous code. If this spikes, your API will freeze!

### The Express Middleware
The `express-prom-bundle` injects a hook at the very beginning of the Express request lifecycle.
1. It records `process.hrtime()` (high-resolution time).
2. It waits for the `res.on('finish')` event.
3. It calculates the duration.
4. It increments the `http_requests_total` Counter and adds the duration to the `http_request_duration_seconds` Histogram.

## 5. Advanced PromQL (Prometheus Query Language)
PromQL is a functional query language that lets you slice and dice time-series data.

**Rate Calculation (The most important function):**
You rarely query a Counter directly. If `http_requests_total` is `5,000`, that tells you nothing about current traffic. You need the *rate of increase*.
```promql
# How many requests per second over the last 5 minutes?
rate(http_requests_total{service="patients-service"}[5m])
```

**Aggregation:**
If you have 5 replicas of the `patients-service` running, you want the total traffic across all of them, ignoring the specific instance IP.
```promql
sum by (method, status) (rate(http_requests_total{service="patients-service"}[5m]))
```

**Alerting Rules (SLA Breach):**
You can write PromQL queries that trigger PagerDuty alerts if a condition is met.
```promql
# Alert if the error rate exceeds 5% of total traffic
(
  sum(rate(http_requests_total{status=~"5.."}[5m]))
  /
  sum(rate(http_requests_total[5m]))
) > 0.05
```
