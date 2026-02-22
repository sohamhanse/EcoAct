# Community Admin Dashboard (Web Only)

This project now includes a dedicated web admin dashboard at `admin-web/` for community administrators.

## Scope

- Web only (separate from React Native app flow)
- Community admin login (demo in dev)
- Community KPI overview + time series analytics
- Event management (create/update/publish/archive/delete)
- Quiz management (create/update/publish/archive/delete)
- Quiz analytics (attempts, score, top/bottom questions, leaderboard)

## Run

### 1. API server

```bash
cd server
npm install
npm run dev
```

### 2. Seed data (recommended)

```bash
cd server
npm run seed
```

Seed creates:
- default admin user: `admin@ecoact.app`
- sample events and quiz for the admin community

### 3. Admin web app

```bash
cd admin-web
npm install
npm run dev
```

Open `http://localhost:5174`.

## Env

`admin-web/.env`

```bash
VITE_API_BASE_URL=http://localhost:5000
```

Backend env in `server/.env`:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ALLOW_DEMO_AUTH=true` (for demo admin login outside production)

## API Surface

### Auth

- `POST /api/admin/auth/demo-login`
- `GET /api/admin/auth/me`

### Stats

- `GET /api/admin/community/:communityId/stats/overview?from&to`
- `GET /api/admin/community/:communityId/stats/timeseries?from&to&granularity=daily|weekly|monthly`

### Events

- `GET /api/admin/community/:communityId/events`
- `POST /api/admin/community/:communityId/events`
- `GET /api/admin/community/:communityId/events/:eventId`
- `PATCH /api/admin/community/:communityId/events/:eventId`
- `DELETE /api/admin/community/:communityId/events/:eventId`
- `POST /api/admin/community/:communityId/events/:eventId/publish`
- `POST /api/admin/community/:communityId/events/:eventId/archive`

### Quizzes

- `GET /api/admin/community/:communityId/quizzes`
- `POST /api/admin/community/:communityId/quizzes`
- `GET /api/admin/community/:communityId/quizzes/:quizId`
- `PATCH /api/admin/community/:communityId/quizzes/:quizId`
- `DELETE /api/admin/community/:communityId/quizzes/:quizId`
- `POST /api/admin/community/:communityId/quizzes/:quizId/publish`
- `POST /api/admin/community/:communityId/quizzes/:quizId/archive`
- `GET /api/admin/community/:communityId/quizzes/:quizId/analytics`

## RBAC

- Admin endpoints require Bearer token.
- Community endpoints require:
  - authenticated user
  - `role === "admin"`
  - `user.communityId` matches route `:communityId`

Implemented in: `server/src/middleware/communityAdmin.middleware.ts`.
