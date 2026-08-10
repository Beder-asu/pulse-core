# Frontend Design

## Overview
The frontend is a Single Page Application (SPA) built to provide a seamless, responsive, and clinical-grade user experience for hospital staff and patients. It is built using React and styled with Tailwind CSS.

## Tech Stack
- **Framework:** React 18 (bootstrapped with Vite)
- **Routing:** React Router v6
- **Styling:** Tailwind CSS v3
- **Icons:** Lucide React
- **Date Manipulation:** date-fns

## Directory Structure
The frontend codebase follows a feature-based organization:
- `/src/components/layout/`: Global layout wrappers (`Sidebar.jsx`, `TopBar.jsx`, `MainLayout.jsx`).
- `/src/pages/`: Top-level route components for each major dashboard.
- `/src/index.css`: Global CSS and Tailwind `@layer` configurations.

## Design System & Aesthetics
The design language is based on a custom "Clinical Command Center" aesthetic (PulseCore HMS).
- **Glassmorphism:** Extensive use of blurred backgrounds and translucent panels (`.glass-panel`, `.glass-card`) for a modern feel.
- **Color Palette:** A highly customized Tailwind configuration using specific hex codes to create a deep blue/teal "surface" environment (`bg-background`, `text-on-surface`).
- **Typography:** The `Inter` font family is used globally for high legibility, mapped to specific Material Design typography tokens (`body-md`, `headline-lg`, etc.).

## Routing Strategy
The application uses client-side routing.
- `/login`: Standalone authentication page.
- `/`: The main application shell (`MainLayout`), which includes the persistent Sidebar and TopBar.
  - Sub-routes (e.g., `/lab`, `/pharmacy`, `/billing`) render inside the `MainLayout` container.

## Real-Time Updates
The frontend connects to specific backend endpoints using Server-Sent Events (SSE) to receive real-time updates without polling:
- `GET /api/lab/results/stream`: Pushes live lab results to the UI.
- `GET /api/notifications/stream`: Pushes real-time alerts to the notification bell.

*(Note: The frontend is currently in a mock-data phase, pending integration with the backend microservices).*
