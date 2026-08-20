# .hours — frontend

Mobile-shaped React frontend for **.hours**, a time tracker that turns tracked
hours into a city and lets friends push each other through shared goals.
Warm-white, dot-grid, bold-primitive-shapes visual style; Framer Motion for
the animated bits (spring taps, progress rings, staggered lists, bottom
sheets).

Talks to the [FastAPI backend](https://github.com/i-safonoff/dothours) over
REST — see that repo for the API and how to run it locally.

## Stack

- React 19 + TypeScript + Vite
- Framer Motion
- Plain `fetch` API client (`src/api/`), no state-management library — the
  screens are simple enough that `useState`/`useEffect` carry it fine

## Quickstart

Requires the backend running locally (see its README — `docker compose up`
gets you Postgres + API on `:8000`).

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
  api/            fetch client, typed endpoints, AuthContext
  components/     shared UI (Shape, Building, ProgressRing, BottomSheet, TabBar, ...)
  screens/        one screen per route (Onboarding, Auth, Tracker, City, Friends, PairedTasks, GoalSelect)
  data/           building-family metadata (colors/shapes/titles per category)
```

## What's wired to the real API

Auth (register/login/JWT), categories, start/stop timer with live daily
summary, personal city (buildings leveling up from tracked hours), friends
(request/accept, add by email), and paired tasks (create, join, log time
toward a shared goal). Companies and the global leaderboard aren't built yet
on the backend, so there's no UI for them here either.
