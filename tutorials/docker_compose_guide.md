# Docker Compose Masterclass: Building a Microservices Architecture

Welcome to the Docker phase! When building microservices, you need a way to run multiple databases (Postgres, Redis, MongoDB), message brokers (Kafka), and your Node.js APIs simultaneously.

`docker-compose.yml` is the instruction manual that tells Docker exactly how to build and connect all these moving parts.

---

## Concept 1: The `services` Block
Every container you want to run (like Postgres or your Auth API) is called a **service**.
All services must be nested under the top-level `services:` block.

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine # Tells Docker which image to download
```

---

## Concept 2: Configuration (`environment` and `ports`)
Containers are isolated boxes. To make them useful, we have to pass data into them, and open doors for data to come out.

### Environment Variables
Some images (like Postgres) require configuration on startup. We use the `environment:` block to pass these in as key-value pairs (using colons `:`).

### Ports (The Doors)
By default, you cannot access a database running inside Docker from your Windows machine (or from Prisma). You must map a port.
Format: `"HostPort:ContainerPort"`

```yaml
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: replace-with-local-demo-password
    ports:
      - "5432:5432" # Opens port 5432 on your Windows machine and links it to Postgres
```

---

## Concept 3: Persistence (`volumes`)
> [!WARNING]
> By default, if a Docker container restarts or dies, **all data inside it is permanently deleted.**

To save our hospital data, we use **Volumes**. A volume maps a folder inside the container to your Windows hard drive.
Format: `- named_volume_name:/path/inside/container`

If you use a named volume, you **must** declare it at the very bottom of your file.

```yaml
  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data # No space after the colon!

# At the very bottom of the file (un-indented):
volumes:
  postgres_data:
```

---

## Concept 4: Isolation (`networks`)
In microservices, we want our APIs to talk to our databases securely, without exposing them to the public internet.
We achieve this by putting them on a custom virtual **Network**.

Just like volumes, if you assign a service to a network, you must declare that network at the bottom of the file.

```yaml
  postgres:
    image: postgres:16-alpine
    networks:
      - hospital-network

# At the very bottom of the file:
networks:
  hospital-network:
    driver: bridge # Bridge creates a virtual LAN for our containers
```

---

## Putting it all together: Phase 1
Here is the complete Phase 1 code. It combines all the concepts above to launch both **PostgreSQL** and **Redis** on the same private network, with permanent storage!

Copy this entire block and replace the contents of your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # ----------------------------------------
  # Core Databases
  # ----------------------------------------
  postgres:
    image: postgres:16-alpine
    container_name: pulsecore-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: replace-with-local-demo-password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - hospital-network
    restart: unless-stopped

  redis:
    image: redis:7.2-alpine
    container_name: pulsecore-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - hospital-network
    restart: unless-stopped

# ----------------------------------------
# Persistent Storage Volumes
# ----------------------------------------
volumes:
  postgres_data:
  redis_data:

# ----------------------------------------
# Custom Network
# ----------------------------------------
networks:
  hospital-network:
    driver: bridge
```

### Your Mission
1. Paste the complete code above into your `docker-compose.yml`.
2. Open your terminal in the root folder.
3. Run `docker compose up -d`
4. Let me know if it successfully boots up!
