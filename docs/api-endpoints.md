# Active API Endpoints

These endpoints are implemented by the current Express services and exposed through Nginx at `http://localhost/api`.

All protected endpoints require `Authorization: Bearer <access-jwt>`. Login also sets the rotating refresh token as an HttpOnly cookie; browser clients must send credentials on refresh and logout requests. Role and ownership behavior is defined in `security-access.md`.

Seeded local demo accounts:
- `admin@hospital.com`
- `doctor@hospital.com`
- `salma.doctor@hospital.com`
- `staff@hospital.com`
- `patient@hospital.com`
- `mariam.patient@hospital.com`
- `youssef.patient@hospital.com`

The local demo password is intentionally kept in the seed file rather than repeated in portfolio documentation. Change seeded credentials before any shared or hosted deployment.

All persisted IDs and cross-service identifier fields are UUIDv7 strings. Clients should treat IDs as opaque strings and must not derive timestamps or ordering guarantees from them.

Optional `patientId` and `doctorId` query filters must be scalar UUIDv7 strings. Structured query objects and malformed identifiers are rejected with `400` before reaching Prisma.

## Auth (`/api/auth`)

- `POST /register`: Provision a `PATIENT` account. Requires `STAFF` or `ADMIN`; any caller-supplied role is ignored. Body: `{ "email": "string", "password": "string" }`.
- `POST /login`: Authenticate, set a rotating refresh cookie, and return `{ id, email, role, token }`, where `token` is a 15-minute access JWT.
- `POST /refresh`: Rotate the refresh cookie and return a new `{ id, email, role, token }` session payload.
- `POST /logout`: Revoke the current refresh token and clear its cookie. This operation is idempotent.
- `POST /logout-all`: Revoke every refresh session for the authenticated user. Requires an access JWT.
- `GET /health`: Service health check.

## Patients (`/api/patients`)

- `GET /`: List all profiles for clinical/operational roles; patients receive only their own profile.
- `POST /profile`: Create a profile for the authenticated patient or provision one as staff/admin.
- `GET /profile`: Fetch the authenticated patient's profile.
- `GET /:id`: Fetch by profile id or patient user id, subject to patient self-ownership.
- `GET /health`: Service health check.

## Doctors (`/api/doctors`)

- `GET /`: List doctor profiles with department and specialization.
- `GET /:id`: Fetch by profile id or doctor user id.
- `POST /profile`: Create a doctor profile.
- `GET /health`: Service health check.

## Appointments (`/api/appointments`)

- `GET /`: List appointments, optionally filtered by `patientId` or `doctorId`. Patient and doctor ownership scopes override wider query parameters.
- `GET /my`: List appointments for the authenticated user id.
- `GET /doctor/:doctorId`: List appointments for a doctor.
- `POST /`: Book an appointment. `patientId` and `doctorId` are UUIDv7 Auth user IDs. Body: `{ "patientId": "01991f5e-7c00-7001-8000-000000000001", "doctorId": "01991f5e-7c00-7101-9000-000000000001", "date": "YYYY-MM-DD", "timeSlot": "09:00 AM", "reasonForVisit": "string" }`.
- `GET /health`: Service health check.

## Lab (`/api/lab`)

- `GET /orders`: List lab orders. Patients receive their own orders, doctors their authored orders, and staff/admin all permitted orders.
- `POST /orders`: Create a lab order. Requires `DOCTOR` or `ADMIN`.
- Lab order creation accepts `priorityId` when overriding the default ROUTINE priority. A `priority` name field is not part of the API and is rejected rather than silently ignored.
- `GET /orders/patient/:patientId`: List lab orders for a patient.
- `PUT /orders/:id/result`: Add or update a lab result. Requires `STAFF` or `ADMIN`.
- `GET /health`: Service health check.

## Pharmacy (`/api/pharmacy`)

- `GET /inventory`: List inventory. Requires `DOCTOR`, `STAFF`, or `ADMIN`.
- `GET /prescriptions`: Doctors receive only prescriptions they authored; staff/admin may optionally filter by `patientId`.
- `POST /prescriptions`: Create a prescription. Requires `DOCTOR` or `ADMIN`.
- `PUT /prescriptions/:id/dispense`: Mark a prescription dispensed and decrement inventory. Requires `STAFF` or `ADMIN`.
- `GET /health`: Service health check.

## Billing (`/api/billing`)

- All billing endpoints require `STAFF` or `ADMIN`.
- `GET /invoices`: List invoices, optionally filtered by `patientId`.
- `GET /invoices/patient/:patientId`: List invoices for a patient.
- `POST /invoices`: Create an issued invoice with line items.
- `PUT /invoices/:id/pay`: Mark an invoice paid.
- `GET /health`: Service health check.

## Notifications (`/api/notifications`)

- `GET /`: List notifications for the authenticated user.
- `PUT /:id/read`: Mark one notification as read.
- `GET /health`: Service health check.
