# API Design

## Gateway (Nginx)
All incoming client requests hit the Nginx API Gateway on port `80`. Nginx handles CORS centrally and routes requests based on the URL prefix to the appropriate microservice.
- `/api/patients/*` -> Patients Service (Port 3001)
- `/api/doctors/*` -> Doctors Service (Port 3002)
- `/api/appointments/*` -> Appointments Service (Port 3003)
- `/api/lab/*` -> Lab Service (Port 3004)
- `/api/pharmacy/*` -> Pharmacy Service (Port 3005)
- `/api/billing/*` -> Billing Service (Port 3006)
- `/api/notifications/*` -> Notification Service (Port 3007)

## Authentication Strategy
The system uses a decentralized JWT strategy.
1. A user logs in via the Patients Service (`POST /api/patients/auth/login`).
2. The service generates a JWT signed with a highly secure shared secret.
3. The client passes this JWT in the `Authorization: Bearer <token>` header for all subsequent requests.
4. Each microservice independently verifies the JWT signature using the shared secret and checks the role (`req.user.role`).
5. Internal service-to-service calls bypass JWT checking via a special `x-internal-call` header, secured by network isolation.

## Asynchronous Communication (Kafka Topics)
To decouple services, the system relies on Kafka for domain events.
- `patient.created`: Emitted when a new patient registers.
- `appointment.booked` / `appointment.cancelled`: Emitted on schedule changes.
- `lab.ordered` / `lab.resulted`: Tracks the lifecycle of laboratory requests.
- `medication.dispensed`: Emitted when pharmacy issues medicine.
- `invoice.finalized`: Emitted when billing completes an invoice.

## Idempotency
To handle potential duplicate messages from Kafka (at-least-once delivery semantics), consumers use an Idempotency pattern:
- The Billing Service maintains a `ProcessedEvent` collection in MongoDB.
- Before processing an event (e.g., adding a charge), it attempts to insert the event ID. If it throws a unique constraint error, the event was already processed and is ignored.

## Real-Time Streaming (SSE)
Instead of WebSockets, Server-Sent Events (SSE) are used for unidirectional real-time data flow from the server to the client.
Nginx is configured with `proxy_buffering off` for these specific endpoints:
- `GET /api/lab/results/stream`
- `GET /api/notifications/stream`
