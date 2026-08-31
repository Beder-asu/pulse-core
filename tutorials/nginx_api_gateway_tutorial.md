# Nginx API Gateway Tutorial: PulseCore Final Routing

Nginx is the single public entrypoint for PulseCore. The browser opens `http://localhost`; Nginx decides whether the request should go to the React frontend or to one of the backend services.

## 1. Why We Use A Gateway

Without a gateway, the frontend would need to call many host ports:

- Auth on `3008`
- Patients on `3001`
- Doctors on `3002`
- Appointments on `3003`
- Lab on `3004`
- Pharmacy on `3005`
- Billing on `3006`
- Notifications on `3007`

With Nginx, the frontend calls one origin:

```text
http://localhost/api/...
```

That keeps browser networking simpler, keeps CORS centralized, and lets the backend services remain addressable by Docker service name inside `hospital-network`.

## 2. Final Route Map

The current `nginx/nginx.conf` uses these public paths:

| Public path | Internal backend |
|---|---|
| `/api/auth` | `http://auth-service:3008` |
| `/api/patients` | `http://patients-service:3001` |
| `/api/doctors` | `http://doctors-service:3002` |
| `/api/appointments` | `http://appointments-service:3003` |
| `/api/lab` | `http://lab-service:3004` |
| `/api/pharmacy` | `http://pharmacy-service:3005` |
| `/api/billing` | `http://billing-service:3006` |
| `/api/notifications` | `http://notification-service:3007` |
| `/` | `http://frontend:80` |

## 3. Why The Prefix Is Preserved

Each Express service mounts its routes with the `/api/...` prefix. For example, Auth uses `/api/auth`.

Because of that, Nginx forwards the full path:

```nginx
location /api/auth {
    set $auth_backend http://auth-service:3008;
    proxy_pass $auth_backend;
}
```

`POST /api/auth/login` arrives at the Auth service as `POST /api/auth/login`.

## 4. Docker DNS Resolver

Nginx uses Docker's embedded DNS resolver:

```nginx
resolver 127.0.0.11 valid=30s;
```

This matters because service containers can be recreated and receive new internal IP addresses. The `set` plus `proxy_pass` pattern makes Nginx resolve backend names at runtime instead of holding a stale startup resolution forever.

## 5. Proxy Headers

The final gateway forwards client context:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

These headers tell backend services what the original host, client IP, proxy chain, and scheme were.

## 6. Internal Header Defense

The gateway strips internal-service identity headers from public traffic:

```nginx
proxy_set_header X-Internal-Call "";
proxy_set_header X-Internal-Secret "";
```

That prevents a browser or public caller from pretending to be a trusted internal service. Real internal service-to-service calls go directly over Docker networking and use `INTERNAL_SERVICE_SECRET`.

## 7. CORS

Each API location includes:

```nginx
include cors.conf;
```

`nginx/cors.conf` handles `OPTIONS` preflight requests and allows local browser origins matching:

```nginx
"~^http://localhost(:[0-9]+)?$" "$http_origin";
```

That supports both the production gateway at `http://localhost` and local Vite development at `http://localhost:5173`.

## 8. What To Test

Open these URLs:

- `http://localhost`
- `http://localhost/api/auth/health`
- `http://localhost/api/patients/health`
- `http://localhost/api/doctors/health`
- `http://localhost/api/appointments/health`
- `http://localhost/api/lab/health`
- `http://localhost/api/pharmacy/health`
- `http://localhost/api/billing/health`
- `http://localhost/api/notifications/health`

If a deep frontend route is refreshed, the frontend container handles SPA fallback through `frontend/nginx.conf`.
