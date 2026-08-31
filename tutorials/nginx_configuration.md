# Nginx Configuration Tutorial: Final PulseCore Config

This tutorial maps directly to `nginx/nginx.conf` and `nginx/cors.conf`.

## 1. File Structure

PulseCore mounts two gateway files into the `api-gateway` container:

```yaml
volumes:
  - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
  - ./nginx/cors.conf:/etc/nginx/cors.conf:ro
```

`nginx.conf` owns routing. `cors.conf` owns repeated CORS behavior for API routes.

## 2. Top-Level Nginx Blocks

```nginx
events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;
}
```

`events` configures worker behavior. `http` contains web-server and reverse-proxy rules.

## 3. Allowed Local Origins

```nginx
map $http_origin $cors_origin {
    default "";
    "~^http://localhost(:[0-9]+)?$" "$http_origin";
}
```

This maps allowed local browser origins to `$cors_origin`. Unknown origins receive an empty CORS origin.

## 4. Common Proxy Headers

Inside the server block, these headers apply before the route locations:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Internal-Call "";
proxy_set_header X-Internal-Secret "";
```

The first four preserve public client context. The last two clear any caller-supplied internal authentication headers.

## 5. Runtime DNS Resolution

```nginx
resolver 127.0.0.11 valid=30s;
```

`127.0.0.11` is Docker's embedded DNS server. PulseCore uses it because service containers can be recreated with different internal IPs.

## 6. API Routing Pattern

Each service uses a variable and `proxy_pass`:

```nginx
location /api/doctors {
    include cors.conf;
    set $doctors_backend http://doctors-service:3002;
    proxy_pass $doctors_backend;
}
```

The variable enables runtime DNS resolution. `proxy_pass` sends the request to the internal Docker service. Because there is no trailing slash rewrite, the path prefix is preserved.

## 7. Final Route Table

| Location | Backend variable | Target |
|---|---|---|
| `/api/auth` | `$auth_backend` | `http://auth-service:3008` |
| `/api/patients` | `$patients_backend` | `http://patients-service:3001` |
| `/api/doctors` | `$doctors_backend` | `http://doctors-service:3002` |
| `/api/appointments` | `$appointments_backend` | `http://appointments-service:3003` |
| `/api/lab` | `$lab_backend` | `http://lab-service:3004` |
| `/api/pharmacy` | `$pharmacy_backend` | `http://pharmacy-service:3005` |
| `/api/billing` | `$billing_backend` | `http://billing-service:3006` |
| `/api/notifications` | `$notification_backend` | `http://notification-service:3007` |
| `/` | `$frontend_backend` | `http://frontend:80` |

## 8. Final CORS Config

```nginx
if ($request_method = 'OPTIONS') {
    add_header 'Access-Control-Allow-Origin' $cors_origin always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    add_header 'Access-Control-Max-Age' 1728000;
    add_header 'Content-Type' 'text/plain; charset=utf-8';
    add_header 'Content-Length' 0;
    return 204;
}
add_header 'Access-Control-Allow-Origin' $cors_origin always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
```

## 9. Frontend SPA Routing

The gateway sends all non-API paths to the frontend:

```nginx
location / {
    set $frontend_backend http://frontend:80;
    proxy_pass $frontend_backend;
}
```

The frontend container then serves the Vite build and falls back to `index.html` for React Router paths.
