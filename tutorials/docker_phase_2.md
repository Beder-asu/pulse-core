# Docker Compose Masterclass: Phase 2

Welcome to Phase 2! Now that our core databases are running, it is time to build the "nervous system" and the "front door" of our microservices architecture.

---

## Concept 1: The API Gateway (Nginx)
Right now, we have 7 different microservices. If you were building a React frontend, would you want to connect to 7 different ports (`localhost:3001`, `localhost:3002`, `localhost:3003`)? No! That would be a nightmare.

An **API Gateway** acts as the single front door to our hospital.
The React frontend makes *all* requests to one place (e.g., `localhost:80`), and the Gateway routes the traffic to the correct microservice based on the URL path.

- `/api/auth` -> Auth Service
- `/api/patients` -> Patients Service

We use **Nginx** for this. To make Nginx work in Docker, we must map a custom configuration file (`nginx.conf`) from our Windows machine into the container.

```yaml
  api-gateway:
    image: nginx:alpine
    container_name: pulsecore-gateway
    ports:
      - "80:80" # The single front door
    volumes:
      # We map our custom config file into Nginx's default config location
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - hospital-network
```

---

## Concept 2: The Event Broker (Kafka)
In a monolith, if a Patient registers, you can just call the Notification Service's function directly.
In microservices, they are separated. If the Patients Service crashes while trying to call the Notification Service, the email is lost forever!

To solve this, we use an **Event Broker** (Apache Kafka).
It acts like a Post Office.
1. The Patient Service publishes a "PatientRegistered" event to Kafka.
2. The Patient Service immediately goes back to work.
3. The Notification Service checks Kafka, sees the event, and sends the email whenever it's ready!

We use Kafka in **KRaft mode**, which allows it to run without a separate Zookeeper container.

```yaml
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: pulsecore-kafka
    ports:
      - "9092:9092"
    environment:
      # Kafka Configuration (KRaft Mode)
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:29093
      KAFKA_LISTENERS: PLAINTEXT://kafka:29092,CONTROLLER://kafka:29093,PLAINTEXT_HOST://0.0.0.0:9092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      CLUSTER_ID: hospital-cluster-123
    networks:
      - hospital-network
```

---

## Putting it all together: Phase 2 Code
Add these two new services directly below your `redis` service in your `docker-compose.yml`. Make sure they are indented correctly under `services:`!

```yaml
  # ----------------------------------------
  # API Gateway
  # ----------------------------------------
  api-gateway:
    image: nginx:alpine
    container_name: pulsecore-gateway
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - hospital-network
    restart: unless-stopped
    depends_on:
      - postgres
      - redis

  # ----------------------------------------
  # Message Broker (Kafka)
  # ----------------------------------------
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: pulsecore-kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:29093
      KAFKA_LISTENERS: PLAINTEXT://kafka:29092,CONTROLLER://kafka:29093,PLAINTEXT_HOST://0.0.0.0:9092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      CLUSTER_ID: hospital-cluster-123
    networks:
      - hospital-network
    restart: unless-stopped
```

### Your Mission
1. Read through the concepts above.
2. Paste the Phase 2 code into your `docker-compose.yml` under `services:`.
3. The Nginx service expects a file called `nginx/nginx.conf`. I will create a basic version of this file for you in a moment!
4. Once you've pasted the code, run `docker compose up -d` to pull Kafka and Nginx!
