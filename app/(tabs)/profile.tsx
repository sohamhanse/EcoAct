import { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { badgeCatalog } from "@/features/gamification/badgeCatalog";
import { useAuthStore } from "@/store/useAuthStore";
import { useCarbonStore } from "@/store/useCarbonStore";
import { useMissionStore } from "@/store/useMissionStore";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const baselineKgPerYear = useCarbonStore((state) => state.baselineKgPerYear);
  const updatedAt = useCarbonStore((state) => state.updatedAt);
  const clearAssessment = useCarbonStore((state) => state.clearAssessment);

  const points = useMissionStore((state) => state.points);
  const totalCompletions = useMissionStore((state) => state.totalCompletions);
  const totalCo2SavedKg = useMissionStore((state) => state.totalCo2SavedKg);
  const streakDays = useMissionStore((state) => state.streakDays);
  const longestStreakDays = useMissionStore((state) => state.longestStreakDays);
  const badgeIds = useMissionStore((state) => state.badgeIds);
  const resetProgress = useMissionStore((state) => state.resetProgress);

  const providerLabel = useMemo(() => {
    if (!user) {
      return "-";
    }

    return user.provider === "google" ? "Google" : "Email";
  }, [user]);

  function handleResetProgress() {
    Alert.alert("Reset progress", "Clear all saved missions, points, and calculator results?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          resetProgress();
          clearAssessment();
        },
      },
    ]);
  }

  function handleSignOut() {
    Alert.alert("Sign out", "Sign out from this device?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          resetProgress();
          clearAssessment();
          logout();
          router.replace("/auth");
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.accountCard}>
        <Text style={styles.sectionTitleOnDark}>Account</Text>
        <Text style={styles.accountName}>{user?.name ?? "Guest"}</Text>
        <Text style={styles.accountMeta}>{user?.email ?? "No email"}</Text>
        <Text style={styles.accountMeta}>Provider: {providerLabel}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Impact summary</Text>
        <Text style={styles.statLine}>Footprint baseline: {baselineKgPerYear.toFixed(1)} kg CO2/year</Text>
        <Text style={styles.statLine}>Missions completed: {totalCompletions}</Text>
        <Text style={styles.statLine}>Total CO2 saved: {totalCo2SavedKg.toFixed(1)} kg</Text>
        <Text style={styles.statLine}>Points: {points}</Text>
        <Text style={styles.statLine}>Current streak: {streakDays} days</Text>
        <Text style={styles.statLine}>Longest streak: {longestStreakDays} days</Text>
        <Text style={styles.statLine}>Last calculator update: {updatedAt ? updatedAt.slice(0, 10) : "not set"}</Text>
      </View>

      <View style={styles.badgeCard}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <View style={styles.badgeGrid}>
          {badgeCatalog.map((badge) => {
            const unlocked = badgeIds.includes(badge.id);
            return (
              <View
                key={badge.id}
                style={[styles.badgeItem, unlocked ? styles.badgeUnlocked : styles.badgeLocked]}
              >
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
                <Text style={styles.badgeState}>{unlocked ? "Unlocked" : "Locked"}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Pressable style={styles.secondaryAction} onPress={handleResetProgress}>
        <Text style={styles.secondaryActionLabel}>Reset progress</Text>
      </Pressable>

      <Pressable style={styles.dangerAction} onPress={handleSignOut}>
        <Text style={styles.dangerActionLabel}>Sign out</Text>
      </Pressable>
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
  accountCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  sectionTitle: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 16,
  },
  sectionTitleOnDark: {
    color: "#f1f5f9",
    fontWeight: "700",
    fontSize: 16,
  },
  accountName: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 2,
  },
  accountMeta: {
    color: "#cbd5e1",
    fontSize: 13,
  },
  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 6,
  },
  statLine: {
    color: "#334155",
    fontSize: 13,
  },
  badgeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 10,
  },
  badgeGrid: {
    gap: 8,
  },
  badgeItem: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 3,
  },
  badgeUnlocked: {
    backgroundColor: "#ecfccb",
    borderColor: "#a3e635",
  },
  badgeLocked: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  badgeTitle: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 14,
  },
  badgeDescription: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 17,
  },
  badgeState: {
    color: "#1e293b",
    fontSize: 12,
    fontWeight: "600",
  },
  secondaryAction: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#ffffff",
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryActionLabel: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },
  dangerAction: {
    borderRadius: 10,
    backgroundColor: "#b91c1c",
    alignItems: "center",
    paddingVertical: 12,
  },
  dangerActionLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
