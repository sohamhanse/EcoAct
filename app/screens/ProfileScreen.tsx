import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/store/useAuthStore";
import { getMe } from "@/api/auth.api";
import { getCalculatorHistory } from "@/api/calculator.api";
import { getPUCStats } from "@/api/puc.api";
import { getMyPollutionReports } from "@/api/pollutionReport.api";
import { useMilestones } from "@/hooks/useMilestones";
import { MilestoneCard } from "@/components/milestones/MilestoneCard";
import { ShareBottomSheet } from "@/components/sharing/ShareBottomSheet";
import type { SharePayload } from "@/components/sharing/ShareCard";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";

const BADGE_IDS = [
  "first_step", "eco_starter", "green_warrior", "climate_hero",
  "week_streak", "month_streak", "community_builder",
  "puc_first", "puc_5", "puc_10", "puc_streak_3",
  "reporter_first", "reporter_10", "reporter_50", "reporter_100",
  "monthly_50_badge", "monthly_100_badge", "monthly_200_badge", "habit_builder_badge",
];

export default function ProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ totalCo2: number; loggedAt: string }>>([]);
  const { active: milestones, history: milestoneHistory, loading: milestonesLoading } = useMilestones();
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [pucStats, setPucStats] = useState<{
    totalLogs: number;
    complianceRate: number;
    totalCo2ImpactKg: number;
    totalPointsEarned: number;
    totalReports: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const u = await getMe();
      useAuthStore.getState().setUser(u);
      const [h, stats, reports] = await Promise.all([
        getCalculatorHistory(),
        getPUCStats().catch(() => null),
        getMyPollutionReports().catch(() => null),
      ]);
      setHistory(h.logs?.slice(0, 5).map((l) => ({ totalCo2: l.totalCo2, loggedAt: l.loggedAt })) ?? []);
      setPucStats(
        stats
          ? {
              totalLogs: stats.totalLogs,
              complianceRate: stats.complianceRate,
              totalCo2ImpactKg: stats.totalCo2ImpactKg,
              totalPointsEarned: stats.totalPointsEarned,
              totalReports: reports?.reports?.length ?? 0,
            }
          : null,
      );
    } catch {
      setHistory([]);
      setPucStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: async () => {
        await logout();
        const root = (navigation.getParent() as { getParent?: () => { reset: (arg: object) => void } | null })?.getParent?.();
        root?.reset?.({ index: 0, routes: [{ name: "Splash" }] });
      } },
    ]);
  }

  const earnedBadges = new Set(user?.badges?.map((b) => b.badgeId) ?? []);
  const level = user ? Math.floor(user.totalPoints / 100) + 1 : 1;

  if (!user) return null;

  const baseline = user.footprintBaseline ?? 0;
  const saved = user.totalCo2Saved ?? 0;
  const current = Math.max(0, baseline - saved);
  const improvement = baseline > 0 ? Math.round((saved / baseline) * 100) : 0;
  const progressToNeutral = 2000 > 0 ? Math.min(100, (saved / 2000) * 100) : 0;

  function openFootprintShare() {
    setSharePayload({
      type: "footprint",
      data: {
        improvementPercent: improvement,
        from: baseline,
        to: current,
        progressPercent: Math.round(progressToNeutral),
      },
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable
          onPress={openFootprintShare}
          style={styles.shareIcon}
          accessibilityLabel="Share your footprint progress"
          accessibilityRole="button"
        >
          <Ionicons name="share-social-outline" size={24} color={COLORS.primary} />
        </Pressable>
      </View>
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name[0]}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.level}>Level {level} · {user.totalPoints} pts</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statVal}>{user.totalPoints}</Text><Text style={styles.statLabel}>Points</Text></View>
        <View style={styles.stat}><Text style={styles.statVal}>{user.currentStreak}</Text><Text style={styles.statLabel}>Streak</Text></View>
        <View style={styles.stat}><Text style={styles.statVal}>{user.totalCo2Saved}</Text><Text style={styles.statLabel}>kg saved</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Badges</Text>
      <View style={styles.badgesGrid}>
        {BADGE_IDS.map((id) => (
          <View key={id} style={[styles.badge, earnedBadges.has(id) ? styles.badgeEarned : styles.badgeLocked]}>
            <Text style={styles.badgeText}>{earnedBadges.has(id) ? "✓" : "🔒"}</Text>
            <Text style={styles.badgeId} numberOfLines={1}>{id.replace("_", " ")}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>PUC Compliance Record</Text>
      {pucStats ? (
        <View style={styles.pucCard}>
          <Text style={styles.pucLine}>Total PUC logs: {pucStats.totalLogs}</Text>
          <Text style={styles.pucLine}>On-time rate: {pucStats.complianceRate}%</Text>
          <Text style={styles.pucLine}>CO2 prevented: ~{pucStats.totalCo2ImpactKg} kg/year equivalent</Text>
          <Text style={styles.pucLine}>Points from PUC: {pucStats.totalPointsEarned} pts</Text>
          <Text style={styles.pucLine}>Reports submitted: {pucStats.totalReports}</Text>
          <Pressable
            onPress={() => (navigation as unknown as { navigate: (name: string) => void }).navigate("PUC")}
            style={styles.pucLinkWrap}
          >
            <Text style={styles.pucLink}>View My Vehicles</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.empty}>No PUC data yet. Start from the PUC tab.</Text>
      )}

      <Text style={styles.sectionTitle}>Milestones</Text>
      {milestonesLoading ? (
        <Text style={styles.empty}>Loading milestones…</Text>
      ) : milestones.length > 0 ? (
        <View style={styles.milestonesRow}>
          {milestones.map((m) => (
            <MilestoneCard key={m._id} milestone={m} />
          ))}
        </View>
      ) : null}
      {milestoneHistory.length > 0 && (
        <View style={styles.milestoneHistory}>
          {milestoneHistory.slice(0, 5).map((m) => (
            <View key={m._id} style={styles.historyRow}>
              <Text style={styles.historyDate}>{m.goal.label}</Text>
              <Text style={[styles.historyVal, m.status === "completed" ? styles.completed : styles.failed]}>
                {m.status === "completed" ? "✓" : "—"} {m.progress.currentValue}/{m.goal.targetValue}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Footprint history</Text>
      {history.length === 0 ? (
        <Text style={styles.empty}>No footprint logs yet. Use the Calculator to set your baseline.</Text>
      ) : (
        <View style={styles.history}>
          {history.map((h, i) => (
            <View key={i} style={styles.historyRow}>
              <Text style={styles.historyDate}>{new Date(h.loggedAt).toLocaleDateString()}</Text>
              <Text style={styles.historyVal}>{h.totalCo2} kg</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.8 }]}
        onPress={handleSignOut}
        accessibilityLabel="Sign out"
        accessibilityRole="button"
      >
        <Text style={styles.signOutLabel}>Sign out</Text>
      </Pressable>

      <ShareBottomSheet
        visible={!!sharePayload}
        payload={sharePayload}
        onDismiss={() => setSharePayload(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, paddingBottom: SPACING["3xl"] },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
  },
  headerTitle: { fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  shareIcon: { padding: SPACING.sm },
  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xl },
  avatar: { width: SPACING["5xl"], height: SPACING["5xl"], borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: COLORS.primaryContrast, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold },
  profileInfo: { marginLeft: SPACING.lg },
  name: { fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  email: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary, marginTop: 2 },
  level: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
  statsRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.xl },
  stat: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  statVal: { fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.primary },
  statLabel: { fontSize: TYPOGRAPHY.size.xs, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: TYPOGRAPHY.size.base, fontWeight: TYPOGRAPHY.weight.semibold, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  badgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.xl },
  badge: { width: "30%", minWidth: 90, padding: SPACING.sm, borderRadius: RADIUS.sm, alignItems: "center", borderWidth: 1 },
  badgeEarned: { backgroundColor: COLORS.primaryPale, borderColor: COLORS.primary },
  badgeLocked: { backgroundColor: COLORS.surface, borderColor: COLORS.border },
  badgeText: { fontSize: TYPOGRAPHY.size.md },
  badgeId: { fontSize: TYPOGRAPHY.size.xs, color: COLORS.textSecondary, marginTop: 2 },
  pucCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  pucLine: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  pucLinkWrap: { marginTop: SPACING.sm },
  pucLink: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.sm,
  },
  history: { marginBottom: SPACING.xl },
  historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  historyDate: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  historyVal: { fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.semibold, color: COLORS.textPrimary },
  empty: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textMuted, marginBottom: SPACING.lg },
  milestonesRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.lg },
  milestoneHistory: { marginBottom: SPACING.lg },
  completed: { color: COLORS.success },
  failed: { color: COLORS.textMuted },
  signOut: { paddingVertical: SPACING.md, alignItems: "center" },
  signOutLabel: { color: COLORS.danger, fontWeight: TYPOGRAPHY.weight.semibold, fontSize: TYPOGRAPHY.size.base },
});
