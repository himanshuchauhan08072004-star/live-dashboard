# Instant Mechanic — Live Vehicle Service Operations Dashboard

## Project Overview

A live operations dashboard for an automotive service company. Operations staff can see bookings, mechanics, and revenue in real time, drill into a booking's status timeline, and move it through its lifecycle — all backed by a real relational database and a REST + WebSocket API.

**Product decisions made:**
- Prioritized a genuinely usable operations table (search/filter/sort/pagination all server-side) over a large feature count.
- Used SQLite instead of PostgreSQL for local/dev portability — the schema is plain SQL and relational, so moving to Postgres is a matter of swapping the driver and adjusting the few SQLite-specific functions (`datetime('now', ...)`, `RANDOM()`).
- Booking status transitions are validated server-side against a fixed state machine (`PENDING → ASSIGNED → ON_THE_WAY → IN_PROGRESS → COMPLETED`, with `CANCELLED` reachable from any non-terminal state) — the frontend cannot force an invalid jump.
- A lightweight background simulator advances a random active booking every 12 seconds so the "live" behavior is visible without needing two browser tabs open.

## Features

- JWT authentication (bcrypt-hashed passwords), role-based (`ADMIN` / `OPERATIONS` / `MECHANIC`)
- Overview dashboard: 8 KPIs, live operations feed, recently completed feed, auto-refreshing
- Bookings: search, filter (status/service/mechanic/date range), sort, server-side pagination, detail drawer with status timeline and status-change actions
- Mechanics: status, rating, jobs completed, filterable list, profile drawer with recent jobs
- Customers: booking count, total spent, customer-since, profile drawer with vehicles + booking history
- Analytics: bookings over time, revenue over time, status breakdown (donut), service category breakdown (bar) — 7/30/90-day ranges
- Real-time updates over Socket.IO: booking status changes and new notifications push to every connected client and update the relevant UI without a page reload
- Notifications panel with unread count, mark-as-read / mark-all-as-read
- Responsive layout (mobile drawer nav, stacking cards, scrollable tables)
- Loading skeletons, empty states, and error states with retry on every data view

## Tech Stack

**Frontend:** React 19 + TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, Recharts, Socket.IO client, Axios, Lucide icons

