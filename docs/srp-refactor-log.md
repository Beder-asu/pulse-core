# Single Responsibility Refactor Log

## Objective

Refactor every backend service so each module has one clear reason to change while preserving the application's externally observable behavior.

## Frozen Contracts

The refactor must not change:

- API paths, methods, status codes, response bodies, or route middleware order.
- Current authentication and authorization behavior, including known limitations.
- Prisma schemas, database data, transactions, seeds, or persistence behavior.
- Kafka topic `hospital.events`, consumer group names, event names, payloads, or failure policy.
- Environment variables, ports, Dockerfiles, Compose, Nginx, frontend behavior, logging, metrics, tracing, or health endpoints.
- Shared package behavior or external dependencies.

Security and product behavior corrections are explicitly separate work.

## Module Responsibilities

- Controllers translate HTTP requests and responses.
- Application services coordinate use cases and business decisions.
- Repositories own Prisma queries and transaction-aware persistence.
- Clients own outbound HTTP protocols.
- Publishers own event construction and publication.
- Consumers own Kafka connection and subscription.
- Handlers process one event type.
- Validators perform pure request-data validation.
- `server.js` configures Express and starts runtime processes.

## Service Checklist

| Service | Planned extraction | Status | Verification |
|---|---|---|---|
| Auth | user repository, password service, token service, registration service, authentication service | Complete | Syntax, image build, 2 service tests, live API cases, gateway E2E passed |
| Patients | patient repository, patient profile service | Complete | Syntax, image build, service test, live API, gateway E2E passed |
| Doctors | doctor repository, doctor profile service | Complete | Syntax, image build, service test, live API, gateway E2E passed |
| Lab | lab order repository, lab order service, validator | Complete | Syntax, image build, 2 service tests, live API/403, gateway E2E passed |
| Billing | invoice repository, invoice service, item validator | Complete | Syntax, image build, 2 service tests, live API/403, gateway E2E passed |
| Pharmacy | inventory/prescription repositories, prescription/dispensing services, validator | Complete | Syntax, image build, 3 tests, real rollback, gateway E2E passed |
| Appointments | appointment repository/service, patient/doctor clients, event publisher | Complete | Syntax, image build, 3 tests, live Kafka, zero lag, gateway E2E passed |
| Notification | repository/service, event handler/consumer, legacy repair service | Complete | Syntax, image build, 4 tests, duplicate-event idempotency, zero lag, gateway E2E passed |

## Baseline

Date: 2026-08-28

- Existing worktree is intentionally dirty with previously verified UUIDv7, notification, UI, and documentation changes. Those changes must be preserved.
- Eight Express services are exposed through the existing Nginx gateway.
- The existing gateway E2E script is the cross-service behavioral regression test.
- No backend unit-test framework or service-level characterization suite exists.
- Controllers currently instantiate Prisma directly and combine HTTP, business, and persistence responsibilities.
- Appointments additionally owns outbound HTTP and Kafka publication in its controller.
- Notification additionally owns Kafka startup, event dispatch, and maintenance repair in `server.js` and its controller.

## Verification Gates

After each service or service pair:

1. Run `node --check` for every changed JavaScript file.
2. Build the existing service image without changing its Dockerfile.
3. Verify the service health endpoint through Nginx.
4. Exercise relevant happy-path and failure-path API behavior.
5. Run the complete gateway E2E test.
6. Inspect service logs for unexpected runtime failures.
7. Confirm `docker compose config --quiet` and `git diff --check` remain clean.

Final verification additionally requires full image builds, database persistence after restart, Kafka notification persistence, and an SRP responsibility audit.

## Decisions

- Preserve existing controller export names so route modules remain unchanged.
- Use local factory functions with default production wiring; do not add a dependency-injection framework.
- Create only modules that own a real current responsibility.
- Keep Prisma clients local to repository modules.
- Preserve exact operation ordering, especially appointment persistence/publication and pharmacy transactions.
- Do not refactor `packages/common` as part of this effort.

## Journal

### 2026-08-28 - Baseline inventory

- Read the authoritative pasted SRP plan.
- Recorded the dirty worktree before edits.
- Inventoried all service controllers, routes, servers, and existing shared infrastructure.
- Added this implementation log before changing service code.
- Baseline runtime verification: passed. `docker compose ps --all` showed all long-running application and infrastructure containers up, the frontend and PostgreSQL healthy, and `db-setup` exited with code 0.
- Baseline gateway E2E: passed for patient `01a048a2-6575-7b90-b612-c2cf4656aafb`.

