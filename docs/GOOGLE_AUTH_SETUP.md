# Google Sign-In Setup

EcoAct uses Google OAuth (OpenID Connect) so users can sign in with their Google account. The app uses the **authorization code flow with PKCE** (no client secret), and the backend verifies the **id_token** from Google.

## 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. Enable **Google+ API** or **Google Identity** (APIs & Services → Library → search "Google Identity").
3. Go to **APIs & Services → Credentials** and create an **OAuth 2.0 Client ID**.
4. Choose **Web application** as the application type.
5. Add **Authorized redirect URIs**:
   - **Development (Expo Go):** Run the app once and check the console for the redirect URL, or use:
     - `https://auth.expo.io/@YOUR_EXPO_USERNAME/ecoact`
   - **Standalone / custom scheme:** `ecoact://redirect`
6. Copy the **Client ID** (it looks like `xxxxx.apps.googleusercontent.com`).

## 2. Backend (server)

In `server/.env`:

```env
GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
```

This is the **same** Web application Client ID from step 1. The server uses it to verify the id_token sent by the app.

## 3. Frontend (app)

Set the same Client ID for the app so it can start the OAuth flow:

**Option A – `.env` in the project root (create if missing):**

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
```

**Option B – EAS / build env:**

Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in your EAS environment or build config.

Restart the Expo dev server after changing env vars.

## 4. Redirect URI in development

When you run `npx expo start` and open the app, the redirect URI might be:

- **Expo Go:** `https://auth.expo.io/@your-username/ecoact`
- **Dev client / standalone:** `ecoact://redirect`

Add the one you use to **Authorized redirect URIs** in the Google Cloud OAuth client.

## 5. Demo login

If `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is not set, the **Continue with Google** button still works: tapping it shows a message to use **Demo login (dev)** instead. Demo login does not require Google and is intended for local development.
