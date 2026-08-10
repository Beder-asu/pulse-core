# PulseCore Hospital Management System

A robust, distributed microservices application designed for high availability and scalability in modern healthcare environments.

## Architecture

This project utilizes a microservices architecture to ensure domain isolation and independent scalability. The system is composed of the following core components:

*   **API Gateway:** Nginx handles request routing and centralized CORS policy.
*   **Microservices:** 7 Node.js (Express) services handling specific domains (Patients, Doctors, Appointments, Lab, Pharmacy, Billing, Notifications).
*   **Databases:** MongoDB (with replica set enabled for ACID transactions). Each service maintains isolated database collections.
*   **Message Broker:** Apache Kafka (KRaft mode) for asynchronous, event-driven communication between services.
*   **Caching & Locking:** Redis is used for caching and implementing distributed locks (e.g., to prevent appointment double-booking).
*   **Frontend:** React Single Page Application built with Vite and styled with Tailwind CSS v3, featuring a modern glassmorphism aesthetic.
*   **Observability Stack:** Comprehensive monitoring using OpenTelemetry, Jaeger (Tracing), Prometheus (Metrics), Loki (Logs), and Grafana (Dashboards).

## Directory Structure

*   `/services`: Contains the 7 Node.js microservices.
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

The entire infrastructure (18 containers) can be spun up using Docker Compose:

```bash
docker-compose up --build -d
```

Once running, the services will be available behind the Nginx gateway at `http://localhost/api/*`, and the frontend can be accessed via its development server (see Frontend Setup).

### Frontend Setup

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
*   `api-design.md`: Routing, Authentication, Kafka events, and real-time SSE patterns.
*   `frontend-design.md`: UI/UX decisions, tech stack, and component structure.
