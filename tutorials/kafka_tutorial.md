# Comprehensive Guide to Kafka (Event-Driven Architecture)

## 1. Definition
**Apache Kafka** is a distributed event streaming platform capable of handling trillions of events a day. Originally developed by LinkedIn, it acts as a high-throughput, low-latency messaging queue and storage system. In a microservice architecture, Kafka serves as the "central nervous system" that allows completely decoupled services to communicate asynchronously.

## 2. The Problem and Its Solution
### The Problem: Synchronous Coupling
Imagine a user books an appointment. The process looks like this:
1. User clicks "Book". Request hits the `appointments-service`.
2. The `appointments-service` saves the appointment in its database.
3. The `appointments-service` makes a synchronous HTTP request to the `notification-service` to send a confirmation email.
4. The `notification-service` sends the email and returns an HTTP 200 OK.
5. The `appointments-service` returns an HTTP 200 OK to the user.

What if the `notification-service` is temporarily down or slow? The HTTP request times out. The user gets an error on their screen ("Failed to book appointment") even though the appointment *was* saved in the database! The services are tightly coupled.

### The Solution: Asynchronous Decoupling
With Kafka, we adopt an **Event-Driven Architecture**:
1. User clicks "Book". Request hits the `appointments-service`.
2. The `appointments-service` saves the appointment in its database.
3. The `appointments-service` fires a single message into Kafka: `{"event": "AppointmentCreated", "userId": 123}`.
4. The `appointments-service` instantly returns HTTP 200 OK to the user.
5. In the background, the `notification-service` (which is subscribed to Kafka) reads the message and sends the email.

If the `notification-service` is down, the email isn't lost. Kafka stores the message safely on disk. When the `notification-service` boots back up, it resumes exactly where it left off!

## 3. How Does It Do It? (The Internals)
Kafka uses a unique architecture that makes it drastically faster and more scalable than traditional message queues (like RabbitMQ or ActiveMQ).

- **Broker:** A single Kafka server. A cluster consists of multiple brokers.
- **Topic:** A category or feed name to which messages are published (e.g., `hospital.events`).
- **Partitions:** This is Kafka's magic. A topic is split into multiple Partitions spread across different brokers. This allows massive parallel processing. If you have 3 partitions, 3 consumers can read from the topic simultaneously.
- **Producer:** An application that writes messages to a Kafka Topic (e.g., `appointments-service`).
- **Consumer:** An application that reads messages from a Kafka Topic (e.g., `notification-service`).
- **Consumer Group:** A cluster of consumers working together. If you spin up 5 replicas of the `notification-service`, they all join the `"notification-group"`. Kafka guarantees that a single message is only delivered to *one* of the 5 replicas, balancing the load perfectly.
- **Offsets:** Unlike RabbitMQ, which deletes a message after it is read, Kafka keeps messages on disk (usually for 7 days). It tracks what a Consumer has read using an integer called an `offset` (e.g., "The notification service has read up to message #4,032").

## 4. How to Generally Set It Up
1. **Deploy the Broker:** You run the Kafka server (often alongside Zookeeper or using KRaft mode for leader election).
2. **Install a Client Library:** In Node.js, the most popular and modern library is `kafkajs`.
3. **Configure the Producer:**
   ```javascript
   const kafka = new Kafka({ clientId: 'my-app', brokers: ['kafka:9092'] })
   const producer = kafka.producer()
   await producer.connect()
   await producer.send({ topic: 'my-topic', messages: [{ value: 'Hello!' }] })
   ```
4. **Configure the Consumer:**
   ```javascript
   const consumer = kafka.consumer({ groupId: 'my-group' })
   await consumer.connect()
   await consumer.subscribe({ topic: 'my-topic', fromBeginning: true })
   await consumer.run({ eachMessage: async ({ message }) => console.log(message.value) })
   ```

## 5. How It Is Wired in Our App
Kafka is currently used for one production flow: appointments publish hospital events, and notifications consume them.

1. **Shared Kafka Adapters**
   The reusable Kafka connection logic lives in `packages/common/src/kafka-publisher.js` and `packages/common/src/kafka-consumer.js`. The shared package exports them lazily so services that only need logging, auth, metrics, or Redis do not construct Kafka clients.
2. **Appointment Publisher**
   `services/appointments/src/messaging/producerLifecycle.js` starts and stops the producer for the appointments service. `services/appointments/src/messaging/publishers/appointmentCreatedPublisher.js` publishes `AppointmentCreated` events to the `hospital.events` topic after an appointment is persisted.
3. **Notification Consumer**
   `services/notification/src/server.js` starts `services/notification/src/messaging/consumers/hospitalEventsConsumer.js` after the HTTP server is listening. That consumer subscribes to `hospital.events` and turns `AppointmentCreated` messages into persisted notifications.
4. **OpenTelemetry Tracing**
   OpenTelemetry instrumentation is loaded before each service starts. HTTP requests are traced today, and Kafka message handling runs inside the instrumented services. If deeper producer-to-consumer trace propagation is needed later, the next step is to explicitly pass trace context in Kafka message headers.
