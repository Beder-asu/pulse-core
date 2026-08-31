# Security and Role-Scoped Access

## Enforcement Model

PulseCore uses defense in depth:

1. Nginx strips externally supplied internal-service headers.
2. `protect` verifies a short-lived access JWT on every protected request and rejects tokens that are not explicitly typed as `access`.
3. `authorize` rejects roles that cannot invoke an endpoint at all.
4. Service-local policy modules decide ownership and permitted query scope.
5. Repositories pass that scope directly into Prisma so unauthorized rows are not loaded and filtered later.

The databases are owned by separate microservices and connect through service identities, not one PostgreSQL login per end user. For that reason, record-level authorization is enforced before Prisma queries rather than with PostgreSQL RLS session variables. Moving to database RLS later would require transaction-local user context on every pooled connection and is a separate deployment architecture.

## Role Matrix

| Capability | Patient | Doctor | Staff | Admin |
|---|---:|---:|---:|---:|
| View patient profiles | Self | All clinical profiles | All | All |
| Create patient account/profile | No | No | Yes | Yes |
| View doctor directory | Yes | Yes | Yes | Yes |
| Create doctor profile | No | Self | Any | Any |
| View appointments | Own | Assigned to self | All | All |
| Book appointment | Self | No | Any patient | Any patient |
| View lab orders | Own | Authored by self | All | All |
| Create lab order | No | As self | No | Yes |
| Record lab result | No | No | Yes | Yes |
| View pharmacy inventory | No | Yes | Yes | Yes |
| View prescriptions | No | Authored by self | All | All |
| Create prescription | No | As self | No | Yes |
| Dispense prescription | No | No | Yes | Yes |
| Billing | No | No | View/create/pay | View/create/pay |
| Notifications | Own | Own | Operational feed | Operational feed |

`SYSTEM` is an internal-only role. It is granted only when a direct service-to-service request contains both the internal-call marker and the configured shared secret. Public Nginx traffic can never supply these headers because the gateway clears them.

## Token Lifecycle

- Login returns a 15-minute access JWT and sets a 30-day opaque refresh token in an HttpOnly, SameSite=Lax cookie.
- The Auth database stores only a SHA-256 hash of the refresh token.
- `POST /api/auth/refresh` rotates the refresh token atomically and returns a new access token.
- A rotated token cannot be used twice. Reuse revokes every active refresh token for that user because it can indicate credential theft.
- `POST /api/auth/logout` revokes the current refresh token and clears the cookie.
- `POST /api/auth/logout-all` requires a valid access token and revokes every session for that user.
- Account provisioning never creates or replaces the staff member's browser session.

Use `scripts/verify-refresh-storage.sql` against `auth_db` to assert the live table contains only correctly sized SHA-256 digests. The session-service tests additionally prove that each digest differs from the raw credential returned to the browser.

Production deployments must provide strong, unique values for `JWT_SECRET` and `INTERNAL_SERVICE_SECRET`, and set `COOKIE_SECURE=true` behind HTTPS.

## SOLID Boundaries

- **Single responsibility:** controllers translate HTTP, policies authorize, services orchestrate use cases, repositories persist, token primitives create credentials, and session services manage lifecycle.
- **Open/closed:** role decisions are centralized in policy modules instead of duplicated conditionals throughout controllers and repositories.
- **Liskov substitution:** injected repository, policy, clock, token, publisher, and client interfaces are replaceable by test doubles with the same contracts.
- **Interface segregation:** use-case factories receive narrow collaborators such as `assertCanBook`, `findAll`, or `rotate`, not a global application container.
- **Dependency inversion:** business services depend on those injected capabilities; production modules provide Prisma, JWT, Kafka, and HTTP implementations at the composition boundary.

Comments in source files describe invariants, security reasoning, transaction behavior, and non-obvious control flow. Routine assignments and framework syntax are intentionally left self-explanatory to prevent comments from drifting away from executable behavior.
