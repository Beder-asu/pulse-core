# Portfolio Demo Guide

This guide is the presentation-ready story of the current PulseCore implementation. It describes what is implemented in the files and what has been verified in the local Docker Compose stack.

## One-Minute Project Summary

PulseCore is a hospital operations app with admissions, patient profiles, appointment booking, lab orders, prescriptions, pharmacy dispensing, billing, and in-app notifications. The frontend is a React SPA served behind an Nginx gateway. The backend is split into eight Express microservices, each owning its own PostgreSQL database through Prisma.

The infrastructure story is the main learning outcome: Docker Compose starts the whole stack, Nginx acts as the public entry point, JWTs and refresh cookies secure user sessions, Kafka decouples appointment creation from notifications, Redis accelerates doctor reads, and Prometheus plus Jaeger make the system observable.

## Demo URLs

| Area | URL | Login |
|---|---|---|
| PulseCore app | `http://localhost` | See demo accounts below |
| Grafana | `http://localhost:3000` | Local Compose credentials |
| Prometheus | `http://localhost:9090` | none |
| Jaeger | `http://localhost:16686` | none |
| Loki API | `http://localhost:3100` | none |
| PostgreSQL from host | `localhost:5434` | Local Compose credentials |
| Redis from host | `localhost:6379` | none |

## Demo Accounts

The seeded demo accounts share the local demo password configured in `services/auth/prisma/seed.js`. Change that value before any shared or hosted deployment.

| Role | Email |
|---|---|
| Admin | `admin@hospital.com` |
| Staff | `staff@hospital.com` |
| Doctor | `doctor@hospital.com` |
| Doctor | `salma.doctor@hospital.com` |
| Patient | `patient@hospital.com` |
| Patient | `mariam.patient@hospital.com` |
| Patient | `youssef.patient@hospital.com` |

## Architecture Story

Start with the business need: a hospital system has separate operational concerns, and not every team or service should own the same data. PulseCore therefore separates Auth, Patients, Doctors, Appointments, Lab, Pharmacy, Billing, and Notifications.

The browser talks only to Nginx. Nginx routes `/api/auth/*`, `/api/patients/*`, `/api/doctors/*`, `/api/appointments/*`, `/api/lab/*`, `/api/pharmacy/*`, `/api/billing/*`, and `/api/notifications/*` to the correct service. Everything else serves the React app.

Each service connects only to its own database:

```text
auth-service          -> auth_db
patients-service      -> patients_db
doctors-service       -> doctors_db
appointments-service  -> appointments_db
lab-service           -> lab_db
pharmacy-service      -> pharmacy_db
billing-service       -> billing_db
notification-service  -> notification_db
```

For local development those databases live in one PostgreSQL container. The ownership boundary still exists because every service has its own connection string, Prisma schema, seed file, and repository layer.

## Recommended Live Demo Path

1. Open `http://localhost` and sign in as `admin@hospital.com`.
2. Show role-aware navigation and operational dashboard data.
3. Create a patient admission as admin or staff.
4. Book an appointment for that patient with a doctor.
5. Open Notifications and show the appointment notification created from Kafka.
6. Visit Jaeger and open recent traces for `appointments-service`, `notification-service`, and `doctors-service`.
7. Visit Prometheus targets and Grafana dashboard to show metrics.
8. Show Redis cache keys or cache metrics after loading the doctor directory.
9. In pgAdmin or psql, show separate service databases and persisted rows.

## Kafka Flow

```text
Appointment created through UI
  -> Nginx
  -> appointments-service
  -> appointments_db write
  -> AppointmentCreated event on hospital.events
  -> notification-service consumer group
  -> notification_db upsert by event ID
  -> UI notification feed
```

Kafka is currently used for one implemented event type: `AppointmentCreated`. Appointment persistence and Kafka publish are not atomic yet; a transactional outbox would be the next production hardening step.

## Redis Flow

```text
GET /api/doctors
  -> doctors-service
  -> Redis GET doctors:profiles:v1:all
  -> on miss: doctors_db query
  -> Redis SET doctors:profiles:v1:all with TTL
  -> response to UI
```

Redis is only used by the Doctors service. It is not used for auth sessions, appointment locks, Kafka replacement, or patient/pharmacy/billing caching. Cache failures fail open: the request continues through PostgreSQL.

## Auth Flow

```text
Login
  -> Auth verifies bcrypt password
  -> Auth returns 15-minute access JWT
  -> Auth sets 30-day HttpOnly refresh cookie
  -> Frontend sends access JWT on protected requests
  -> Services verify JWT on every protected request
  -> Refresh endpoint rotates the refresh cookie and issues a new access JWT
```

Refresh tokens are stored only as SHA-256 hashes in `auth_db`; the raw refresh token is only held by the browser cookie.

## Observability Flow

```text
Node services
  -> /metrics scraped by Prometheus
  -> traces exported directly to Jaeger over OTLP gRPC
  -> console logs verified through Docker logs
  -> Loki data source provisioned in Grafana, app shipping opt-in
```

The OpenTelemetry Collector config file exists for future expansion, but the current Compose runtime sends traces directly from services to Jaeger.

## Honest Limitations

- Kafka is a single local broker in KRaft mode with no dead-letter queue or transactional outbox.
- The appointment double-booking check is service-level; a database unique constraint is the stronger production guarantee.
- Loki is provisioned, but centralized application log shipping is opt-in and should not be claimed as fully verified by default.
- TLS/HTTPS, secret management, CI/CD, backups, alert rules, and multi-instance scaling are not implemented in this local stack.
- Redis caches only doctor reads.

## Portfolio Positioning

The strongest way to present PulseCore is as a learning-focused infrastructure project: each added tool solved a real problem encountered while wiring the app end to end. Docker solved multi-service startup, Nginx solved a single public entry point, Kafka solved asynchronous notification work, JWT refresh cookies solved practical sessions, Redis solved repeat doctor reads, and observability solved the question "what happened inside the system?"
