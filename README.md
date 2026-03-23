# BusTrack Admin Dashboard v2.0

> Real-time public transport tracking, density prediction & fleet management — Admin UI

![Next.js](https://img.shields.io/badge/Next.js-15.3-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)

---

## Overview

BusTrack Admin is the administrative frontend for the Smart Public Transport Tracking & Density Prediction system serving Addis Ababa. It connects to a FastAPI backend and provides real-time fleet management, ML model controls, and live telemetry monitoring.

### Design System

| Mode  | Theme                                              |
|-------|----------------------------------------------------|
| Dark  | Pure black (`#000`) + neon cyan/green accents      |
| Light | Clean white (`#fff`) + electric blue accents       |

**Typography**: Space Grotesk (headings) + Inter (body) + JetBrains Mono (code/data)

---

## Features

| Page             | Description                                                   |
|------------------|---------------------------------------------------------------|
| `/dashboard`     | Live KPI cards, ETA accuracy bars, auto-refreshing charts     |
| `/analytics`     | Deep analytics, ML vs heuristic comparison, period selector   |
| `/vehicles`      | Fleet registry, register buses with SIM7600 IMEI              |
| `/routes`        | Route & stop management, GPS coordinates, dwell time          |
| `/assignments`   | Live driver trip monitoring, force-end capability             |
| `/users`         | Create driver/admin accounts (passengers use mobile app)      |
| `/settings`      | ML model training, ETA mode toggle, data retention cleanup    |
| AI Assistant     | Built-in chatbot (neon styled, Gemini-powered)                |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000   # Your FastAPI backend URL
GEMINI_API_KEY=your_key_here               # Optional: for AI chatbot
```

### 3. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

### 4. Login

Create an admin user in your backend first (see [Backend Setup](#backend-setup)), then log in with those credentials.

---

## Backend Setup

The dashboard requires the FastAPI backend running at `NEXT_PUBLIC_API_URL`.

### Create first admin

```python
from app.db.session import AsyncSessionLocal
from app.crud.user import create_user
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"]).hash("admin123")
async with AsyncSessionLocal() as db:
    await create_user(db, "admin", "admin@example.com", pwd, "admin")
    await db.commit()
```

### Start backend

```bash
# From backend/ directory
docker-compose up -d        # Start PostgreSQL + Redis
alembic upgrade head        # Run migrations
uvicorn app.main:app --reload
```

---

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts          # Gemini AI proxy endpoint
│   ├── dashboard/page.tsx         # Fleet overview
│   ├── analytics/page.tsx         # Deep analytics
│   ├── vehicles/page.tsx          # Vehicle management
│   ├── routes/page.tsx            # Routes & stops
│   ├── assignments/page.tsx       # Live assignments
│   ├── users/page.tsx             # User management
│   ├── settings/page.tsx          # ML & system settings
│   ├── login/page.tsx             # Auth page
│   ├── globals.css                # Design tokens & component styles
│   └── layout.tsx                 # Root layout with providers
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx            # Collapsible navigation
│   │   ├── Topbar.tsx             # Header with theme toggle
│   │   └── AppShell.tsx           # Auth-protected wrapper
│   ├── ui/
│   │   ├── StatCard.tsx           # KPI metric cards
│   │   ├── DataTable.tsx          # Sortable, searchable table
│   │   └── Spinner.tsx            # Loading states
│   ├── charts/
│   │   └── Charts.tsx             # Area, Bar, Pie, Horizontal bar
│   └── chatbot/
│       └── ChatBot.tsx            # AI assistant (neon FAB)
│
├── hooks/
│   ├── useAuth.tsx                # JWT auth context
│   ├── useTheme.tsx               # Dark/light theme
│   └── useSidebar.tsx             # Sidebar collapse state
│
├── lib/
│   └── api.ts                     # Axios client + all API calls
│
└── types/
    └── index.ts                   # TypeScript interfaces
```

---

## Design Tokens

### Dark Mode (default)
```css
--bg:     #000000     /* Pure black base */
--neon:   #00ffb4     /* Primary neon green */
--cyan:   #00e5ff     /* Secondary cyan */
--purple: #9b5de5     /* Accent purple */
--amber:  #ffb700     /* Warning amber */
--red:    #ff4444     /* Danger red */
--green:  #00ff88     /* Success green */
```

### Light Mode
```css
--bg:     #ffffff     /* Pure white */
--neon:   #0078ff     /* Electric blue (replaces neon green) */
--cyan:   #0099cc     /* Deep cyan */
```

---

## Key Components

### DataTable
Fully sortable, searchable paginated table with action menus.

```tsx
<DataTable<MyType>
  data={items}
  columns={cols}
  searchPlaceholder="Search…"
  searchKeys={["name", "email"]}
  pageSize={10}
  onAdd={() => setShowModal(true)}
  addLabel="New Item"
/>
```

### StatCard
KPI metric card with accent colors.

```tsx
<StatCard
  title="Active Trips"
  value={42}
  subtitle="Live now"
  icon={<Radio size={17} />}
  accent="green"
/>
```

Accent options: `neon` | `cyan` | `purple` | `amber` | `red` | `green`

### ChatBot
AI assistant using Gemini. Shows neon FAB button, expands to chat panel. Configured with BusTrack-specific system prompt. Requires `GEMINI_API_KEY`.

---

## API Integration

All API calls go through `src/lib/api.ts`. JWT token stored in `localStorage` and injected via Axios interceptor.

### Available API services

```typescript
authApi.login(username, password)
authApi.me()

dashboardApi.summary()
dashboardApi.assignmentsOverTime(days)
dashboardApi.occupancyDistribution()
dashboardApi.etaAccuracy()
dashboardApi.routeUsage(days)
dashboardApi.telemetryVolume()

vehiclesApi.list()
vehiclesApi.create(data)

routesApi.list()
routesApi.create(data)
routesApi.listStops()
routesApi.createStop(data)

usersApi.createAdmin(data)

adminApi.mlStatus()
adminApi.trainModel()
adminApi.cleanup()
adminApi.getSettings()
adminApi.updateSettings(useMl)

assignmentsApi.start(driverId, vehicleId, routeId)
assignmentsApi.end(assignmentId)
```

---

## Build & Deploy

### Production build

```bash
npm run build
npm start
```

### Environment variables

| Variable                | Required | Description                    |
|-------------------------|----------|--------------------------------|
| `NEXT_PUBLIC_API_URL`   | Yes      | FastAPI backend base URL       |
| `GEMINI_API_KEY`        | No       | Google Gemini API key          |

---

## Backend API Reference

All endpoints under `/api/v1`:

| Method | Path                                  | Auth    | Description                    |
|--------|---------------------------------------|---------|--------------------------------|
| POST   | `/auth/login`                         | —       | JWT login                      |
| GET    | `/auth/me`                            | Bearer  | Current user profile           |
| GET    | `/admin/dashboard/summary`            | Admin   | Fleet KPI counts               |
| GET    | `/admin/dashboard/assignments-over-time` | Admin | Assignments per day          |
| GET    | `/admin/dashboard/occupancy-distribution` | Admin | Occupancy levels pie        |
| GET    | `/admin/dashboard/eta-accuracy`       | Admin   | Heuristic vs ML MAE            |
| GET    | `/admin/dashboard/route-usage`        | Admin   | Trips per route                |
| GET    | `/admin/dashboard/telemetry-volume`   | Admin   | GPS pings per hour             |
| POST   | `/vehicles`                           | Admin   | Register vehicle               |
| GET    | `/vehicles`                           | —       | List vehicles                  |
| POST   | `/routes`                             | Admin   | Create route                   |
| POST   | `/stops`                              | Admin   | Create bus stop                |
| POST   | `/assignments/start`                  | Driver  | Start trip                     |
| POST   | `/assignments/end`                    | Driver  | End trip                       |
| POST   | `/create`                             | Admin   | Create driver/admin user       |
| GET    | `/admin/ml/status`                    | Admin   | ML model status                |
| POST   | `/admin/ml/train`                     | Admin   | Trigger model retraining       |
| POST   | `/admin/cleanup`                      | Admin   | Run data retention cleanup     |
| GET    | `/admin/settings`                     | Admin   | Get runtime settings           |
| PUT    | `/admin/settings`                     | Admin   | Toggle ML mode                 |
| GET    | `/api/v1/ws/live`                     | —       | WebSocket live bus updates     |

---

## ML System

### ETA Pipeline

```
Request → Check USE_ML_FOR_PROD flag
  ├── false → Heuristic (haversine + dwell × peak_multiplier × occupancy_factor)
  └── true  → ML Model (RandomForest: stop_id, hour, day_of_week, is_peak, occupancy)
Both run in parallel and are logged to model_performance for comparison.
```

### Training requirements
- Minimum **50 rows** in `trip_history` with `heuristic_eta` and `actual_travel_time`
- Model saved to `app/services/delay_predictor.joblib`
- Trigger via **Settings → Train Model** button or `POST /admin/ml/train`

---

## Hardware Integration

| Hardware    | Role                                            |
|-------------|-------------------------------------------------|
| SIM7600     | GPS/GSM — sends lat/lon to `/api/v1/telemetry` |
| ESP32-CAM   | Camera — sends `pixel_count` for density       |

### Occupancy levels
```
0 = Low    → pixel_count < 3000
1 = Medium → pixel_count 3000–7000
2 = High   → pixel_count > 7000
```

GPS outlier rejection: last 5 coordinates buffered in Redis; spikes >500m rejected.

---

## License

MIT © 2025 BusTrack
