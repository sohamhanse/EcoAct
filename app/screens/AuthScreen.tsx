import { setTokens } from "@/api/axiosInstance";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { GOOGLE_ISSUER, exchangeCodeForIdToken, makeRedirectUri } from "@/services/googleAuth";
import type { ApiUser } from "@/src/types";
import { useAuthStore } from "@/store/useAuthStore";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";
import * as AuthSession from "expo-auth-session";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000";
const API_DEMO_URL = `${API_BASE}/api/auth/demo`;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

export default function AuthScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const discovery = AuthSession.useAutoDiscovery(GOOGLE_ISSUER);
  const redirectUri = makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID,
      redirectUri,
      scopes: ["openid", "email", "profile"],
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery ?? undefined
  );

  // After user returns from Google, exchange code for id_token and sign in
  useEffect(() => {
    if (!response || response.type !== "success" || !request || !discovery) return;
    const { code } = response.params;
    if (!code || !request.codeVerifier) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const idToken = await exchangeCodeForIdToken(
          code,
          GOOGLE_WEB_CLIENT_ID,
          redirectUri,
          request.codeVerifier,
          discovery
        );
        if (cancelled || !idToken) {
          setError("Could not get Google sign-in token. Try again or use Demo login.");
          return;
        }
        await useAuthStore.getState().loginWithGoogle(idToken);
        if (!cancelled) navigation.replace("Main");
      } catch (e) {
        if (!cancelled) {
          const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Google sign-in failed";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [response, request, discovery, redirectUri, navigation]);

  async function handleDemoLogin() {
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post<{ success: boolean; accessToken?: string; refreshToken?: string; user?: ApiUser }>(
        API_DEMO_URL,
        { name: "Demo User", email: `demo-${Date.now()}@ecoact.app` },
      );
      if (data.success && data.accessToken && data.refreshToken && data.user) {
        await setTokens(data.accessToken, data.refreshToken);
        useAuthStore.getState().setUser(data.user);
        navigation.replace("Main");
      } else {
        setError("Demo login failed.");
      }
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Network error";
      const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
      setError(msg);
      const hint =
        code === "ECONNREFUSED" || msg.toLowerCase().includes("network")
          ? `Server not reachable at ${API_BASE}. Start it from the server folder: node run-server.cjs. On a device, set EXPO_PUBLIC_API_URL to your computer IP (e.g. http://192.168.1.x:5000).`
          : msg;
      Alert.alert("Connection error", hint);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!GOOGLE_WEB_CLIENT_ID?.trim()) {
      setError("Google sign-in not configured. Use Demo login or set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.");
      return;
    }
    if (!request) {
      setError("Sign-in is still loading. Try again in a moment.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await promptAsync();
      if (result.type === "dismiss" || result.type === "cancel") {
        setError("");
      } else if (result.type !== "success") {
        setError("Google sign-in was cancelled or failed.");
      }
      // If success, the useEffect above will exchange the code and sign in
    } catch (e) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Google sign-in failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to EcoAct</Text>
        <Text style={styles.subtitle}>Sign in to track your footprint and earn rewards.</Text>

        <Pressable
          style={[styles.googleButton, loading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.googleButtonLabel}>Continue with Google</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.demoButton, loading && styles.buttonDisabled]}
          onPress={handleDemoLogin}
          disabled={loading}
        >
          <Text style={styles.demoButtonLabel}>Demo login (dev)</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.base,
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: SPACING.xl,
  },
  googleButton: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.md,
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  demoButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  googleButtonLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  demoButtonLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  error: {
    color: COLORS.danger,
    fontSize: 13,
    marginTop: SPACING.sm,
  },
});
