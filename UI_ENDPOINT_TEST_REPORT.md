# PulseCore Verification Report

## Scope

This report reflects the current file-based implementation and the local Docker verification completed on 2026-08-25. It replaces the earlier prototype report that described dummy authentication, mock pages, and a temporary Vite preview container.

## Verified working

- The production React frontend is served through Nginx at `http://localhost`.
- SPA deep links such as `/dashboard` return the frontend entry point.
- `POST /api/auth/login` validates seeded credentials and returns a JWT.
- All eight service health endpoints return HTTP 200 through the gateway.
- Patients, appointments, lab orders, prescriptions, invoices, and notifications use backend APIs and PostgreSQL persistence.
- The tested E2E workflow created a patient profile, appointment, lab result, dispensed prescription, and paid invoice through Nginx.
- The E2E patient and related records remained available after application-service and PostgreSQL restarts.
- Kafka contains the `hospital.events` topic; Appointments publishes `AppointmentCreated`, and Notification consumes it with zero observed consumer lag.
- Prometheus scrapes all eight Node.js services.
- Grafana provisions the `PulseCore Hospital Services` dashboard and healthy Prometheus/Loki data sources.
- Jaeger receives traces from all eight application services.
- The frontend production build and lint completed without frontend errors.

## Primary routes

| UI route | Backing API workflow |
|---|---|
| `/login` | Auth login and JWT persistence |
| `/` | Appointments, notifications, and pharmacy summary |
| `/patients` | Patient listing and profile creation |
| `/appointments` | Appointment listing |
| `/appointments/book` | Doctor lookup and appointment creation |
| `/lab` | Lab order listing, creation, and results |
| `/pharmacy` | Inventory, prescription creation, and dispensing |
| `/billing` | Invoice creation, listing, and payment |
| `/patients/:id/history` | Patient-specific clinical records |

## Persistence evidence

The persistence test created patient `PAT-E2E-20260825081159`, restarted the application services, restarted PostgreSQL, and queried the records again through the gateway. The patient retained one appointment, one lab order, one prescription, and one invoice.

## Known limitations

- Kafka is a single plaintext broker without a persistent volume, replication, explicit topic provisioning, a dead-letter topic, or a transactional outbox.
- Kafka failure is non-fatal by default, so appointment persistence and notification publication are not atomic.
- Loki application shipping is disabled unless `ENABLE_LOKI_LOGGING=true`; container stdout remains available through Docker logs.
- Local Compose uses documented development credentials and should receive external secrets before deployment.
- The local gateway serves HTTP only; TLS termination is not configured.
- Docker dependency installation reports backend dependency vulnerabilities that require a controlled upgrade rather than a forced audit rewrite.
- A connected browser automation surface was unavailable for the final visual screenshot pass; API, build, container, and user-led browser checks were completed.

## Useful URLs

- Application: `http://localhost`
- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Jaeger: `http://localhost:16686`
- Loki readiness: `http://localhost:3100/ready`
