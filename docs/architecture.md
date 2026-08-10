# Architecture Overview

## System Context
The Hospital Management System is a modern, distributed microservices application designed for high availability and scalability. It handles patient records, doctor scheduling, laboratory tracking, pharmacy inventory, and billing operations.

## Technology Stack
- **Frontend:** React (Vite), Tailwind CSS v3, React Router
- **Backend Gateway:** Nginx (Reverse Proxy & CORS Management)
- **Microservices:** Node.js v22 (Express)
- **Database:** MongoDB (Per-service isolation)
- **Message Broker:** Apache Kafka (KRaft mode) for asynchronous event-driven communication
- **Caching & Distributed Locks:** Redis
- **Observability:** OpenTelemetry, Jaeger (Tracing), Prometheus (Metrics), Loki (Logs), Grafana (Dashboards)
- **Containerization:** Docker & Docker Compose

## Microservices Breakdown
The system is divided into 7 core services, each responsible for a specific business domain. Services do not share databases; they communicate synchronously via REST for immediate queries and asynchronously via Kafka for eventual consistency.

1. **Patients Service** (Port 3001)
   - Manages user authentication (JWT) and RBAC.
   - Handles patient profiles and medical history.
   - Maintains a read-optimized view (`PatientHistoryView`) built from Kafka events.

2. **Doctors Service** (Port 3002)
   - Manages doctor profiles, specializations, and availability schedules.

3. **Appointments Service** (Port 3003)
   - Handles booking, rescheduling, and cancellations.
   - Uses Redis distributed locks (`NX EX`) to prevent double-booking of time slots.

4. **Lab Service** (Port 3004)
   - Manages laboratory orders and test results.
   - Streams live updates to the frontend via Server-Sent Events (SSE).

5. **Pharmacy Service** (Port 3005)
   - Manages medicine inventory, prescriptions, and dispensing records.

6. **Billing Service** (Port 3006)
   - Aggregates charges from Appointments, Lab, and Pharmacy via Kafka events.
   - Generates consolidated invoices.

7. **Notification Service** (Port 3007)
   - Centralized service for sending in-app alerts and emails.
   - Consumes various Kafka topics (e.g., `appointment.booked`, `lab.resulted`) to trigger notifications.
   - Streams in-app notifications to the frontend via SSE.

## Inter-Service Communication
- **Synchronous (REST):** Used for immediate data retrieval (e.g., Appointments Service querying Doctors Service to verify a schedule before booking).
- **Asynchronous (Kafka):** Used for state changes and side effects (e.g., Pharmacy dispenses medicine -> publishes `medication.dispensed` -> Billing consumes to add charge, Notification consumes to alert patient).

## Infrastructure Overview
The entire application runs on 18 Docker containers orchestrated by Docker Compose:
- 1 Nginx Gateway
- 7 Node.js Microservices
- 1 MongoDB Server (with replica set configured for transactions)
- 1 Redis Server
- 1 Kafka Broker + 1 Kafka UI
- 1 OpenTelemetry Collector
- 1 Jaeger, 1 Prometheus, 1 Loki, 1 Grafana
- 1 shared Node-based initialization script
