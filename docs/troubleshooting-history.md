# PulseCore Troubleshooting History

This document records the errors, incomplete behaviors, and infrastructure problems encountered while turning PulseCore from a partially scaffolded project into a working Docker Compose application. It is reconstructed from the working sessions, repository history, and current files.

It deliberately distinguishes between a confirmed fix, a design correction, and work that is still incomplete. It does not treat an infrastructure container merely being present as proof that an application integration works.

## Final Verified Shape

The current application has a React frontend behind an Nginx gateway, eight Node.js services, service-owned PostgreSQL databases managed through Prisma, JWT authentication, one Kafka appointment-notification workflow, Prometheus metrics, a provisioned Grafana dashboard, and OpenTelemetry traces exported to Jaeger.

The main entry points are:

- Application and gateway: `http://localhost`
- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Jaeger: `http://localhost:16686`
- Loki API: `http://localhost:3100`

## 1. Repository Started as Inconsistent Scaffolding

**Symptom**

The project contained Express/Mongoose models and MongoDB-oriented configuration, but much of the application behavior was boilerplate. Several controllers returned static or placeholder responses, frontend pages displayed local sample data, and the documentation described capabilities that were not connected end to end.

**Root cause**

The repository had evolved in stages. Its models, Compose configuration, documentation, and frontend did not describe one consistent runtime architecture.

**Resolution**

- Audited routes, controllers, services, models, Compose configuration, frontend pages, and documentation.
- Replaced the unfinished Mongoose persistence layer with service-owned Prisma schemas and PostgreSQL databases.
- Removed obsolete Mongoose models and the unused shared MongoDB connector.
- Updated documentation to describe the files and runtime that actually exist.

**Status:** Fixed and verified through real CRUD and restart tests.

## 2. Backend Endpoints Were Stubs or Incomplete

**Symptom**

Services could start, but important workflows did not perform complete CRUD operations. Some responses were hardcoded, some routes were missing, and there was no reliable path from a frontend action to persisted data.

**Root cause**

The initial service code established the MVC structure without completing the business and persistence layers.

**Resolution**

- Implemented controllers and routes for authentication, patients, doctors, appointments, lab orders, pharmacy, billing, and notifications.
- Added validation and shared error handling.
- Added Prisma schemas and seeds for every service database.
- Added a gateway E2E test script to exercise the public API surface.

**Status:** Fixed and verified for the implemented workflows.

## 3. Authentication Was Not a Real End-to-End Flow

**Symptom**

Protected pages and APIs were not consistently backed by a real login lifecycle. The frontend could rely on development behavior instead of a token issued by the backend.

**Root cause**

There was no complete Auth service and the frontend API layer was not consistently attaching and handling JWTs.

**Resolution**

- Implemented registration and login in the Auth service.
- Added bcrypt password hashing and JWT issuance.
- Seeded role-based demo users.
- Added shared JWT verification middleware to protected services.
- Added a frontend Axios client that stores and attaches the token.
- Redirected users to login after a `401` response.
- Removed the dummy development-token behavior.

**Status:** Fixed and verified with the seeded admin account and protected API requests.

## 4. Static Routes Could Be Captured by Dynamic Routes

**Symptom**

Some named endpoints could be interpreted as an ID. For example, a route such as `/health` or `/profile` can be swallowed by `/:id` when the dynamic route is registered first.

**Root cause**

Express matches routes in declaration order. `/:id` accepts any single path segment unless it is constrained, so it can capture names intended for a later static route.

**Resolution**

- Registered static routes such as `/health` and `/profile` before `/:id` routes.
- Kept collection routes before item routes.
- Removed or replaced ambiguous routes during the controller rewrite.

**Status:** Fixed in the current route definitions.

## 5. The Frontend Was Visually Present but Disconnected

**Symptom**

Pages looked like an application but used placeholder values, incomplete forms, or buttons with no real backend effect. Refreshing could lose state because it had never been persisted.

**Root cause**

The frontend had been built before the final API contracts and persistence workflows existed.

**Resolution**

