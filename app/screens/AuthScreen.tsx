import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import axios from "axios";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { useAuthStore } from "@/store/useAuthStore";
import { setTokens } from "@/api/axiosInstance";
import type { ApiUser } from "@/src/types";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000";
const API_DEMO_URL = `${API_BASE}/api/auth/demo`;

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

export default function AuthScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDemoLogin() {
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post<{ success: boolean; accessToken?: string; refreshToken?: string; user?: ApiUser }>(
        API_DEMO_URL,
        { name: "Demo User", email: `demo-${Date.now()}@ecotrack.app` },
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
    // When @react-native-google-signin/google-signin is configured:
    // const { idToken } = await GoogleSignin.getTokens(); await loginWithGoogle(idToken);
    await handleDemoLogin();
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to EcoTrack</Text>
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
