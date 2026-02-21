# EcoAct (React Native / Expo)

EcoAct is a sustainability engagement MVP inspired by the UN ActNow model.
It includes:

- Carbon footprint calculator with lifestyle questionnaire
- Action missions with estimated CO2 savings
- Gamification (points, streaks, badges)
- User accounts (email + Google demo mode)
- Persistent dashboard and profile progress

## Tech Stack

- Expo + React Native + Expo Router
- TypeScript
- Zustand + AsyncStorage persistence

## MVP Features

### 1) Carbon Footprint Calculator

- Inputs: transport, food, home energy, shopping behavior
- Estimation logic with emission factors in `features/carbon/emissionFactors.ts`
- Annual result + category breakdown and personalized focus tips

### 2) Action Missions

- Predefined mission library in `features/missions/missionList.ts`
- Each mission has expected CO2 savings and points
- Mission completion tracked per day

### 3) Gamification

- Points awarded per mission
- Daily streak logic
- Badge unlocks based on milestones

### 4) User Accounts and Dashboard

- Login with email or Google demo mode
- Persisted user session and progress
- Dashboard with baseline footprint, reductions, and progress

## Project Structure

- `app/auth.tsx`: login flow
- `app/(tabs)/index.tsx`: dashboard
- `app/(tabs)/calculator.tsx`: calculator questionnaire and results
- `app/(tabs)/missions.tsx`: missions and completion tracking
- `app/(tabs)/profile.tsx`: account, badges, reset/sign-out
- `store/useAuthStore.ts`: auth session state
- `store/useCarbonStore.ts`: carbon baseline and breakdown
- `store/useMissionStore.ts`: mission completion, points, badges, streaks

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start Expo:

```bash
npm run start
```

3. Open on device/simulator from Expo CLI options.

## Validation

```bash
npm run lint
npx tsc --noEmit
```

## Next Steps for Production

1. Replace Google demo mode with real OAuth (`expo-auth-session` or Firebase Auth).
2. Add backend API for multi-device sync, organization challenges, and leaderboard.
3. Version emission factors by region and source dataset.
4. Add event analytics and experiment flags for engagement optimization.
5. Add notifications/reminders for daily streak retention.
