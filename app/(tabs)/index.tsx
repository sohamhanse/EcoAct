import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@/store/useAuthStore";
import { useCarbonStore } from "@/store/useCarbonStore";
import { useMissionStore } from "@/store/useMissionStore";
import type { CarbonBreakdown } from "@/types/app";

const categoryLabels: Record<keyof CarbonBreakdown, string> = {
  transport: "Transport",
  food: "Food",
  homeEnergy: "Home energy",
  shopping: "Shopping",
};

const categoryColors: Record<keyof CarbonBreakdown, string> = {
  transport: "#0f766e",
  food: "#16a34a",
  homeEnergy: "#ea580c",
  shopping: "#0369a1",
};

export default function DashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const baselineKgPerYear = useCarbonStore((state) => state.baselineKgPerYear);
  const breakdown = useCarbonStore((state) => state.breakdown);
  const totalCo2SavedKg = useMissionStore((state) => state.totalCo2SavedKg);
  const points = useMissionStore((state) => state.points);
  const streakDays = useMissionStore((state) => state.streakDays);
  const badgeIds = useMissionStore((state) => state.badgeIds);

  const progressPercent =
    baselineKgPerYear > 0 ? Math.min(Math.round((totalCo2SavedKg / baselineKgPerYear) * 100), 100) : 0;
  const netFootprint = Math.max(0, baselineKgPerYear - totalCo2SavedKg);
  const maxBreakdown = Math.max(...Object.values(breakdown), 1);

  const topCategory = (Object.keys(breakdown) as (keyof CarbonBreakdown)[])
    .sort((left, right) => breakdown[right] - breakdown[left])[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Welcome back, {user?.name.split(" ")[0] ?? "friend"}</Text>
        <Text style={styles.heroSubtitle}>Your annual footprint and reduction progress.</Text>
        <View style={styles.heroMetrics}>
          <View style={styles.heroMetricBox}>
            <Text style={styles.metricLabel}>Baseline</Text>
            <Text style={styles.metricValue}>{baselineKgPerYear.toFixed(1)} kg/year</Text>
          </View>
          <View style={styles.heroMetricBox}>
            <Text style={styles.metricLabel}>Current</Text>
            <Text style={styles.metricValue}>{netFootprint.toFixed(1)} kg/year</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Saved</Text>
          <Text style={styles.statValue}>{totalCo2SavedKg.toFixed(1)} kg</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Points</Text>
          <Text style={styles.statValue}>{points}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Streak</Text>
          <Text style={styles.statValue}>{streakDays} days</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Progress toward carbon-neutral lifestyle</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressMeta}>{progressPercent}% reduced from your measured baseline.</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Footprint breakdown</Text>
        {(Object.keys(breakdown) as (keyof CarbonBreakdown)[]).map((category) => {
          const width = Math.max((breakdown[category] / maxBreakdown) * 100, 4);
          return (
            <View key={category} style={styles.breakdownRow}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownLabel}>{categoryLabels[category]}</Text>
                <Text style={styles.breakdownValue}>{breakdown[category].toFixed(1)} kg</Text>
              </View>
              <View style={styles.breakdownTrack}>
                <View
                  style={[
                    styles.breakdownFill,
                    {
                      width: `${width}%`,
                      backgroundColor: categoryColors[category],
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Highlights</Text>
        <Text style={styles.highlightText}>
          Highest impact category: {categoryLabels[topCategory]}.
        </Text>
        <Text style={styles.highlightText}>Unlocked badges: {badgeIds.length}.</Text>
        <Text style={styles.highlightText}>
          Complete missions daily to push your streak and keep reduction momentum.
        </Text>
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
    gap: 14,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: "#14532d",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ecfdf5",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#dcfce7",
  },
  heroMetrics: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  heroMetricBox: {
    flex: 1,
    backgroundColor: "#166534",
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    color: "#dcfce7",
    fontSize: 12,
  },
  metricValue: {
    color: "#f0fdf4",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 3,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    gap: 4,
  },
  statLabel: {
    color: "#475569",
    fontSize: 12,
  },
  statValue: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  progressTrack: {
    height: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#15803d",
  },
  progressMeta: {
    color: "#334155",
    fontSize: 13,
  },
  breakdownRow: {
    gap: 6,
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    color: "#1e293b",
    fontSize: 13,
  },
  breakdownValue: {
    color: "#1e293b",
    fontSize: 13,
    fontWeight: "600",
  },
  breakdownTrack: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
  },
  breakdownFill: {
    height: "100%",
    borderRadius: 999,
  },
  highlightText: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 18,
  },
});