- Added a shared API client using the gateway's `/api` prefix.
- Connected dashboard, patient, appointment, lab, pharmacy, billing, history, and clinical views to backend endpoints.
- Added working create/update flows where supported.
- Added loading, empty, success, validation, and error states.
- Added protected routing, logout, and a not-found page.

**Status:** Fixed and manually verified through the browser.

## 6. Login Panel Was Misaligned

**Symptom**

The login card was positioned toward the upper-left area instead of being centered in the available viewport.

**Root cause**

The login page container did not use full-height centering constraints.

**Resolution**

Updated the page layout so the login component is centered horizontally and vertically while retaining responsive spacing.

**Status:** Fixed and visually verified.

## 7. Login Returned `502 Bad Gateway`

**Symptom**

The browser reported:

```text
api/auth/login: Failed to load resource: 502 (Bad Gateway)
```

The same failure remained after retrying the form.

**Root cause**

Nginx was reachable, but it could not reach the Auth service through the upstream address it had resolved. Docker service containers can receive a new IP after being recreated, while a long-running Nginx process may retain an old resolution when an upstream is resolved only at startup.

**Resolution**

- Added Docker's embedded DNS resolver, `127.0.0.11`, to Nginx.
- Used variable-backed `proxy_pass` targets such as `http://auth-service:3008` so names can be re-resolved.
- Added the Auth service route to the gateway.
- Restarted/recreated the affected gateway and service containers.
- Retested login through `http://localhost/api/auth/login` rather than bypassing the gateway.

**Status:** Fixed and verified through the browser.

## 8. Nginx Route Prefixes and SPA Routing Needed to Coexist

**Symptom**

API routes and frontend routes competed for the same public host. Deep frontend routes also needed to survive browser refreshes.

**Root cause**

The original gateway only described API upstreams and did not provide a complete production frontend path.

**Resolution**

- Added explicit `/api/<domain>` locations for all eight services.
- Added `location /` to proxy all remaining requests to the frontend container.
- Configured the frontend's internal Nginx with `try_files $uri /index.html` for React SPA fallbacks.
- Forwarded `Host`, `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto` headers.

**Status:** Fixed. Both `http://localhost` and a refreshed deep route were verified.

## 9. CORS Handling Was Fragmented

**Symptom**

Development and gateway access could produce inconsistent preflight behavior, especially when the frontend ran on a Vite port and called APIs on another origin.

**Root cause**

CORS behavior was duplicated or overly broad and was not centralized at the public gateway boundary.

**Resolution**

- Added `nginx/cors.conf` and included it in every API location.
- Allowed local frontend origins and the required HTTP methods and headers.
- Added a `204` response for `OPTIONS` requests.
- Configured Vite's development proxy so `/api` requests can still go through the gateway during local development.

**Status:** Fixed for the current local deployment model.

## 10. `localhost` Refused the Connection

**Symptom**

The browser displayed:

```text
This site can't be reached
localhost refused to connect
ERR_CONNECTION_REFUSED
```

Some application containers appeared to be running, which made the failure confusing.

**Root cause**

Running backend services did not guarantee that a process was accepting connections on host port `80`. The original Compose stack had no complete production frontend service, and the gateway could fail or remain unavailable while its dependencies and configuration were being corrected.

**Resolution**

- Added a multi-stage frontend Docker image.
- Served the built React application from an internal Nginx container.
- Added a frontend health check.
- Exposed only the public API gateway on host port `80` and proxied `/` to `frontend:80`.
- Made the gateway wait for the frontend health check and successful database setup.

**Status:** Fixed. `http://localhost` currently returns HTTP `200`.

## 11. Confusion Between Port `80` and Vite Port `5173`

**Symptom**

It was unclear whether the frontend should be opened at `http://localhost` or `http://localhost:5173`.

**Explanation**

Port `5173` is Vite's development server. The Docker Compose deployment builds static frontend files and serves them from the frontend container, while the public Nginx gateway exposes port `80`.

**Resolution**

- Production-like Compose use: `http://localhost`.
- Optional local frontend development: run Vite and use `http://localhost:5173`; its `/api` proxy still targets the gateway.