### 2026-08-28 - Auth refactor started

- Planned local modules: user repository, password service, token service, registration service, authentication service.
- Frozen controller exports: `register`, `login`.
- Frozen Auth behavior: validation order, bcrypt cost, role normalization, 30-day JWT, log messages, status codes, and response fields.

### 2026-08-28 - Auth refactor verified

- Extracted Prisma ownership into `userRepository`.
- Extracted bcrypt and JWT responsibilities into `passwordService` and `tokenService`.
- Extracted registration and login orchestration into separate application services.
- Reduced the controller to HTTP input/output translation and service-error forwarding.
- All changed files passed `node --check`; the unchanged Auth Dockerfile built successfully.
- Two injected-dependency service tests passed.
- Live health, missing login, invalid login, valid login, short-password registration, and duplicate registration status contracts passed.
- Full gateway E2E passed for patient `01a048a8-760f-7b49-8a4c-3fb05d9ce23b`.

### 2026-08-28 - Patients and Doctors refactor started

- Route modules and public/protected middleware placement remain frozen.
- Profile lookup semantics continue to accept either profile ID or Auth user ID.
- Existing validation messages, include graphs, ordering, logging, and response status codes remain frozen.

### 2026-08-28 - Patients and Doctors refactor verified

- Extracted Prisma ownership and profile orchestration into service-local repositories and application services.
- Controllers now perform only request identity/input mapping, service invocation, and HTTP response/error translation.
- All source files passed syntax checks; both unchanged Dockerfiles built successfully.
- Patient and doctor service characterization tests passed.
- Live API verified nine patient profiles, Amina's current/direct profile lookups, two doctors, and Omar's direct lookup.
- Full gateway E2E passed for patient `01a048af-d24b-71a6-a092-7616c93a2004`.

### 2026-08-28 - Lab and Billing refactor started

- Frozen Lab behavior includes status-before-priority default lookup, result-driven completion, query ordering, and patient-specific authorization.
- Frozen Billing behavior includes item validation order, UUIDv7 manual source IDs, totals, issued/paid timestamps, includes, and patient-specific authorization.

### 2026-08-28 - Lab test iteration

- Initial Lab service test run had one harness failure because a synchronous authorization exception was asserted with `assert.rejects`.
- The service intentionally performs that authorization check before returning a repository promise, matching the original controller.
- Corrected the characterization test to use `assert.throws`; no production behavior changed.

### 2026-08-28 - Lab and Billing refactor verified

- Extracted Prisma queries, validation, and application orchestration from both controllers.
- Preserved Lab default resolution and result-completion behavior in dedicated tests.
- Preserved Billing totals, item mapping, UUID source generation, patient access, and payment behavior in dedicated tests.
- All source passed syntax checks; unchanged service Dockerfiles built successfully.
- Four service tests passed after correcting the test-only assertion mismatch.
- Live API returned nine lab orders and nine invoices; cross-patient requests returned `403` for both services.
- Full gateway E2E passed for patient `01a048bc-1d40-7cdc-b6d8-ab69603a04af`.

### 2026-08-28 - Pharmacy refactor started

- The Prisma transaction remains owned by the prescription repository and passes its transaction client to inventory and prescription operations.
- Frozen behavior includes validation, default `PENDING` lookup, include graphs, stock decrement amount, insufficient-stock message, rollback semantics, status transitions, and logs.

### 2026-08-28 - Pharmacy refactor verified

- Extracted inventory and prescription persistence, query service, creation service, dispensing service, and pure validation.
- Preserved a single Prisma transaction client across every inventory decrement and final prescription update.
- All source passed syntax checks; the unchanged Pharmacy Dockerfile built successfully.
- Three service tests passed, including transaction-client identity and insufficient-stock short-circuit assertions.
- Initial live rollback script stopped before writes due to PowerShell JSON-array wrapping; the corrected script ran successfully.
- Real database rollback verified: dispense returned `500`, first inventory stock remained `118`, and prescription remained `PENDING`.
- Full gateway E2E passed for patient `01a048c4-76be-7455-86d6-745dac12de15`.

### 2026-08-28 - Appointments refactor started

- Frozen operation order: validate, resolve doctor, resolve patient, default status, check slot, persist, publish, respond.
- Frozen messaging contract: topic `hospital.events`, event `AppointmentCreated`, UUIDv7 `eventId`, and exact payload fields.
- Frozen optional Kafka behavior: appointment remains persisted with `notificationQueued: false` unless `KAFKA_REQUIRED=true`.

