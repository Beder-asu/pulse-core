# The Deep Dive: OpenTelemetry & Jaeger

## 1. Architectural Philosophy: The Telemetry Standard
Historically, distributed tracing was highly fragmented. If you used Datadog, you had to install the Datadog SDK. If you switched to NewRelic, you had to rewrite your entire codebase to use the NewRelic SDK.

**OpenTelemetry (OTel)** is the CNCF's solution to this. It is a vendor-agnostic standard. It provides a single set of APIs and SDKs to generate telemetry data. Once the data is generated, OTel uses an "Exporter" to translate the data into whatever format your backend database (Jaeger, Datadog, Zipkin) requires. If you change vendors tomorrow, you only change one line of code (the Exporter URL); your application code remains completely untouched.

## 2. The Data Model: Traces, Spans, and Events
To understand OTel, you must understand its hierarchy:

1. **The Trace:** A Trace represents the entire journey of a single request across your entire distributed system. It is identified by a 16-byte `Trace ID` (e.g., `4bf92f3577b34da6a3ce929d0e0e4736`). A Trace is simply a collection of Spans that share the same Trace ID.
2. **The Span:** A Span represents a single unit of work within a Trace. It has a start time, an end time, and an 8-byte `Span ID`.
   - A span can have a `Parent Span ID`. This creates a tree structure. For example, the `HTTP POST /appointments` span is the parent of the `DB INSERT` span.
3. **Span Attributes:** Key-value metadata attached to a Span (e.g., `http.method="POST"`, `db.statement="SELECT * FROM users"`).
4. **Events:** Timestamped logs attached to a specific Span (e.g., `"Cache miss, querying database"`).

## 3. The Magic: Context Propagation (W3C Trace Context)
How does the `auth-service` know that it is part of a trace initiated by the `api-gateway`? Through **Context Propagation**.

OpenTelemetry implements the **W3C Trace Context** specification. This is an official web standard.
When Node.js makes an outbound HTTP request (via `axios`, `fetch`, or native `http`), the OTel SDK intercepts the request and injects an HTTP header called `traceparent`.

**The `traceparent` header format:**
`00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`
- `00`: Version
- `4bf9...`: The Trace ID.
- `00f0...`: The Parent Span ID (the ID of the span that made the HTTP call).
- `01`: Trace Flags (e.g., `01` means "Sampled", telling the downstream service that this trace is actively being recorded).

When the receiving service's Express framework parses the incoming headers, the OTel SDK extracts the `traceparent`, reads the Trace ID, and ensures that any new spans generated in this service are attached to that exact same Trace ID.

## 4. How Auto-Instrumentation Works in Node.js
In strongly typed languages like Java or Go, OTel can use bytecode manipulation or explicit context passing.
In Node.js, things are highly asynchronous. A single HTTP request might trigger a database query, yield to the event loop, and resume a callback 50ms later. How does OTel know which HTTP request that database query belongs to?

**The `async_hooks` API:**
Node.js provides an experimental core module called `async_hooks`. It allows developers to track the lifetime of asynchronous resources (like Promises and Callbacks). The OTel SDK uses `async_hooks` (specifically `AsyncLocalStorage`) to store the current `Trace ID` in a context that survives across asynchronous boundaries.

When you install `@opentelemetry/auto-instrumentations-node`, it uses this mechanism to dynamically monkey-patch core modules like `http`, `pg`, `redis`, and `fs` at runtime.

## 5. How We Wired It Up in Our App
1. **The SDK Initialization (`packages/common/src/tracing.js`)**
   We instantiate the `NodeSDK`. We configure the `OTLPTraceExporter` to send our Spans to our Jaeger container over a highly-efficient gRPC connection on port 4317. (OTLP stands for OpenTelemetry Protocol, the standard binary wire format).

2. **The Docker Pre-load (`CMD`)**
   Node.js requires monkey-patching to happen *before* the application code is parsed. If `server.js` requires the `express` module before OTel patches it, the auto-instrumentation will fail.
   To guarantee OTel loads first, we modified our Dockerfiles to use the Node CLI `--require` flag:
   `node --require /app/node_modules/@pulsecore/common/src/tracing.js src/server.js`

3. **Jaeger Backend**
   We run `jaegertracing/all-in-one`. This is a specialized Docker image that contains:
   - The OTLP gRPC Receiver (Port 4317).
   - An internal, fast, in-memory database to store the Spans.
   - The Jaeger Web UI (Port 16686) which queries the database and renders the interactive Waterfall diagrams.