**Status:** Documentation corrected; this was a deployment-mode misunderstanding rather than a runtime defect.

## 12. Database Setup Container Kept Stopping

**Symptom**

Docker Desktop showed `pulsecore-db-setup` as stopped or exited, which looked like a failed service.

**Root cause**

`db-setup` is a one-shot initialization job, not a server. It pushes Prisma schemas and seeds data, then intentionally exits.

**Resolution**

- Configured `restart: "no"`.
- Made dependent services use `condition: service_completed_successfully`.
- Documented that `Exited (0)` means success.
- Verified its exit code and database state.

**Status:** Working as designed. Only a nonzero exit code indicates failure.

## 13. Database Initialization and Persistence Were Not Guaranteed

**Symptom**

Connecting to PostgreSQL alone did not prove that every service database, table, relation, or seed existed. It also did not prove data would survive a restart.

**Root cause**

The stack lacked a reliable, ordered initialization path for all service-owned schemas.

**Resolution**

- Added `docker/postgres/init-databases.sql` to create each service database on a fresh volume.
- Added `Dockerfile.migrate` and migration/seed scripts.
- Made PostgreSQL health a prerequisite for `db-setup`.
- Added the named `postgres_data` volume.
- Created data through the application, confirmed it in PostgreSQL, restarted services, and confirmed it remained visible.

**Status:** Fixed and persistence verified across service/container restarts.

## 14. Kafka Existed but Application Events Were Not Fully Wired

**Symptom**

Kafka was present in Compose, but simply running a broker did not prove that application code published or consumed anything.

**Root cause**

The initial project declared infrastructure before completing the application event flow.

**Resolution**

- Added a shared KafkaJS producer/consumer helper.
- Configured internal broker access as `kafka:29092` and host access as `localhost:9092`.
- Published `AppointmentCreated` to `hospital.events` after appointment creation.
- Added the Notification service consumer group `notification-service-group`.
- Persisted generated notifications.
- Upserted notifications by event ID to make repeated delivery idempotent.
- Verified topic offsets and zero consumer lag during testing.

**Status:** Fixed and verified for one event type. No other domain events are currently implemented.

## 15. Kafka Internal and Host Addresses Needed Different Listeners

**Symptom**

A broker address that worked from the host would not necessarily work inside Compose, and vice versa.

**Root cause**

`localhost` inside a container refers to that container, not the Kafka container. Kafka must also advertise an address appropriate to each client network.

**Resolution**

- Internal listener: `kafka:29092`.
- Host listener: `localhost:9092`.
- Controller listener: `kafka:29093`.
- Added matching listener and advertised-listener mappings for single-node KRaft mode.

**Status:** Fixed and verified from application containers.

## 16. OpenTelemetry Export Endpoint Was Invalid

**Symptom**

Jaeger displayed only its own `jaeger-all-in-one` traces. None of the Node.js application services appeared in Jaeger's service selector.

**Root cause**

The OTLP gRPC exporter was given an endpoint using an invalid `grpc://jaeger:4317` URL form. The exporter expected an HTTP-form endpoint even though transport occurs over OTLP gRPC.

**Resolution**

- Changed the exporter endpoint to `http://jaeger:4317`.
- Enabled Jaeger's OTLP receiver on ports `4317` and `4318`.
- Preloaded `packages/common/src/tracing.js` before each service starts.
- Assigned a distinct `SERVICE_NAME` to every service.
- Rebuilt and restarted the Node.js service images.

**Status:** Fixed. Jaeger currently lists all eight application services.

## 17. Grafana Started With No Dashboard

**Symptom**

Grafana login worked, but the home screen contained no useful application dashboard.

**Root cause**

Running Grafana and adding a data source does not automatically create dashboards. The dashboard provider, mounted JSON, stable data-source UID, and valid PromQL queries all needed to agree.

**Resolution**

- Added a file-based dashboard provider.
- Mounted `monitoring/grafana/dashboards` into Grafana.
- Added the `PulseCore Hospital Services` dashboard.
- Provisioned a Prometheus data source with UID `prometheus`.
- Added service health, request rate, p95 latency, HTTP status, and Node.js heap panels.

