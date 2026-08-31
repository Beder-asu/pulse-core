# Docker Compose Masterclass: Phase 3 — Containerizing Node.js APIs

So far, we have been running PostgreSQL, Redis, Kafka, and Nginx inside Docker containers. But our actual Node.js microservices are still running "naked" on your Windows machine. Phase 3 fixes that.

---

## What is a Dockerfile?

A `docker-compose.yml` tells Docker **which containers to run and how to connect them**.
A `Dockerfile` tells Docker **how to BUILD one of those containers from scratch**.

Think of it like this:
- `docker-compose.yml` = the **architect's blueprint** for the whole building
- `Dockerfile` = the **construction manual** for one specific room

When you write `image: postgres:16-alpine`, Docker pulls a pre-built image from Docker Hub. But for our custom Node.js APIs, no one has pre-built them. We have to build the image ourselves using a `Dockerfile`.

---

## How a Dockerfile works

A Dockerfile is a list of **instructions**. Docker reads them top-to-bottom and executes each one, building up a **layer** each time. The final stack of layers becomes your image.

```
Dockerfile Instructions
        ↓
   [Layer 1] Base OS (node:20-alpine)
   [Layer 2] Set working directory
   [Layer 3] Copy package.json
   [Layer 4] npm install
   [Layer 5] Copy source code
   [Layer 6] Expose port
   [Layer 7] Start command
        ↓
   Final Image: pulsecore-auth
        ↓
   Running Container
```

---

## Every Dockerfile instruction explained

### `FROM`
```dockerfile
FROM node:20-alpine
```
**"Start building from this base image."**

Every Dockerfile must start with `FROM`. It defines the starting point — the operating system and runtime your app needs.

- `node:20-alpine` = Node.js version 20, running on Alpine Linux (a tiny 5MB Linux distro, compared to Ubuntu's 200MB)
- We use Alpine everywhere for smaller, faster, more secure images.

---

### `WORKDIR`
```dockerfile
WORKDIR /app
```
**"All following commands run inside this folder inside the container."**

Without this, Docker runs commands in the root `/` directory of the container, which gets messy. This creates the `/app` directory and `cd`s into it for all future instructions.

---

### `COPY`
```dockerfile
COPY package*.json ./
```
**"Copy files from your Windows machine into the container."**

Format: `COPY <source-on-host> <destination-in-container>`

We copy `package.json` and `package-lock.json` **first**, before copying the rest of the code.

> **Why not copy everything at once?**
> Docker caches each layer. If your source code changes, Docker only re-runs the layers from that point downward. By copying `package.json` first and running `npm install` as a separate layer, Docker can skip the `npm install` step on rebuilds if your dependencies haven't changed. This saves minutes on every rebuild!

---

### `RUN`
```dockerfile
RUN npm install --omit=dev
```
**"Execute a shell command while building the image."**

This is like typing a command in your terminal. It runs once during the build, not when the container starts.

- `--omit=dev` skips devDependencies (like `nodemon`) since we don't need them in production.
- You can chain commands: `RUN apt-get update && apt-get install -y curl`

---

### `COPY` (again — the rest of the code)
```dockerfile
COPY . .
```
**"Now copy everything else."**

This copies your entire source code. Because this comes after `npm install`, a code change won't invalidate the npm install cache layer. Efficient!

---

### `EXPOSE`
```dockerfile
EXPOSE 3001
```
**"Document that this container listens on port 3001."**

> [!NOTE]
> `EXPOSE` does NOT actually open the port. It is documentation only — a hint to anyone reading the Dockerfile. The actual port mapping is done in `docker-compose.yml` with `ports: - "3001:3001"`.

---

### `CMD`
```dockerfile
CMD ["node", "src/server.js"]
```
**"The command to run when the container starts."**

This is NOT a build-time command. It runs every time Docker starts the container.

- Format: JSON array `["command", "arg1", "arg2"]` — always use this format, never a plain string.
- A Dockerfile can only have **one** `CMD`. If you need multiple commands at startup, use a shell script.

---

## The complete Dockerfile for our Auth Service

```dockerfile
# ── Stage: Base Image ──────────────────────────────────────
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency files first (for build cache efficiency)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the source code
COPY . .

# Generate Prisma Client inside the container
RUN npx prisma generate

# Document the port this service listens on
EXPOSE 3001

# Start the server
CMD ["node", "src/server.js"]
```

> [!IMPORTANT]
> Notice the `RUN npx prisma generate` step! Our Prisma Client is generated at build time inside the container. Without this, the container would crash with "Prisma Client not found" because the generated files only exist on your Windows machine, not inside the container's Linux environment.

---

## The `.dockerignore` file
Before Docker copies your files into the container with `COPY . .`, it checks for a `.dockerignore` file and skips anything listed there. This is exactly like `.gitignore` but for Docker.

```dockerignore
node_modules
.env
prisma/migrations
*.log
```

> [!WARNING]
> **Never copy `node_modules` into a container.** They are compiled for your Windows machine and won't work on the Alpine Linux container. Let `npm install` inside the container build its own Linux-compatible modules.

> [!CAUTION]
> **Never copy `.env` into a container.** Your secrets (database passwords, JWT keys) should be injected at runtime via `docker-compose.yml`'s `environment:` block, not baked permanently into the image.

---

## Adding the service to docker-compose.yml

Once you have a `Dockerfile`, you reference it in `docker-compose.yml` using `build:` instead of `image:`.

```yaml
  auth-service:
    build:
      context: ./services/auth   # Where to find the Dockerfile
      dockerfile: Dockerfile     # The name of the Dockerfile
    container_name: pulsecore-auth
    ports:
      - "3001:3001"
    environment:
      - POSTGRES_BASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/auth_db
      - JWT_SECRET=your-secret-key
    networks:
      - hospital-network
    depends_on:
      - postgres
      - kafka
    restart: unless-stopped
```

> **Key difference in the database URL!**
> In your local `.env` file: `@127.0.0.1:5434/auth_db`
> In docker-compose environment: `@postgres:5432/auth_db`
>
> Inside Docker, containers talk to each other by **container name** on the **internal port**, not your Windows host port!

---

## Your Mission: Phase 3

1. Create a `Dockerfile` inside each of your 8 service folders (I will do this for you on autopilot).
2. Create a `.dockerignore` inside each service folder.
3. Add all 8 services to `docker-compose.yml`.
4. Run `docker compose up -d --build` to build the images and start everything.

The `--build` flag tells Docker to rebuild all images from their Dockerfiles before starting.