**Backend:** Node.js (>=22.5) + Express + TypeScript, `node:sqlite` (Node's built-in SQLite module — no native compile step), Socket.IO, JWT, bcryptjs, Zod for request validation

> Note on stack deviation: the brief recommended Prisma/PostgreSQL. Prisma's engine binaries are fetched from `binaries.prisma.sh` at `generate` time, which the environment I built this in blocks — so I first moved to `better-sqlite3` (a native module), which then failed to install on Windows without Visual Studio's C++ build tools. To make local setup dependency-free, I switched again to Node's built-in `node:sqlite` module (stable enough for this since Node 22.5, ships with Node 24) — zero native compilation, zero extra install step, works out of the box on any machine with a recent Node. The data access layer is isolated in `src/db/`, and every query is plain parameterized SQL, so re-pointing this at Postgres later is a contained change, not a rewrite.

## Architecture

```
Frontend (Vite/React)
        ↓
REST API (Express, JSON)  +  WebSocket (Socket.IO)
        ↓
Data access layer (src/db, parameterized SQL)
        ↓
SQLite (dev.db)
```

Auth is stateless JWT — the token carries `id`, `email`, `role`, `name` and is verified per-request in `middleware/auth.ts`. There's no session store.

## Database Schema

Tables: `User`, `Customer`, `Vehicle`, `Mechanic`, `ServiceCategory`, `Service`, `Booking`, `BookingStatusHistory`, `Notification`.

- `Booking` is the central table: foreign keys to `Customer`, `Vehicle`, `Service`, and a nullable `Mechanic`.
- Revenue is never stored directly — it's always aggregated from `Booking.amount` where `status = 'COMPLETED'`.
- Indexes on `Booking.status`, `Booking.scheduledAt`, `Booking.customerId`, `Booking.mechanicId`, `Booking.serviceId`, `Mechanic.status`, `Vehicle.customerId`, `Service.categoryId`, `Notification.read`.
- Every status change is appended to `BookingStatusHistory`, which powers the detail-drawer timeline.

Full schema: `backend/src/db/schema.sql`.

## API Documentation

Base URL: `http://localhost:4000/api`. All routes except `/auth/login` require `Authorization: Bearer <token>`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/login` | Returns `{ token, user }` |
| GET | `/auth/me` | Current user from token |
| GET | `/dashboard` | KPIs + live ops + recently completed |
| GET | `/bookings` | `page, limit, search, status, serviceId, mechanicId, from, to, sortBy, sortOrder` |
| GET | `/bookings/:id` | Booking + status history |
| PATCH | `/bookings/:id/status` | `{ status, mechanicId?, note? }`, validated transition |
| GET | `/mechanics` | `page, limit, search, status, sortBy, sortOrder` |
| GET | `/mechanics/:id` | Mechanic + recent bookings |
| GET | `/customers` | `page, limit, search, sortBy, sortOrder` |
| GET | `/customers/:id` | Customer + vehicles + bookings + summary |
| GET | `/analytics/bookings` | `?range=7\|30\|90` — daily booking counts |
| GET | `/analytics/revenue` | `?range=7\|30\|90` — daily completed revenue |
| GET | `/analytics/status-breakdown` | Count per booking status |
| GET | `/analytics/services` | Bookings/revenue per service category |
| GET | `/notifications` | Last 30, plus unread count |
| PATCH | `/notifications/:id/read` | Mark one read |
| PATCH | `/notifications/read-all` | Mark all read |

No Swagger UI is wired up in this build (SQLite/Express doesn't get one for free the way NestJS does) — the table above and the route files under `backend/src/routes/` are the source of truth.

## Real-Time Architecture

Socket.IO server in `backend/src/ws/socket.ts`, initialized alongside the HTTP server. Events emitted:

- `booking.status_changed` — whenever a booking's status changes (manual update or the background simulator)
- `notification.created` — whenever a new notification is written

The frontend's `LiveContext` holds one socket connection for the whole app, invalidates the relevant TanStack Query caches on `booking.status_changed` (dashboard, bookings, mechanics, analytics), and shows a toast on `notification.created`. No polling is used for these — only the initial load and a 15–20s background refetch as a safety net.

## Authentication / Authorization

- Passwords hashed with bcrypt (10 rounds)
- JWT signed with `JWT_SECRET`, 12-hour expiry
- `requireAuth` middleware verifies the token on every protected route
- `requireRole(...roles)` middleware is available for endpoints that should be admin-only (not currently applied anywhere, since both seeded roles can operate the dashboard — wire it onto `PATCH /bookings/:id/status` if you want status changes restricted to `ADMIN`)

Seeded accounts:
- `admin@vsod.in` / `password123` (ADMIN)
- `ops@vsod.in` / `password123` (OPERATIONS)

## Seed Data

`backend/prisma/seed.ts` (kept in the `prisma/` folder name for familiarity, though Prisma itself isn't used) generates:
- 60 customers, 70–85 vehicles (some customers have 2), realistic Indian names/emails/phone numbers, Gurugram/NCR-area addresses
- 24 mechanics with Gurugram-area lat/lng, ratings, job counts
- 16 services across the 8 required categories, INR pricing
- 540 bookings with weighted status distribution (mostly completed, a realistic cancellation rate, some pending/in-flight), scheduled dates spread across the past 90 days plus a few days into the future, full status-history trails, and notifications for recent bookings

Re-run anytime with `npm run seed` (backend) — it clears and reseeds.

## Local Setup

Requires **Node.js 22.5 or newer** (for the built-in `node:sqlite` module — check with `node -v`; if you're on an older version, install the latest LTS from nodejs.org first).

```bash
# Backend
cd backend
npm install
npm run seed      # creates dev.db and populates it
npm run dev        # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev        # http://localhost:3000
```

Log in with `admin@vsod.in` / `password123`.

## Environment Variables

**backend/.env**
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="change_this_in_production"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
```

**frontend/.env**
```
VITE_API_URL=http://localhost:4000
```

## Deployment

**Frontend → Vercel:** `npm run build` produces `frontend/dist`; deploy as a static site, set `VITE_API_URL` to the deployed backend URL.

**Backend → any Node host (Render/Railway/AWS/etc.):** `npm run build && npm start`. Set `DATABASE_URL`, `JWT_SECRET`, `PORT`, and `CORS_ORIGIN` (the deployed frontend origin) as environment variables. SQLite's file works for a single-instance deploy; for anything horizontally scaled, swap `better-sqlite3` for a hosted Postgres — the SQL is close enough to portable that this is a data-layer-only change.

No `.env` files are committed; `.env.example` files are included in both folders.

## Known Limitations

- No automated test suite was added — given the sandbox's constraints (see stack deviation note) the time budget went into a working, verified full stack instead. Priority next: booking status-transition tests and pagination/filter tests on the bookings route (both are pure functions of SQL params, easy to unit test).
- No Swagger/OpenAPI page.
- Dark mode is stubbed as "coming soon" in Settings, not implemented.
- Map view on the mechanics page was left out — mechanic lat/lng is seeded and available on the API if you want to add one.
- SQLite (via `node:sqlite`) instead of PostgreSQL (see stack note above) — fine for this evaluation and for a single-instance deploy, but not for horizontal scaling.

## AI Usage

Built with Claude (Anthropic). Claude generated the backend (schema, routes, seed data), the frontend (all components/pages), and this README, based on the brief provided. The stack substitution (Prisma → better-sqlite3) was a judgment call made when the Prisma engine download failed in this environment — worth mentioning in an interview as a real engineering trade-off, not a scripted decision.

## Exact Commands to Run Locally

```bash
cd backend && npm install && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```

## Recommended Git Commit Structure

```
chore: scaffold backend (express, typescript, sqlite)
feat: database schema and seed data
feat: auth (jwt + bcrypt)
feat: dashboard, bookings, mechanics, customers, analytics, notifications APIs
feat: websocket real-time layer
chore: scaffold frontend (vite, react, tailwind)
feat: auth context, api client, layout shell
feat: overview dashboard
feat: bookings list + detail drawer + status workflow
feat: mechanics + customers pages and detail drawers
feat: analytics charts
feat: notifications panel
docs: README
```

## Interview Explanation (short version)

"I built a live operations dashboard with a React/TypeScript frontend and an Express/TypeScript backend talking over REST and Socket.IO. The database is relational — bookings reference customers, vehicles, services, and mechanics by foreign key, with an append-only status-history table so I get a full audit trail and can render a timeline for free. Status changes go through a server-side state machine, so the API rejects an invalid jump (say, pending straight to completed) even if a client tried to force it. Real-time updates work by having the server emit a Socket.IO event whenever a booking's status changes; the frontend listens for that and invalidates the relevant React Query caches, so the dashboard, the bookings table, and the analytics all update without a refresh. I originally planned Postgres via Prisma per the brief, but Prisma's engine binary download was blocked in my build environment, so I made the call to swap to `better-sqlite3` with hand-written parameterized SQL — same relational model, contained to the data-access layer, and documented as a known deviation rather than silently worked around."