**Status:** Fixed and verified at Grafana UID `pulsecore-hospital-services`.

## 18. Grafana Queries Used a Label That Did Not Exist

**Symptom**

Dashboard panels could be empty even though Prometheus was successfully scraping the services.

**Root cause**

The metrics did not contain the expected `service` label. Prometheus identified each target through the `instance` label under the shared `hospital-services` job.

**Resolution**

- Grouped dashboard queries by `instance`.
- Used `job="hospital-services"` to select application metrics.
- Verified all eight scrape targets as `UP` through Prometheus.

**Status:** Fixed and verified.

## 19. Prometheus Initially Did Not Represent the Final Service Set

**Symptom**

The scrape configuration did not include the Auth service and referred to an OpenTelemetry Collector metrics target that was no longer part of the running architecture.

**Root cause**

The monitoring configuration described an earlier Compose design.

**Resolution**

- Consolidated application targets under `job_name: hospital-services`.
- Added all eight Node.js services, including Auth.
- Removed the nonexistent Collector scrape target.
- Added Prometheus's own target.

**Status:** Fixed. Nine targets, including Prometheus itself, were verified `UP`.

## 20. OpenTelemetry Collector Was Described but Not Used

**Symptom**

Configuration and documentation implied that traces flowed through an OpenTelemetry Collector, but the final Compose stack did not run that service.

**Root cause**

An older architecture file remained after the implementation switched to direct Jaeger export.

**Resolution**

- Treated the files and Compose runtime as the source of truth.
- Documented the actual flow as Node.js OpenTelemetry instrumentation directly to Jaeger's OTLP receiver.

**Status:** Documentation corrected. A Collector is not currently part of the runtime.

## 21. Loki Produced Errors and Application Logs Were Not Reliably Searchable

**Symptom**

Earlier service images produced Loki-related logging errors, including structured-metadata compatibility failures. More recently, the Loki container started but `/ready` returned `503` during a health check. Grafana Explore does not yet provide a reliable complete stream of application logs.

**Root cause**

The Winston Loki transport and Loki configuration were not yet a dependable production integration. Enabling an unreliable network log transport also risked making normal application logging noisy or fragile.

**Resolution**

- Kept Winston console logging as the dependable default.
- Made Loki transport opt-in through `ENABLE_LOKI_LOGGING=true`.
- Provisioned Loki as a Grafana data source without claiming that shipping is complete.
- Continued using Docker stdout/container logs for verified application logging.

**Status:** Partially resolved. Application logs work through Docker; centralized Loki shipping remains incomplete.

## 22. Redis Was Initially Running but Unused

**Symptom**

The stack and some documentation could imply that Redis provided caching or distributed locking.

**Root cause**

At that point in the build, Redis was provisioned as infrastructure, but no application service called it.

**Resolution**

- Audited application imports and configuration.
- Classified Redis as available but not wired.
- Avoided claiming that caching or locking had been implemented.

**Status:** Superseded by item 31. Redis is now wired for Doctors service read caching only.

## 23. Docker Build Exhausted the Windows System Drive

**Symptom**

The `C:` drive reached zero free space. Docker builds and engine operations began timing out or returning HTTP `500` errors. Docker Desktop became unresponsive.

**Root cause**

Docker build cache, repeated images, host `node_modules`, npm cache, and Gradle caches consumed the remaining disk capacity.

**Resolution**

- Stopped unnecessary build activity.
- Removed reinstallable host dependency directories and caches, including root/frontend `node_modules`, npm cache, and Gradle caches.
- Recovered several gigabytes of disk space.
- Avoided further Docker work during the Git-only task.
- Restarted Docker Desktop later; the engine and containers are currently responsive.

**Status:** Operationally recovered. Docker cache and disk usage still require ongoing monitoring.

## 24. Docker Was Used During a Git-Only Task

**Symptom**

Docker validation consumed resources while the immediate request was only to prepare and push Git commits.

**Root cause**

Repository validation was scoped too broadly after earlier application verification work.

**Resolution**

