import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

// Required for web browser auth session to dismiss properly
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_ISSUER = "https://accounts.google.com";

/**
 * Get a redirect URI for the current app (works in Expo Go and standalone).
 * In Google Cloud Console, add this URI to "Authorized redirect URIs" for your Web client.
 * For Expo Go: use the redirect URL shown in the console when you run the app.
 */
export function makeRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: "ecoact",
    path: "redirect",
  });
}

/**
 * Exchange authorization code for tokens. Google returns id_token when openid scope was requested.
 */
export async function exchangeCodeForIdToken(
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier: string,
  discovery: AuthSession.DiscoveryDocument | null
): Promise<string | null> {
  if (!discovery?.tokenEndpoint) return null;

  const response = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri,
      extraParams: {
        code_verifier: codeVerifier,
      },
    },
    discovery
  );

  // Google includes id_token in the token response when openid scope is used
  const r = response as { idToken?: string; id_token?: string; params?: { id_token?: string } };
  return r.idToken ?? r.id_token ?? r.params?.id_token ?? null;
}

export { GOOGLE_ISSUER };
