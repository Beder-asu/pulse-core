# Architecture Overview

## Current System

PulseCore is a React plus Express microservices hospital management system. The current codebase uses an Nginx REST gateway, eight Node/Express services, PostgreSQL databases managed by Prisma, Kafka for appointment notification events, and optional observability services.

## Technology Stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS, Axios, Lucide icons.
- **Gateway:** Nginx reverse proxy under `/api/*`.
- **Services:** Node.js/Express workspaces.
- **Shared Package:** `@pulsecore/common` for auth middleware, error handling, metrics, logging, and Kafka helpers.
- **Database:** PostgreSQL 16. Each service uses its own database: `auth_db`, `patients_db`, `doctors_db`, `appointments_db`, `lab_db`, `pharmacy_db`, `billing_db`, and `notification_db`. Persisted identifiers are native UUID columns and table IDs have database-generated UUIDv7 defaults.
- **ORM:** Prisma per service.
- **Messaging:** Kafka topic `hospital.events` for appointment-created notifications. The common package exposes separate lazy publisher and consumer adapters, so producer-only services do not create consumer groups. Events carry durable UUID references plus patient- and doctor-name snapshots for user-facing operational notification text.
- **Caching:** Redis provides an optional cache-aside layer for the doctor directory and individual doctor profiles. PostgreSQL remains authoritative; cache failures fall back to repository reads, and profile creation invalidates the list cache and warms profile aliases.
- **Observability:** Prometheus metrics middleware, Jaeger tracing preload in Docker, Loki logging when enabled, and Grafana provisioning. Services export traces directly to Jaeger; the OpenTelemetry Collector config is present for future use but is not part of the current Compose runtime.

## Services

1. **Auth Service** (`3008`): Protected patient provisioning, login, bcrypt password hashing, short-lived access JWT issuance, and persisted rotating refresh sessions.
2. **Patients Service** (`3001`): Patient profile CRUD surface used by the frontend.
3. **Doctors Service** (`3002`): Doctor profiles, departments, and specializations.
4. **Appointments Service** (`3003`): Appointment booking and listing. It can verify doctor existence through the doctors service when `DOCTORS_SERVICE_URL` is configured, then publishes `AppointmentCreated`.
5. **Lab Service** (`3004`): Lab order creation, listing, and result updates.
6. **Pharmacy Service** (`3005`): Inventory, prescriptions, and dispensing with a Prisma transaction for inventory decrement.
7. **Billing Service** (`3006`): Manual invoice creation, listing, and payment.
8. **Notification Service** (`3007`): User notifications and Kafka-backed appointment notification persistence.

## Application Boundaries And Authorization

Each service follows the same request path: Express route and middleware, HTTP controller, use-case service, role/ownership policy, then Prisma repository. Controllers do not query Prisma or publish Kafka events directly. External dependencies are injected into services so policy, repository, publisher, clock, and client implementations can be replaced in focused tests.

Nginx strips caller-supplied internal-service headers. Direct service clients authenticate internal calls with `INTERNAL_SERVICE_SECRET`; normal requests carry access JWTs that are verified independently by every protected service. Policy modules translate the authenticated identity into Prisma `where` clauses so unauthorized records are not fetched and filtered in memory. See `security-access.md` for the complete matrix and the reason this deployment uses service-layer row scoping instead of PostgreSQL RLS session identities.

## Startup And Data Initialization

Fresh Docker Postgres volumes are initialized by `docker/postgres/init-databases.sql`. The `db-setup` Compose job installs `scripts/uuidv7.sql`, runs Prisma `db push`, and seeds all service databases before app services start. Database defaults generate UUIDv7 IDs for new rows; the shared Node generator is used for identifiers created before persistence, including Kafka event IDs.

For local development with an already running Postgres on port `5434`:

```bash
npm run db:setup
```

Seeded demo users are documented in `docs/api-endpoints.md`. Fixed UUIDv7 constants in `packages/common/src/demo-data.js` connect coherent demo records across service-owned databases without introducing cross-database foreign keys.

## Current Constraints

- Compose builds the frontend into an Nginx container and exposes it through the API gateway at `http://localhost`. Vite on port `5173` is an optional local development mode.
- Redis currently caches only doctor directory/profile reads. It is not used as a database, refresh-token store, authorization cache, Kafka replacement, or appointment lock; double-booking prevention still uses a database lookup.
- Billing does not yet consume Kafka events to auto-generate invoices; invoices are created through the billing API/UI.
- Lab and notification live updates are polling/manual refresh flows in the current frontend, not SSE.
- Appointment double-booking prevention is currently service-level. A database uniqueness constraint on doctor/time slots would be the stronger production guarantee under simultaneous requests.
