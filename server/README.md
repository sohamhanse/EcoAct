# EcoAct API

Node.js + Express + MongoDB backend for EcoAct.

## Setup

1. **Env:** A `.env` file exists (edit if needed). Set:
   - `MONGODB_URI` (e.g. MongoDB Atlas or `mongodb://localhost:27017/ecoact`)
   - `JWT_SECRET` and `JWT_REFRESH_SECRET` (min 32 chars each for production)
   - `PORT` (default 5000)

2. **Install and run** (run each command separately in a normal system terminal):

```bash
cd server
npm install
npm run dev
```

3. **Seed the database** (optional, in another terminal):

```bash
cd server
npm run seed
```

**If you see `ENOENT spawn sh`** when running `npm run dev` or `npm run seed`, run without npm (from the `server` directory, after `npm install`):

```bash
# Run server (builds then starts, no shell needed)
node run-server.cjs

# Seed once
node run-seed.cjs
```

## Endpoints

- `POST /api/auth/google` — Google OAuth (body: `{ idToken }`)
- `POST /api/auth/demo` — Demo login (dev only; body: `{ name?, email? }`)
- `POST /api/auth/refresh` — Refresh access token
- `GET /api/auth/me` — Current user (Bearer token)
- `POST /api/calculator/submit` — Submit footprint (Bearer)
- `GET /api/calculator/history` | `/calculator/latest` — Footprint history (Bearer)
- `GET /api/missions` — List missions (query: category, difficulty)
- `GET /api/missions/recommended` — Recommended missions (Bearer)
- `POST /api/missions/:id/complete` — Complete mission (Bearer)
- `GET /api/leaderboard/global` | `/leaderboard/weekly` | `/leaderboard/community/:id`
- `GET /api/community` — List communities (query: type, search)
- `GET /api/community/mine` — My community (Bearer)
- `POST /api/community/:id/join` | `POST /api/community/leave` — Join/leave (Bearer)

### Admin dashboard endpoints (Web only)

- `POST /api/admin/auth/demo-login` — Demo admin login (dev only)
- `GET /api/admin/auth/me` — Current admin user (Bearer)
- `GET /api/admin/community/:communityId/stats/overview` — KPI overview (Bearer + community admin)
- `GET /api/admin/community/:communityId/stats/timeseries` — Time-series analytics (Bearer + community admin)
- `GET /api/admin/community/:communityId/events` — List events
- `POST /api/admin/community/:communityId/events` — Create event
- `GET /api/admin/community/:communityId/events/:eventId` — Event detail
- `PATCH /api/admin/community/:communityId/events/:eventId` — Update event
- `DELETE /api/admin/community/:communityId/events/:eventId` — Delete event
- `POST /api/admin/community/:communityId/events/:eventId/publish` — Publish event
- `POST /api/admin/community/:communityId/events/:eventId/archive` — Archive event
- `GET /api/admin/community/:communityId/quizzes` — List quizzes
- `POST /api/admin/community/:communityId/quizzes` — Create quiz
- `GET /api/admin/community/:communityId/quizzes/:quizId` — Quiz detail
- `PATCH /api/admin/community/:communityId/quizzes/:quizId` — Update quiz
- `DELETE /api/admin/community/:communityId/quizzes/:quizId` — Delete quiz
- `POST /api/admin/community/:communityId/quizzes/:quizId/publish` — Publish quiz
- `POST /api/admin/community/:communityId/quizzes/:quizId/archive` — Archive quiz
- `GET /api/admin/community/:communityId/quizzes/:quizId/analytics` — Quiz analytics
