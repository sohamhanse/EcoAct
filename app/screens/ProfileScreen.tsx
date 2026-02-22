import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/store/useAuthStore";
import { getMe } from "@/api/auth.api";
import { getCalculatorHistory } from "@/api/calculator.api";
import { useMilestones } from "@/hooks/useMilestones";
import { MilestoneCard } from "@/components/milestones/MilestoneCard";
import { ShareBottomSheet } from "@/components/sharing/ShareBottomSheet";
import type { SharePayload } from "@/components/sharing/ShareCard";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";

const BADGE_IDS = [
  "first_step", "eco_starter", "green_warrior", "climate_hero",
  "week_streak", "month_streak", "community_builder",
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const u = await getMe();
      useAuthStore.getState().setUser(u);
      const h = await getCalculatorHistory();
      setHistory(h.logs?.slice(0, 5).map((l) => ({ totalCo2: l.totalCo2, loggedAt: l.loggedAt })) ?? []);
    } catch {
      setHistory([]);
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
        <Pressable onPress={openFootprintShare} style={styles.shareIcon}>
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

      <Pressable style={styles.signOut} onPress={handleSignOut}>
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
  headerTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },
  shareIcon: { padding: SPACING.sm },
  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xl },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  profileInfo: { marginLeft: SPACING.lg },
  name: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },
  email: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  level: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.xl },
  stat: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  statVal: { fontSize: 20, fontWeight: "700", color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary, marginBottom: SPACING.sm },
  badgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.xl },
  badge: { width: "30%", minWidth: 90, padding: SPACING.sm, borderRadius: RADIUS.sm, alignItems: "center", borderWidth: 1 },
  badgeEarned: { backgroundColor: COLORS.primaryPale, borderColor: COLORS.primary },
  badgeLocked: { backgroundColor: COLORS.surface, borderColor: COLORS.border },
  badgeText: { fontSize: 18 },
  badgeId: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  history: { marginBottom: SPACING.xl },
  historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  historyDate: { fontSize: 14, color: COLORS.textSecondary },
  historyVal: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  empty: { fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.lg },
  milestonesRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.lg },
  milestoneHistory: { marginBottom: SPACING.lg },
  completed: { color: COLORS.success },
  failed: { color: COLORS.textMuted },
  signOut: { paddingVertical: SPACING.md, alignItems: "center" },
  signOutLabel: { color: COLORS.danger, fontWeight: "600", fontSize: 16 },
});
