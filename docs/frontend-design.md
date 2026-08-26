# Frontend Design

## Overview

The frontend is a Vite React single-page app for hospital staff workflows. It uses JWT authentication, the Nginx `/api` gateway, and live backend data for the dashboard, patients, appointments, lab, pharmacy, billing, patient history, and clinical summary screens.

## Tech Stack

- React 19
- React Router
- Axios
- Tailwind CSS v3
- Lucide React

## Routes

- `/login`: Authenticates through `POST /api/auth/login`.
- `/`: Staff dashboard assembled from appointments, notifications, inventory, and lab orders.
- `/patients`: Patient list and patient profile creation.
- `/patients/:id/history`: Combined patient timeline from appointments, lab, pharmacy, and billing.
- `/appointments`: Appointment list.
- `/appointments/book`: Appointment booking form populated from real patient and doctor records.
- `/lab`: Lab order creation, listing, and result entry.
- `/pharmacy`: Inventory, prescription creation, and dispensing.
- `/billing`: Invoice creation, listing, and payment.
- `/clinical`: Read-only operational summary.

## State And API Behavior

`frontend/src/api/config.js` attaches the JWT from `localStorage` to API calls and redirects to `/login` after a `401`. The frontend no longer injects a dummy development token.

Each domain page implements loading, empty, success, and error states. Form submissions refresh the affected list after the backend confirms the mutation.

## Visual Direction

The app keeps the existing PulseCore clinical command-center style: dark surface colors, translucent panels, compact operational cards, and Lucide action icons. The current layout is optimized for desktop and tablet staff workflows; the fixed sidebar remains the main responsive limitation.
