# PulseCore Frontend

This is the React/Vite single-page application for PulseCore. In the Docker Compose stack it is built into static files and served by the frontend Nginx container behind the public API gateway at `http://localhost`.

## Local Development

```bash
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173`. API calls use the `/api` prefix and are proxied to the gateway, so local development exercises the same backend route structure as the Compose deployment.

## Structure

- `src/api/config.js`: shared Axios client, access-token attachment, refresh handling, and login redirects.
- `src/auth/roles.js`: current-user helpers and role checks used by protected routes/navigation.
- `src/components/layout`: app shell, sidebar, and notification-aware top bar.
- `src/pages`: dashboard and domain workflows for patients, appointments, lab, pharmacy, billing, clinical summary, and patient history.
- `src/utils/identity.js`: profile/user identifier helpers used to display names instead of raw UUIDs.

## Production Build

```bash
npm run build
```

The resulting `dist` output is intentionally ignored by Git and generated inside the Docker build.
