# PulseCore Hospital Management System

A robust, distributed microservices application designed for high availability and scalability in modern healthcare environments.

## Architecture

This project utilizes a microservices architecture to ensure domain isolation and independent scalability. The system is composed of the following core components:

*   **API Gateway:** Nginx handles request routing and centralized CORS policy.
*   **Microservices:** 8 Node.js (Express) services handling specific domains (Auth, Patients, Doctors, Appointments, Lab, Pharmacy, Billing, Notifications).
*   **Databases:** PostgreSQL 16. Each service maintains an isolated database schema/database. Prisma ORM is used for data modeling.
*   **Message Broker:** Apache Kafka (KRaft mode) for asynchronous, event-driven communication between services.
*   **Caching & Locking:** Redis is used for caching and implementing distributed locks (e.g., to prevent appointment double-booking).
*   **Frontend:** React Single Page Application built with Vite and styled with plain CSS (glassmorphism aesthetic).
*   **Observability Stack:** Comprehensive monitoring using OpenTelemetry, Jaeger (Tracing), Prometheus (Metrics), Loki (Logs), and Grafana (Dashboards).

## Directory Structure

*   `/services`: Contains the 8 Node.js microservices.
*   `/packages/common`: Shared internal npm library for middlewares, database clients, and loggers.
*   `/frontend`: The React Vite application.
*   `/nginx`: API Gateway configuration.
*   `/monitoring`: Configurations for the observability stack (OTel, Prometheus, Grafana, etc.).
*   `/docs`: Detailed architectural and design documentation.

## Getting Started

### Prerequisites
*   Docker and Docker Compose
*   Node.js v22 (for local development/testing)

### Running the System

The entire infrastructure can be spun up using Docker Compose:

```bash
docker compose up --build -d
```

On a fresh Docker volume, Postgres creates all service databases and the `db-setup` job pushes Prisma schemas and seeds demo data before the app services start. `db-setup` is expected to show `Exited (0)` after it finishes; it is an initialization job, not a long-running server. Once running, the production frontend is available at `http://localhost`, with API services behind the same Nginx gateway at `http://localhost/api/*`.

### Observability Ports
- **Grafana:** `http://localhost:3000` (local Grafana credentials)
- **Prometheus:** `http://localhost:9090`
- **Jaeger UI:** `http://localhost:16686`
- **Loki:** `http://localhost:3100`

### Development Authentication
The frontend signs in through the Auth service and stores the returned JWT. After seeding, the demo accounts are:

```text
admin@hospital.com / replace-with-local-demo-password
doctor@hospital.com / replace-with-local-demo-password
staff@hospital.com / replace-with-local-demo-password
patient@hospital.com / replace-with-local-demo-password
```

The common auth middleware still supports `Bearer dummy-dev-token-xyz` only when `ENABLE_DEV_AUTH_BYPASS=true` is explicitly configured.

### Local Frontend Development

To run the React frontend locally:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Documentation

For deep dives into specific areas of the system, refer to the `/docs` directory:
*   `architecture.md`: Detailed system design and microservice boundaries.
*   `api-design.md`: Gateway routing, authentication, persistence, and current service communication.
*   `api-endpoints.md`: Working API endpoints currently available.
*   `frontend-design.md`: UI/UX decisions, tech stack, and component structure.
