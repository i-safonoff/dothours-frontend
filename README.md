# .hours — frontend

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-0055FF?logo=framer&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

Mobile-shaped React frontend for **.hours**, a time tracker that turns tracked
hours into a city and lets friends push each other through shared goals.
Warm-white, dot-grid, bold-primitive-shapes visual style; Framer Motion for
the animated bits (spring taps, progress rings, staggered lists, bottom
sheets).

Talks to the [FastAPI backend](https://github.com/i-safonoff/dothours) over
REST and a WebSocket — see that repo for the API and how to run it locally.

## Stack

- React 19 + TypeScript + Vite
- Framer Motion
- Plain `fetch` API client (`src/api/`), no state-management library — the
  screens are simple enough that `useState`/`useEffect` carry it fine
- A thin WebSocket layer (`src/api/realtime.ts`, `RealtimeContext.tsx`) fans
  realtime events out to whichever screen wants them

## Quickstart

Requires the backend running locally (see its README — `docker compose up`
gets you Postgres, Redis, and the API on `:8000`).

```bash
npm install
cp .env.example .env   # VITE_API_URL, defaults to http://localhost:8000/api/v1
npm run dev
```

Opens on `http://localhost:5173`. The layout is mobile-first and looks best
resized to a phone viewport (~375×812) in devtools.

### Build & lint

```bash
npm run build   # tsc -b && vite build
npm run lint     # oxlint
```

## Project layout

```
src/
  api/            fetch client, typed endpoints, AuthContext, realtime WebSocket layer
  components/     shared UI (Shape, Building, ProgressRing, BottomSheet, TabBar,
                  NotificationBell, CompanyDetail, ...)
  screens/        one screen per route (Onboarding, Auth, Tracker, City, Friends,
                  PairedTasks, Companies, Feed, Profile, GoalSelect)
  data/           building-family metadata (colors/shapes/titles per category)
```

## What's wired to the real API

Everything the backend exposes has a screen:

- **Auth** — register/login/JWT
- **Categories, tracker** — start/stop timer, manual entries, live daily summary
- **Personal city** — buildings leveling up from tracked hours
- **Friends** — requests, accept/decline, add by email
- **Paired tasks** — create, join, log time toward a shared goal
- **Feed & profiles** — post, like, comment, public profiles
- **Companies** — create, join by invite code, roles (owner/admin/member),
  a shared company city, member management, invite generation
- **World leaderboard** — all-time/weekly/monthly company rankings
- **Notifications** — an in-app inbox with a live unread badge
- **Realtime** — one WebSocket connection per session pushes timer, city,
  friend, paired-task, and notification events; City, Friends, Paired Tasks,
  and the notification badge all update live instead of only on the next
  manual pull

The isometric city layout (districts, per-building coordinates) is backend
metadata the UI doesn't visualize yet — the existing card-grid city view
covers the same information without a geometry rewrite.