- Stopped Docker-specific work when challenged.
- Used repository checks such as `git status`, JSON parsing, and `docker compose config --quiet` without rebuilding the stack.
- Kept the commit task separate from runtime verification.

**Status:** Process corrected.

## 25. Ignore Files Could Exclude Required or Sensitive Content Incorrectly

**Symptom**

The repository risked committing local secrets and generated dependencies, while service Docker ignore rules could also exclude Prisma migration files required for deployment.

**Root cause**

The initial `.gitignore` and `.dockerignore` rules were incomplete and not aligned with the monorepo build contexts.

**Resolution**

- Expanded `.gitignore` for environment files, dependencies, logs, build output, coverage, caches, and editor files.
- Added root, frontend, and per-service Docker ignore files.
- Ensured Prisma migrations are not ignored from Docker build contexts.
- Added `.gitattributes` for consistent text handling.
- Verified that no `.env` file was tracked.

**Status:** Fixed and committed.

## 26. Documentation Did Not Match the Runtime

**Symptom**

Documentation described old databases, services, frontend startup modes, or integrations that did not match Compose and source files. One architecture document even stated there was no frontend container after the frontend container had been added.

**Root cause**

Documentation from earlier project phases remained after major implementation changes.

**Resolution**

- Rewrote architecture, API, frontend, and endpoint documentation from current files.
- Added Docker, Nginx, Kafka, OpenTelemetry, Prometheus, and Loki tutorials.
- Replaced the stale UI endpoint report with current verified behavior.
- Established the files and observed runtime as ground truth rather than older Git descriptions.

**Status:** Mostly fixed. Claims about Redis and Loki must continue to be kept conservative.

## 27. Git Reported Dubious Repository Ownership in the Sandbox

**Symptom**

During documentation work, Git returned:

```text
fatal: detected dubious ownership in repository
```

**Root cause**

The repository belongs to the Windows user, while inspection commands run under a restricted sandbox account.

**Resolution**

Used Git's per-command `-c safe.directory=<path>` option. No global Git configuration or repository ownership was changed.

**Status:** Tooling workaround verified. This does not affect normal Git use from the owner's terminal.

## 28. Kafka Services Started Before the Broker Was Ready

**Symptom**

Appointments were persisted, but the application notification never appeared. Service logs showed `ECONNREFUSED` for `kafka:29092`, followed by `The producer is disconnected`. The Notification service logged that it would start without event consumption.

**Root cause**

Compose treated Kafka's process starting as readiness. Kafka still needed time to initialize and unfence its KRaft broker. The Appointments producer and Notification consumer each attempted one connection during startup and permanently gave up after that attempt failed.

**Resolution**

- Added a Kafka health check using `kafka-topics`.
- Made Appointments and Notification wait for `service_healthy`.
- Made publishing connect the producer lazily when necessary.
- Added retry behavior for the Notification consumer's initial connection.
- Returned `notificationQueued` from appointment creation so the frontend does not claim an event was dispatched when publishing failed.

**Status:** Fixed and verified. A new appointment returned `notificationQueued: true`, Kafka logged the publish, and Notification logged receipt of the same appointment ID.

## 29. The Notification Bell Was Decorative and Staff Could Not See Events

**Symptom**

The header always displayed a red dot, but clicking the bell did nothing. The Dashboard could also show no notifications even though Kafka had produced and persisted them.

**Root cause**

The bell had no click handler or API integration. The notification API filtered only by the logged-in Auth user ID, while appointment notifications target the selected patient. An administrator viewing the staff dashboard therefore could not see the operational notification feed.

**Resolution**

- Added API-backed notification loading and 30-second refresh to the header.
- Added a dropdown with real unread count, empty/error states, timestamps, and mark-as-read controls.
- Allowed `ADMIN` and `STAFF` roles to view and manage the operational feed.
- Kept patient and doctor access scoped to notifications whose `userId` matches their JWT identity.
- Removed the hardcoded unread indicator.

**Status:** Fixed and browser-verified. The production UI displayed the newly generated appointment notification with no browser console errors.

## 30. Mixed Identifier Formats Prevented Reliable Cross-Service Data

