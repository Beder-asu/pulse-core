# Active API Endpoints

These endpoints are implemented by the current Express services and exposed through Nginx at `http://localhost/api`.

All protected endpoints require `Authorization: Bearer <jwt>`. Use `POST /api/auth/login` with one of the seeded users after `npm run db:setup` or the Docker `db-setup` job has run.

Seeded local credentials:
- `admin@hospital.com` / `replace-with-local-demo-password`
- `doctor@hospital.com` / `replace-with-local-demo-password`
- `staff@hospital.com` / `replace-with-local-demo-password`
- `patient@hospital.com` / `replace-with-local-demo-password`

## Auth (`/api/auth`)

- `POST /register`: Create a user. Body: `{ "email": "string", "password": "string", "role": "PATIENT|DOCTOR|STAFF|ADMIN" }`.
- `POST /login`: Authenticate and return `{ id, email, role, token }`.
- `GET /health`: Service health check.

## Patients (`/api/patients`)

- `GET /`: List patient profiles.
- `POST /profile`: Create a patient profile.
- `GET /profile`: Fetch the current user's profile.
- `GET /:id`: Fetch by profile id or patient user id.
- `GET /health`: Service health check.

## Doctors (`/api/doctors`)

- `GET /`: List doctor profiles with department and specialization.
- `GET /:id`: Fetch by profile id or doctor user id.
- `POST /profile`: Create a doctor profile.
- `GET /health`: Service health check.

## Appointments (`/api/appointments`)

- `GET /`: List appointments, optionally filtered by `patientId` or `doctorId`.
- `GET /my`: List appointments for the authenticated user id.
- `GET /doctor/:doctorId`: List appointments for a doctor.
- `POST /`: Book an appointment. Body: `{ "patientId": "PAT-123", "doctorId": "DOC-123", "date": "YYYY-MM-DD", "timeSlot": "09:00 AM", "reasonForVisit": "string" }`.
- `GET /health`: Service health check.

## Lab (`/api/lab`)

- `GET /orders`: List lab orders, optionally filtered by `patientId`.
- `POST /orders`: Create a lab order. Requires `DOCTOR` or `ADMIN`.
- `GET /orders/patient/:patientId`: List lab orders for a patient.
- `PUT /orders/:id/result`: Add or update a lab result. Requires `STAFF` or `ADMIN`.
- `GET /health`: Service health check.

## Pharmacy (`/api/pharmacy`)

- `GET /inventory`: List inventory.
- `GET /prescriptions`: List prescriptions, optionally filtered by `patientId`.
- `POST /prescriptions`: Create a prescription. Requires `DOCTOR` or `ADMIN`.
- `PUT /prescriptions/:id/dispense`: Mark a prescription dispensed and decrement inventory. Requires `STAFF` or `ADMIN`.
- `GET /health`: Service health check.

## Billing (`/api/billing`)

- `GET /invoices`: List invoices, optionally filtered by `patientId`.
- `GET /invoices/patient/:patientId`: List invoices for a patient.
- `POST /invoices`: Create an issued invoice with line items.
- `PUT /invoices/:id/pay`: Mark an invoice paid.
- `GET /health`: Service health check.

## Notifications (`/api/notifications`)

- `GET /`: List notifications for the authenticated user.
- `PUT /:id/read`: Mark one notification as read.
- `GET /health`: Service health check.
