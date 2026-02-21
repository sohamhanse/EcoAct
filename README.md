# EcoTrack

React Native (Expo) + Node.js full-stack app that tracks and rewards individual and community-level environmental actions. Built for hackathon demo with MongoDB, JWT auth, carbon calculator, missions, leaderboards, and communities.

## Stack

- **App:** React Native (Expo SDK 54), TypeScript, React Navigation (Stack + Bottom Tabs), Zustand, Axios
- **API:** Node.js, Express, MongoDB (Mongoose), JWT (access + refresh), Google OAuth (optional), demo auth for dev
- **Design:** Centralized colors, spacing, radius, shadows; 8-step carbon calculator; mission completion with points/streaks/badges

## Quick start

### 1. Backend

From the project root, run **each command separately** in a normal system terminal:

```bash
cd server
npm install
npm run dev
```

A `server/.env` file exists; edit it to set `MONGODB_URI`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` if needed. Optional seed (in another terminal): `cd server && npm run seed`.

If you get **`ENOENT spawn sh`**, run from the `server` folder:  
`node run-server.cjs` (and `node run-seed.cjs` to seed).

### 2. App

```bash
npm install
npm start
```

Use **Demo login** on the Auth screen if the server is running (no Google config required). Set `EXPO_PUBLIC_API_URL` (e.g. `http://YOUR_IP:5000`) when testing on a device.

## App flow

1. **Splash** → auth check → **Onboarding** (3 slides) → **Auth** (Google or Demo login)
2. **Main** (tabs): **Home** (footprint, stats, today’s missions, community) | **Calculator** (8-step wizard, save baseline) | **Missions** (filter, complete, modal) | **Leaderboard** (global / community / weekly) | **Profile** (badges, history, sign out)
3. **Community** (stack): Discover / My community, join or leave

## Project layout

- `server/` — Express API, Mongoose models, auth, calculator, missions, leaderboard, community, seed
- `app/screens/` — Onboarding, Auth, Home, Calculator, Missions, Leaderboard, Community, Profile
- `api/` — Axios instance (JWT attach + refresh), auth, calculator, missions, leaderboard, community
- `store/` — Zustand: useAuthStore, useUserStore, useMissionStore, useCommunityStore
- `constants/` — colors, typography, spacing, radius, shadows, emission factors + calculator
- `navigation/` — AppNavigator (Splash/Onboarding/Auth/Main), MainNavigator (Tabs + Community), BottomTabNavigator

## API (high level)

- `POST /api/auth/google` (idToken) or `POST /api/auth/demo` (dev)
- `POST /api/calculator/submit`, `GET /api/calculator/history` | `/latest`
- `GET /api/missions`, `GET /api/missions/recommended`, `POST /api/missions/:id/complete`
- `GET /api/leaderboard/global` | `/community/:id` | `/weekly`
- `GET /api/community`, `GET /api/community/mine`, `POST /api/community/:id/join`, `POST /api/community/leave`

See `server/README.md` for full endpoint list and env vars.

## Validate

```bash
npm run lint
npx tsc --noEmit
```