### 2026-08-28 - Appointments refactor verified

- Extracted validation, Prisma persistence, profile HTTP protocol, event publication, producer lifecycle, and application orchestration.
- Controller exports and route modules remained unchanged; `server.js` now delegates Kafka startup.
- All source passed syntax checks; the unchanged Appointments Dockerfile built successfully.
- Three service tests passed, including exact operation order and structural Kafka envelope equality.
- Live producer connected and the full gateway E2E persisted the resulting notification for patient `01a048cb-42f6-7afd-a47b-cdb96732ebd3`.
- Kafka reported `notification-service-group` on `hospital.events` with current offset 22, log end offset 22, and lag 0.

### 2026-08-28 - Notification refactor started

- Frozen behavior includes event filtering, event ID fallback, retry interval, upsert idempotency, role-scoped queries, read authorization, exact messages, and legacy-message repair.
- Kafka connection/subscription and retry move to a consumer module; event interpretation moves to a handler.

### 2026-08-28 - Notification refactor verified

- Extracted notification persistence, application orchestration, profile HTTP clients, appointment-event handling, Kafka subscription, legacy repair, and repair scheduling into focused modules.
- Controller exports and route modules remained unchanged; `server.js` now delegates consumer and maintenance startup.
- Corrected an import-time configuration capture found during review: appointments/notification profile clients and the notification retry delay now resolve environment values when used, preserving local `.env` behavior.
- Preserved the original no-op legacy repair behavior when patient or doctor service URLs are unconfigured.
- All source passed syntax checks; the unchanged Notification and Appointments Dockerfiles built successfully.
- Seven focused Appointments/Notification tests passed after the configuration-compatibility correction.
- Duplicate-event test published the same event twice; Kafka consumed both records, PostgreSQL contained exactly one notification for the event ID, and consumer lag was 0.
- The first database-count command failed only because PowerShell stripped quoted SQL identifiers; piping the same read-only query through stdin returned the expected count of 1. No application change resulted from the harness error.
- Full gateway E2E passed for patient `01a048db-e231-73ba-8a2b-eedf3e960444`.

### 2026-08-28 - Final audit started

- All eight service refactors are implemented and individually verified.
- Final gates: responsibility scan, complete test suite, full image build/recreate, health and gateway E2E, restart persistence, Compose validation, diff validation, and runtime log review.

### 2026-08-28 - Final audit complete

- Responsibility scan passed: service controllers and `server.js` files contain no Prisma operations; controllers contain no outbound HTTP or Kafka operations. Runtime `PrismaClient` construction is confined to repository modules, with separate seed-script instances remaining intentionally unchanged.
- All eight production service images built successfully from the existing Dockerfiles.
- All 18 characterization tests passed from the final images: Auth 2, Patients 1, Doctors 1, Appointments 3, Lab 2, Billing 2, Pharmacy 3, and Notification 4.
- Every JavaScript file under each service's `src` directory passed `node --check` inside its final production image. The initial host command could not run because Node is not installed on the host `PATH`; the container-based check uses the actual production runtime.
- All eight services were force-recreated together. The first gateway health request occurred while the host was saturated during startup and timed out; after startup completed, every direct health endpoint and every Nginx health endpoint returned `200`.
- Full pre-restart gateway E2E passed for Auth user `01a048e7-f84a-7162-a53e-d699855ccb56`.
- Before restart, PostgreSQL contained its patient profile plus one appointment, lab order, prescription, invoice, and notification. The first patient-table query used the incorrect table name `Patient`; the corrected schema-grounded query used `PatientProfile` and its `userId` field.
- Restarted PostgreSQL, Nginx, and all eight services. PostgreSQL remained healthy, all services returned, and all six domain records still had count 1.
- Fresh admin login through Nginx retrieved the same persisted profile and at least one matching appointment, lab order, prescription, invoice, and notification.
- Full post-restart gateway E2E passed for Auth user `01a048eb-aff7-7205-84cd-4a3f379d3f11`.
- Kafka consumer group `notification-service-group` finished at current offset 28, log-end offset 28, lag 0.
- Runtime error review found only intentional E2E validation/duplicate-slot responses and transient Kafka connection timeouts during simultaneous restart; Kafka producer and consumer both recovered.
- `docker compose config --quiet` and `git diff --check` passed. Route files have no changes. Existing dirty frontend, Compose, schema, seed, shared-package, script, and documentation work predates this refactor and was preserved.