**Symptom**

Schemas used UUID columns, but seeds and runtime paths mixed UUIDv4, ad hoc strings, and hardcoded identifiers. Rebuilding coherent demo data across isolated service databases was fragile, and database defaults did not enforce the requested UUID version.

**Root cause**

Prisma's generic `uuid()` default generates UUIDv4. Event and manual billing identifiers were also created independently in application code, while patient creation accepted an arbitrary Auth user ID in the UI.

**Resolution**

- Added a PostgreSQL 16-compatible `uuid_generate_v7()` function and installed it before every schema push.
- Converted all identifier columns to native UUID columns and all table ID defaults to database-generated UUIDv7.
- Added a shared Node UUIDv7 generator for Kafka event and manual billing source IDs.
- Rebuilt coherent, idempotent seeds around fixed UUIDv7 demo identities.
- Changed patient admission to register the Auth identity first and use the returned ID for the patient profile.
- Added an E2E UUIDv7 assertion suite and a SQL audit for every database.

**Status:** Fixed and verified. All 83 UUID columns and 21 table ID defaults passed the SQL audit after runtime writes. The gateway E2E workflow passed, and its patient, appointment, lab order, prescription, invoice, and notification remained available after restarting PostgreSQL and the application tier.

## 31. Redis Needed a Real Application Use Case

**Symptom**

Redis was running in Compose, but it did not participate in any user-facing workflow.

**Root cause**

The stack had provisioned Redis before the application had a concrete cache policy. Without a service-owned cache module, Redis would remain decorative infrastructure.

**Resolution**

- Added `packages/common/src/redis-client.js` as a lazy JSON cache adapter with fail-open behavior.
- Added `services/doctors/src/cache/doctorProfileCache.js` for doctor-specific cache keys and TTLs.
- Wired `GET /api/doctors` and `GET /api/doctors/:id` through cache-aside reads.
- Invalidated the doctor list cache and warmed profile aliases after doctor profile creation.
- Added cache operation metrics through `pulsecore_cache_operations_total`.
- Kept PostgreSQL as the source of truth and documented that Redis is not used for refresh tokens, locks, or other domains.

**Status:** Fixed and verified for Doctors service read caching. Redis is intentionally not a global application cache.

## Current Known Limitations

The following should not be presented as completed production capabilities:

- Loki application log shipping is not fully wired or verified.
- Redis is used only by the Doctors service for cache-aside read acceleration.
- Kafka is a single plaintext broker without durable volume configuration, retry topics, a dead-letter queue, or a transactional outbox.
- Kafka has no browser-based UI in the current Compose stack.
- The OpenTelemetry Collector config exists, but no Collector runs in Compose; services export directly to Jaeger.
- TLS/HTTPS is not configured.
- Local default credentials and secrets are suitable only for development.
- There are no alert rules, CI/CD pipeline, automated backups, restore drills, resource limits, or multi-instance load balancing.

## Final Verification Snapshot

At the latest check:

- `http://localhost` returned HTTP `200`.
- Grafana health returned HTTP `200`.
- Prometheus readiness returned HTTP `200`.
- Jaeger returned HTTP `200` and listed all eight application services.
- Prometheus reported all eight service scrape targets as `UP`.
- PostgreSQL was healthy.
- The frontend container was healthy.
- `db-setup` had correctly completed with exit code `0`.
- Loki was running and later returned ready, but centralized application log shipping remains opt-in and not a default verified path.

## Main Lessons

1. A running container does not prove that an integration is wired.
2. A database connection does not prove schema initialization or persistence.
3. Nginx must account for Docker DNS changes and path ownership.
4. Express route order matters when dynamic parameters are used.
5. Kafka needs a verified producer, topic, consumer group, side effect, and lag check.
6. Metrics, traces, and logs are separate signals with separate pipelines.
7. Provisioning Grafana does not automatically create a useful dashboard.
8. Documentation must follow observed runtime behavior, not intended architecture.
9. One-shot containers exiting successfully are different from failed long-running services.
10. Operational constraints such as disk space can become application blockers.
