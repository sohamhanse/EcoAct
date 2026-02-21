import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { missions } from "@/features/missions/missionList";
import { formatDateKey, useMissionStore } from "@/store/useMissionStore";
import type { Mission } from "@/types/app";

function renderMissionCategory(category: Mission["category"]): string {
  if (category === "homeEnergy") {
    return "Home Energy";
  }

  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function MissionsScreen() {
  const completeMission = useMissionStore((state) => state.completeMission);
  const completedByDay = useMissionStore((state) => state.completedByDay);
  const totalCo2SavedKg = useMissionStore((state) => state.totalCo2SavedKg);
  const points = useMissionStore((state) => state.points);

  const [message, setMessage] = useState("");
  const today = formatDateKey(new Date());

  function handleComplete(mission: Mission) {
    const status = completeMission(mission);

    if (status === "already_completed_today") {
      setMessage("This mission is already completed for today.");
      return;
    }

    setMessage(`Great work. ${mission.co2SavedKg.toFixed(1)} kg CO2 saved.`);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Action Missions</Text>
        <Text style={styles.summarySubtitle}>Complete missions daily to reduce emissions and earn points.</Text>
        <View style={styles.summaryStats}>
          <Text style={styles.summaryStat}>Saved: {totalCo2SavedKg.toFixed(1)} kg CO2</Text>
          <Text style={styles.summaryStat}>Points: {points}</Text>
        </View>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {missions.map((mission) => {
        const completedToday = completedByDay[mission.id] === today;

        return (
          <View key={mission.id} style={styles.missionCard}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionTitle}>{mission.title}</Text>
              <Text style={styles.missionCategory}>{renderMissionCategory(mission.category)}</Text>
            </View>

            <Text style={styles.missionDescription}>{mission.description}</Text>

            <View style={styles.missionMetaRow}>
              <Text style={styles.missionMeta}>CO2 saved: {mission.co2SavedKg.toFixed(1)} kg</Text>
              <Text style={styles.missionMeta}>Points: {mission.points}</Text>
            </View>

            <Pressable
              style={[styles.button, completedToday && styles.buttonDisabled]}
              onPress={() => handleComplete(mission)}
              disabled={completedToday}
            >
              <Text style={styles.buttonLabel}>{completedToday ? "Completed today" : "Mark as completed"}</Text>
            </Pressable>
          </View>
        );
      })}
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
    paddingBottom: 28,
  },
  summaryCard: {
    backgroundColor: "#1d4ed8",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  summaryTitle: {
    color: "#eff6ff",
    fontWeight: "700",
    fontSize: 24,
  },
  summarySubtitle: {
    color: "#dbeafe",
    fontSize: 13,
    lineHeight: 18,
  },
  summaryStats: {
    marginTop: 2,
    gap: 3,
  },
  summaryStat: {
    color: "#eff6ff",
    fontSize: 13,
    fontWeight: "600",
  },
  message: {
    color: "#166534",
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  missionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 9,
  },
  missionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  missionTitle: {
    flex: 1,
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 16,
  },
  missionCategory: {
    color: "#334155",
    fontSize: 12,
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  missionDescription: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 18,
  },
  missionMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  missionMeta: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },
  button: {
    marginTop: 2,
    backgroundColor: "#15803d",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
  },
  buttonLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