## Final Result

- [x] Every backend service has focused HTTP, application, persistence, validation, and integration boundaries appropriate to its current behavior.
- [x] API routes, route middleware, response contracts, schemas, Kafka contracts, Nginx, Compose, frontend, and shared package behavior were not changed by the SRP refactor.
- [x] Builds, syntax checks, characterization tests, health checks, gateway workflows, Kafka idempotency/lag, and restart persistence are verified.
- [x] Dependency audit is clean. The follow-up OpenTelemetry upgrade removed all 42 findings from every production service image.

### 2026-08-29 - Dependency security follow-up verified

- Confirmed the former 38 moderate and 4 high findings were all rooted in the legacy OpenTelemetry `0.51.x`/`1.x` dependency family embedded in every service image.
- Upgraded the coherent telemetry stack to API `1.9.1`, SDK/exporter `0.221.0`, resources `2.10.0`, auto-instrumentations `0.79.0`, and semantic conventions `1.43.0`.
- Migrated the OpenTelemetry 2.x resource API from `new Resource(...)` to `resourceFromAttributes(...)` in the shared tracing bootstrap.
- Regenerated the complete workspace lockfile. npm audited 404 packages with 0 vulnerabilities.
- Rebuilt all eight production service images and audited each installed image independently: 0 info, 0 low, 0 moderate, 0 high, and 0 critical findings in every image.
- Verified the installed OpenTelemetry graph has coherent peer dependencies: API `1.9.1`, core/resources `2.10.0`, and experimental SDK/exporter packages `0.221.0`.
- All 18 service characterization tests passed, every Nginx health route returned `200`, and the full gateway E2E passed for Auth user `01a04abd-178a-7472-bcd7-97ef088da946`.
- Jaeger reported fresh traces for all eight application service names after the upgrade. Kafka consumer lag returned to 0.
- Restarted PostgreSQL, Nginx, and all eight services. The E2E profile, appointment, lab order, prescription, invoice, and notification remained available after restart.
- Package installation still emits upstream deprecation notices for packages such as `prom-client`; these are not npm security findings and require a separate compatibility migration if the project chooses to replace those APIs.

### 2026-08-29 - Authorization and session iteration verified

- Added service-local role and ownership policies that produce Prisma query scopes for patients, appointments, lab orders, prescriptions, and operational billing access.
- Added 15-minute typed access JWTs and 30-day rotating opaque refresh tokens. Refresh hashes persist in `auth_db`; replay revokes the active token family, and logout is idempotent.
- Hardened internal service authentication with a separate shared secret and Nginx header clearing. A forged public internal-call request was rejected.
- Split the shared Kafka singleton into lazy publisher and consumer adapters. Removed the inactive historical `unknown-service-group`; the notification consumer finished at offset 31 with lag 0 after a new end-to-end appointment event.
- Added frontend route guards, role-filtered navigation and actions, a patient `My History` entry, automatic one-time access-token refresh, and credentialed logout.
- All 22 service tests and 5 standalone policy tests passed. The live security gateway suite passed role scopes, internal-call defense, refresh rotation, replay revocation, and logout.
- PostgreSQL and Auth were restarted between login and refresh; the persisted session refreshed successfully afterward. The live storage assertion found 14 stored rows, all with 64-character SHA-256 digests.
- The frontend production build passed and Oxlint reported 0 warnings and 0 errors. Browser automation was unavailable, so interactive visual verification remains a manual smoke-test item.
- Compose validation, dependency audit, and `git diff --check` passed. All eight APIs and the frontend returned `200`; Prometheus targets were up and Jaeger listed all eight application services.

### 2026-08-29 - Browser follow-up hardening

- Follow-up testing verified cross-doctor and cross-patient isolation, staff lab/pharmacy operations, refresh revocation, notification names, and Kafka recovery.
- Fixed malformed structured UUID filters reaching Prisma in Appointments, Lab, Pharmacy, and Billing. Accepted query filters are now scalar UUIDv7 values or absent; invalid input returns `400`.
- Unsupported lab input such as `priority: "INVALID"` is now rejected with `400` instead of being silently ignored in favor of ROUTINE. Priority overrides use `priorityId`.
- Unexpected `5xx` responses now expose only `Internal server error`; full ORM details remain in structured service logs. Expected `4xx` messages remain actionable.
- The report's missing single-lab-order `GET` is not an application regression because no detail endpoint is part of the documented API or frontend flow. Generic login failures remain intentional to avoid account enumeration.
