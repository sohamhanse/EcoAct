# EcoAct MVP (Expo)

React Native (Expo) sustainability engagement app implementing:

- Splash -> Onboarding -> Auth -> Baseline questionnaire -> Baseline result -> Daily dashboard loop
- Local-only persistence with AsyncStorage
- Carbon baseline engine + daily quick logs + monthly utility updates
- Personalized daily mission pool (easy/medium/hard)
- Gamification: points, streaks, bonuses, badges

## App Flow

1. Splash (2.5s) with animated logo and auth state routing
2. Onboarding intro
3. Authentication
   - Google sign-in (local MVP OAuth-style simulation)
   - Manual signup with validation
4. Baseline setup (10-step questionnaire)
5. Baseline result screen with pie chart and India comparison
6. Dashboard core loop:
   - Daily quick log popup
   - Monthly utility update prompt on day 1
   - Mission completion and live impact progress

## Service Modules

- `app/services/authService.ts`
- `app/services/carbonCalculationService.ts`
- `app/services/missionRecommendationEngine.ts`
- `app/services/streakEngine.ts`
- `app/services/pointsEngine.ts`
- `app/services/badgeEngine.ts`
- `app/services/analyticsService.ts`

## Run

```bash
npm install
npm run start
```

## Validate

```bash
npm run lint
npx tsc --noEmit
```
