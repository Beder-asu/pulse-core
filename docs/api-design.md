# API Design

## Gateway

The current gateway is Nginx. It routes browser requests from `/api/*` to the matching Express service:

- `/api/auth/*` -> Auth Service (`3008`)
- `/api/patients/*` -> Patients Service (`3001`)
- `/api/doctors/*` -> Doctors Service (`3002`)
- `/api/appointments/*` -> Appointments Service (`3003`)
- `/api/lab/*` -> Lab Service (`3004`)
- `/api/pharmacy/*` -> Pharmacy Service (`3005`)
- `/api/billing/*` -> Billing Service (`3006`)
- `/api/notifications/*` -> Notification Service (`3007`)

CORS handling is centralized in `nginx/cors.conf`.

## Authentication

The Auth service owns registration and login. It hashes passwords with bcrypt and returns JWTs signed with `JWT_SECRET`.

Protected services use `@pulsecore/common` middleware to:

1. Read `Authorization: Bearer <token>`.
2. Verify the JWT using `JWT_SECRET`.
3. Normalize `req.user.role` to uppercase.
4. Enforce route-level role checks where needed.

The dummy development token is disabled by default and only works when `ENABLE_DEV_AUTH_BYPASS=true`.

## Persistence

Each service owns a separate PostgreSQL database and Prisma schema. The root `npm run db:setup` command runs `prisma db push` and service seeds for all databases. Docker Compose runs the same setup through the `db-setup` job.

## Service Communication

Appointments can synchronously verify doctor existence by calling the doctors service when `DOCTORS_SERVICE_URL` is configured.

Kafka topic `hospital.events` currently carries `AppointmentCreated` events. The notification service consumes those events and persists in-app notifications. Other billing/lab/pharmacy event consumers are not implemented in the current code.

## Error Shape

Services use the shared Express error handler. Error responses return a JSON body with `message` and, outside production, `stack`.
