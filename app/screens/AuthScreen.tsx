import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { RootStackParamList } from "../../App";
import { useCarbonContext } from "../context/CarbonContext";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

export default function AuthScreen({ navigation }: Props) {
  const { signInWithGoogle, signUpManual, state } = useCarbonContext();

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function handleGoogleSignIn() {
    setError("");
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
      navigation.replace(state.baselineResult ? "Dashboard" : "BaselineQuestionnaire");
    } finally {
      setLoadingGoogle(false);
    }
  }

  function handleManualSignup() {
    setError("");

    const result = signUpManual({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!result.ok) {
      setError(result.error ?? "Sign-up failed.");
      return;
    }

    navigation.replace("BaselineQuestionnaire");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Authentication</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Option A - Google Sign-In</Text>
        <Text style={styles.helper}>
          OAuth-style flow is modeled locally in this MVP and auto-fills a Google profile.
        </Text>

        <Pressable style={styles.googleButton} onPress={handleGoogleSignIn} disabled={loadingGoogle}>
          {loadingGoogle ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.googleButtonLabel}>Continue with Google</Text>}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Option B - Manual Sign-Up</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Text style={styles.helper}>Validation: valid email, min 8-char password, and unique email.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.manualButton} onPress={handleManualSignup}>
          <Text style={styles.manualButtonLabel}>Create Account</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
  },
  title: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "700",
  },
  helper: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
  },
  googleButton: {
    marginTop: 2,
    backgroundColor: "#0f172a",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  googleButtonLabel: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: 15,
  },
  error: {
    color: "#b91c1c",
    fontSize: 13,
  },
  manualButton: {
    marginTop: 4,
    backgroundColor: "#166534",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  manualButtonLabel: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
});
