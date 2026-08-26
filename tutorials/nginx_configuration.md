# Nginx Configuration Masterclass: API Gateway for Microservices

We have 8 Node.js APIs running inside Docker. Without Nginx, your React frontend would need to know all 8 ports and talk to them individually. Nginx acts as the single front door, routing traffic intelligently.

```
React Frontend (port 80)
        ↓
  [Nginx Gateway]
        ↓ routes based on URL path
  ┌─────┬─────┬────────┬─────┐
 auth patients doctors  lab  ...
(3008) (3001) (3002)  (3004)
```

---

## The Structure of `nginx.conf`

An `nginx.conf` file has a strict hierarchy of blocks:

```
http {               ← All web traffic settings live here
  upstream { }       ← Define your backend servers (our APIs)
  upstream { }       ← One upstream block per microservice

  server {           ← The virtual server (our front door)
    listen 80;       ← Listen on port 80

    location /api/auth { }        ← Route 1
    location /api/patients { }    ← Route 2
    location /api/doctors { }     ← Route 3
    ...
  }
}
```

---

## Concept 1: The `upstream` block

```nginx
upstream auth_service {
    server auth-service:3008;
}
```

**"Define a group of backend servers called `auth_service`."**

- `auth-service` is the **Docker container name** (from `container_name:` in docker-compose.yml)
- `3008` is the **internal container port** (not the host port)
- You can add multiple `server` lines inside one upstream for load balancing!

```nginx
# Load balancing example (if we had 3 auth replicas)
upstream auth_service {
    server auth-service-1:3008;
    server auth-service-2:3008;
    server auth-service-3:3008;
}
```

Nginx will automatically distribute requests across all listed servers. We only have one replica per service for now, but the architecture is already ready to scale!

---

## Concept 2: The `location` block

```nginx
location /api/auth/ {
    proxy_pass http://auth_service/;
}
```

**"When a request comes in for `/api/auth/...`, forward it to the `auth_service` upstream."**

This is called **reverse proxying**. The client (React) never knows the backend exists — it only sees Nginx.

### The trailing slash rule
> [!IMPORTANT]
> The trailing slash `/` in `location /api/auth/` and `proxy_pass http://auth_service/` is critical.
>
> - `location /api/auth/` → matches any path starting with `/api/auth/`
> - `proxy_pass http://auth_service/` → **strips** the `/api/auth/` prefix before forwarding
>
> Without it: the request `/api/auth/login` arrives at your service as `/api/auth/login`
> With it: the request `/api/auth/login` arrives at your service as `/login`
>
> Since our Express routes are defined as `app.use('/api/auth', authRoutes)`, we do NOT want Nginx to strip the prefix. We use it **without** stripping to keep the full path.

---

## Concept 3: Proxy Headers

```nginx
location /api/auth/ {
    proxy_pass http://auth_service;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

When Nginx forwards a request, by default it strips information about the original client. These headers restore that information:

| Header | What it contains |
|---|---|
| `Host` | The original hostname the client requested |
| `X-Real-IP` | The real IP address of the client |
| `X-Forwarded-For` | A chain of IPs if there are multiple proxies |

This is important for things like **rate limiting by IP** and **audit logging** (our `createdBy` field needs to know who made the request!).

---

## Concept 4: CORS at the Gateway Level

Instead of handling CORS inside every single Express service, we can handle it once at the Nginx level:

```nginx
add_header 'Access-Control-Allow-Origin' '*';
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
```

> [!NOTE]
> In production, replace `'*'` with your actual frontend domain (e.g., `'https://pulsecore.hospital.com'`) to prevent unauthorized origins from calling your API.

---

## The Complete `nginx.conf` for our Hospital System

This is the full production-ready configuration. Copy this and replace the contents of your `nginx/nginx.conf` file:

```nginx
events {
    worker_connections 1024;
}

http {

    # ── Upstream Definitions (our 8 microservices) ──────────────

    upstream auth_service {
        server auth-service:3008;
    }

    upstream patients_service {
        server patients-service:3001;
    }

    upstream doctors_service {
        server doctors-service:3002;
    }

    upstream appointments_service {
        server appointments-service:3003;
    }

    upstream lab_service {
        server lab-service:3004;
    }

    upstream pharmacy_service {
        server pharmacy-service:3005;
    }

    upstream billing_service {
        server billing-service:3006;
    }

    upstream notification_service {
        server notification-service:3007;
    }

    # ── Virtual Server (The Front Door) ─────────────────────────

    server {
        listen 80;

        # ── Routing Rules ──────────────────────────────────────

        location /api/auth {
            proxy_pass http://auth_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /api/patients {
            proxy_pass http://patients_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /api/doctors {
            proxy_pass http://doctors_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /api/appointments {
            proxy_pass http://appointments_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /api/lab {
            proxy_pass http://lab_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /api/pharmacy {
            proxy_pass http://pharmacy_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /api/billing {
            proxy_pass http://billing_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /api/notifications {
            proxy_pass http://notification_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # ── Gateway Health Check ────────────────────────────────
        location /health {
            return 200 'API Gateway is healthy!';
            add_header Content-Type text/plain;
        }
    }
}
```

---

## Your Mission

1. Read through the concepts above.
2. Copy the complete `nginx.conf` block and replace the contents of your `nginx/nginx.conf` file.
3. Restart just the gateway container (no need to rebuild everything):
   ```bash
   docker compose restart api-gateway
   ```
4. Test it by opening your browser to:
   - `http://localhost/health` → should return `API Gateway is healthy!`
   - `http://localhost/api/auth/health` → should return `{ status: 'Auth Service OK' }`
