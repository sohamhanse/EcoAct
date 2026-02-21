import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../../App";
import { useCarbonContext } from "../context/CarbonContext";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

export default function OnboardingScreen({ navigation }: Props) {
  const { markOnboardingCompleted } = useCarbonContext();

  function continueToAuth() {
    markOnboardingCompleted();
    navigation.replace("Auth");
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Welcome to EcoAct</Text>
        <Text style={styles.subtitle}>Measure your carbon footprint and turn daily actions into impact.</Text>
      </View>

      <View style={styles.pointsCard}>
        <Text style={styles.point}>Measure your carbon footprint</Text>
        <Text style={styles.point}>Take actions to reduce it</Text>
        <Text style={styles.point}>Earn points and build streaks</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={continueToAuth}>
        <Text style={styles.primaryButtonLabel}>Continue</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={continueToAuth}>
        <Text style={styles.secondaryButtonLabel}>Skip intro</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 14,
    backgroundColor: "#f1f5f9",
  },
  heroCard: {
    backgroundColor: "#0f766e",
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  title: {
    color: "#ecfeff",
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    color: "#ccfbf1",
    fontSize: 14,
    lineHeight: 19,
  },
  pointsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    gap: 10,
  },
  point: {
    color: "#334155",
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: "#166534",
    borderRadius: 11,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#0f766e",
    borderRadius: 11,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  secondaryButtonLabel: {
    color: "#0f766e",
    fontWeight: "600",
    fontSize: 15,
  },
});
