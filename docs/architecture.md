# Architecture Overview

## Current System

PulseCore is a React plus Express microservices hospital management system. The current codebase uses an Nginx REST gateway, eight Node/Express services, PostgreSQL databases managed by Prisma, Kafka for appointment notification events, and optional observability services.

## Technology Stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS, Axios, Lucide icons.
- **Gateway:** Nginx reverse proxy under `/api/*`.
- **Services:** Node.js/Express workspaces.
- **Shared Package:** `@pulsecore/common` for auth middleware, error handling, metrics, logging, and Kafka helpers.
- **Database:** PostgreSQL 16. Each service uses its own database: `auth_db`, `patients_db`, `doctors_db`, `appointments_db`, `lab_db`, `pharmacy_db`, `billing_db`, and `notification_db`.
- **ORM:** Prisma per service.
- **Messaging:** Kafka topic `hospital.events` for appointment-created notifications.
- **Observability:** Prometheus metrics middleware, Jaeger tracing preload in Docker, Loki logging when enabled, and Grafana provisioning.

## Services

1. **Auth Service** (`3008`): Registration, login, bcrypt password hashing, JWT issuance.
2. **Patients Service** (`3001`): Patient profile CRUD surface used by the frontend.
3. **Doctors Service** (`3002`): Doctor profiles, departments, and specializations.
4. **Appointments Service** (`3003`): Appointment booking and listing. It can verify doctor existence through the doctors service when `DOCTORS_SERVICE_URL` is configured, then publishes `AppointmentCreated`.
5. **Lab Service** (`3004`): Lab order creation, listing, and result updates.
6. **Pharmacy Service** (`3005`): Inventory, prescriptions, and dispensing with a Prisma transaction for inventory decrement.
7. **Billing Service** (`3006`): Manual invoice creation, listing, and payment.
8. **Notification Service** (`3007`): User notifications and Kafka-backed appointment notification persistence.

## Startup And Data Initialization

Fresh Docker Postgres volumes are initialized by `docker/postgres/init-databases.sql`. The `db-setup` Compose job runs Prisma `db push` and seeds all service databases before app services start.

For local development with an already running Postgres on port `5434`:

```bash
npm run db:setup
```

Seeded demo users are documented in `docs/api-endpoints.md`.

## Current Constraints

- There is no frontend container in `docker-compose.yml`; run the Vite frontend separately.
- Redis exists in Compose, but appointment double-booking prevention currently uses a database lookup rather than a Redis lock.
- Billing does not yet consume Kafka events to auto-generate invoices; invoices are created through the billing API/UI.
- Lab and notification live updates are polling/manual refresh flows in the current frontend, not SSE.
