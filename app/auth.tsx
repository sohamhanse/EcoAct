import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuthStore } from "@/store/useAuthStore";
import type { AuthProvider } from "@/types/app";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
  const router = useRouter();
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  if (!hydrated) {
    return <View style={styles.container} />;
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  function submit(provider: AuthProvider) {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setError("Please enter your name.");
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    login(provider, trimmedName, trimmedEmail);
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboard}
    >
      <View style={styles.container}>
        <Text style={styles.title}>EcoAct</Text>
        <Text style={styles.subtitle}>
          Build sustainable habits, track your footprint, and measure your progress.
        </Text>

        <TextInput
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError("");
          }}
          placeholder="Full name"
          autoCapitalize="words"
          style={styles.input}
        />

        <TextInput
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError("");
          }}
          placeholder="Email address"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={() => submit("email")}>
          <Text style={styles.primaryButtonLabel}>Continue with email</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => submit("google")}>
          <Text style={styles.secondaryButtonLabel}>Continue with Google</Text>
        </Pressable>

        <Text style={styles.note}>
          Google login is configured as demo-mode in this MVP and can be swapped with OAuth later.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#14532d",
  },
  subtitle: {
    fontSize: 15,
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0f172a",
  },
  error: {
    color: "#b91c1c",
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: "#15803d",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#15803d",
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryButtonLabel: {
    color: "#166534",
    fontSize: 15,
    fontWeight: "600",
  },
  note: {
    marginTop: 8,
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
  },
});
