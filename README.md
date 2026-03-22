# TransitOps — Smart Bus Admin Dashboard

Next.js 14 admin dashboard for the Smart Public Transport Tracking & Density Prediction system.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure API URL
cp .env.local.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL to your FastAPI backend

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your admin credentials.

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Admin authentication |
| `/dashboard` | Fleet overview, KPIs, charts |
| `/analytics` | Deep analytics, ETA model comparison |
| `/vehicles` | Vehicle registration & management |
| `/routes` | Routes and bus stops |
| `/assignments` | Start/end driver-vehicle-route trips |
| `/drivers` | Create driver and admin accounts |
| `/settings` | ML model training, ETA mode toggle, data cleanup |

## Tech Stack

- **Next.js 14** — App Router, TypeScript
- **Tailwind CSS** — Dark design system
- **Recharts** — Dashboard charts
- **Axios** — API client with JWT interceptors
- **Lucide React** — Icons

## Backend

Connects to the FastAPI backend (`backend/`). Set `NEXT_PUBLIC_API_URL` in `.env.local`.

## Authentication

JWT-based. Login at `/login`. The token is stored in `localStorage` and attached to all API requests automatically.
Requires an admin account (created via `backend/docs/IMPLEMENTATION.md`).
