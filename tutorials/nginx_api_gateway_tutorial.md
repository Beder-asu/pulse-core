# Comprehensive Guide to Nginx API Gateway

## 1. Definition
**Nginx** (pronounced "engine-x") is a highly scalable web server, reverse proxy, load balancer, and API gateway. In a microservice architecture, instead of using it to serve static HTML files, we use it as an **API Gateway**—a single entry point that sits in front of all our backend microservices and manages the flow of traffic between the external internet and the internal Docker network.

## 2. The Problem and Its Solution
### The Problem: The Spaghetti Network
Imagine you have a frontend React application running on a user's browser, and it needs to communicate with our 8 microservices.
Without an API Gateway, the frontend would have to know the exact IP address and port of every single service:
- To login: `POST http://192.168.1.10:3008/login`
- To get patients: `GET http://192.168.1.11:3001/patients`
- To book an appointment: `POST http://192.168.1.12:3003/appointments`

This creates several massive problems:
1. **Security:** You have to expose 8 different ports to the public internet, dramatically increasing your attack surface.
2. **CORS Issues:** Browsers block requests to different ports/domains for security reasons (Cross-Origin Resource Sharing).
3. **Refactoring:** If the `patients-service` IP changes, you have to push a new version of the frontend app.
4. **Authentication:** You would have to verify JWT tokens inside every single one of the 8 microservices.

### The Solution: The Reverse Proxy
We place Nginx in front of the microservices. We only expose **one** port to the internet (Port 80/443).
The React frontend only talks to one URL: `http://api.hospital.com/`.

When the frontend sends a request to `http://api.hospital.com/api/auth/login`:
1. Nginx receives the request.
2. Nginx checks its configuration rules: *"Ah, anything starting with `/api/auth` should be forwarded to the `auth-service` container on port 3008."*
3. Nginx invisibly proxies the request to the internal container.
4. The container responds to Nginx.
5. Nginx forwards the response back to the client.

The client has no idea that 8 different microservices exist. To the client, it looks like one giant monolithic API.

## 3. How Does It Do It? (The Internals)
Nginx is incredibly fast because of its **Event-Driven, Asynchronous Architecture**.
Traditional web servers (like Apache) spawn a new thread or process for every single incoming HTTP connection. If 10,000 users connect, Apache consumes 10,000 threads of RAM and the server crashes.

Nginx runs on a single master process and a few worker processes (usually one per CPU core). Each worker uses an asynchronous event loop (similar to Node.js). A single worker can handle tens of thousands of concurrent connections simultaneously without blocking. It simply accepts a request, passes it to a backend microservice, and immediately goes back to accepting more requests while waiting for the microservice to respond.

### Key Features of an API Gateway
- **Reverse Proxying:** Hiding the identity of the backend servers.
- **Load Balancing:** If we spin up 3 instances of `patients-service`, Nginx can use "Round Robin" to distribute incoming traffic evenly across all 3 containers.
- **SSL Termination:** Instead of configuring HTTPS certificates (SSL/TLS) inside all 8 microservices, we put the SSL certificate exclusively on Nginx. Nginx decrypts the incoming HTTPS traffic and forwards it as plain HTTP to the internal microservices on the secure Docker network.

## 4. How to Generally Set It Up
You configure Nginx using a highly readable, declarative configuration file called `nginx.conf`.
You define a `server` block (which listens on a port), and `location` blocks (which define routing rules).

```nginx
http {
    server {
        listen 80;

        location /api/users/ {
            proxy_pass http://user-service:3000/;
            proxy_set_header Host $host;
        }
    }
}
```

## 5. How We Will Wire It Up in Our App
We are running Nginx inside the `pulsecore-gateway` Docker container. It is attached to our `hospital-network`.
Because Docker has internal DNS resolution, Nginx can route traffic using the container names rather than hardcoded IP addresses.

We will create an `nginx.conf` file that maps every single microservice to a specific URL path:
- `/api/auth` -> `http://auth-service:3008`
- `/api/patients` -> `http://patients-service:3001`
- `/api/doctors` -> `http://doctors-service:3002`
- `/api/appointments` -> `http://appointments-service:3003`
- `/api/lab` -> `http://lab-service:3004`
- `/api/pharmacy` -> `http://pharmacy-service:3005`
- `/api/billing` -> `http://billing-service:3006`
- `/api/notifications` -> `http://notification-service:3007`

Once applied, our React Frontend will simply fetch data from `http://localhost/api/...` and Nginx will flawlessly conduct the traffic to the correct backend service!
