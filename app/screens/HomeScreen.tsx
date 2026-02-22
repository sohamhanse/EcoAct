import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "@/store/useAuthStore";
import { useCommunityStore } from "@/store/useCommunityStore";
import { getRecommendedMissions } from "@/api/missions.api";
import { useMilestones } from "@/hooks/useMilestones";
import { getMyCommunity } from "@/api/community.api";
import { getMyLeaderboardRank } from "@/api/leaderboard.api";
import type { MainStackParamList } from "@/navigation/MainNavigator";
import type { ApiMission } from "@/src/types";
import { MilestoneCard } from "@/components/milestones/MilestoneCard";
import { ShareBottomSheet } from "@/components/sharing/ShareBottomSheet";
import type { SharePayload } from "@/components/sharing/ShareCard";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";

type Nav = NativeStackNavigationProp<MainStackParamList>;

const INDIA_AVG = 1700;
const CARBON_NEUTRAL_GOAL = 2000;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const mine = useCommunityStore((s) => s.mine);
  const setMine = useCommunityStore((s) => s.setMine);
  const [missions, setMissions] = useState<ApiMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { active: milestones, loading: milestonesLoading, refetch: refetchMilestones } = useMilestones();
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [globalRank, setGlobalRank] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [rec, comm, rankRes] = await Promise.all([
        getRecommendedMissions(),
        getMyCommunity(),
        getMyLeaderboardRank().catch(() => null),
      ]);
      setMissions(rec);
      setMine(comm.community ?? null);
      setGlobalRank(rankRes?.globalRank ?? null);
      refetchMilestones();
    } catch {
      setMissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setMine, refetchMilestones]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const baseline = user?.footprintBaseline ?? INDIA_AVG;
  const saved = user?.totalCo2Saved ?? 0;
  const net = baseline - saved;
  const improvement = baseline > 0 ? Math.round(((saved / baseline) * 100)) : 0;
  const progressToGoal = Math.min(100, (saved / CARBON_NEUTRAL_GOAL) * 100);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  if (!user) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <Text style={styles.greeting}>{greeting}, {user.name.split(" ")[0]} 🌿</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Annual footprint</Text>
        <Text style={styles.heroValue}>{net.toLocaleString()} kg CO₂/year</Text>
        <Text style={styles.heroSub}>CO₂ saved to date: {saved} kg</Text>
        <Text style={styles.improvement}>↓ {improvement}% vs baseline</Text>
        <View style={styles.progressWrap}>
          <View style={[styles.progressFill, { width: `${progressToGoal}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{saved} kg to Carbon Neutral Goal (2,000 kg/year)</Text>
        {improvement > 5 && (
          <Pressable
            style={styles.shareProgress}
            onPress={() =>
              setSharePayload({
                type: "footprint",
                data: {
                  improvementPercent: improvement,
                  from: baseline,
                  to: net,
                  progressPercent: Math.round(progressToGoal),
                },
              })
            }
          >
            <Text style={styles.shareProgressLabel}>Share your progress 📤</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{user.totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{user.currentStreak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{globalRank != null ? `#${globalRank}` : "—"}</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Today's missions</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.missionScroll}>
          {missions.slice(0, 3).map((m) => (
            <View key={m._id} style={styles.missionCard}>
              <Text style={styles.missionTitle}>{m.title}</Text>
              <Text style={styles.missionCo2}>−{m.co2Saved} kg CO₂</Text>
              <Text style={styles.missionPoints}>{m.basePoints} pts · {m.difficulty}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <Text style={styles.sectionTitle}>My milestones</Text>
      {milestonesLoading ? (
        <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: SPACING.sm }} />
      ) : milestones.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.milestoneScroll}>
          {milestones.map((m) => (
            <MilestoneCard key={m._id} milestone={m} />
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.emptyMilestones}>Complete missions to unlock milestones</Text>
      )}

      <Pressable style={styles.communityCard} onPress={() => navigation.navigate("Community")}>
        <Text style={styles.communityTitle}>Community</Text>
        <Text style={styles.communitySub}>
          {mine ? `${mine.name} · ${mine.totalCo2Saved} kg saved` : "Join a community"}
        </Text>
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
  greeting: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary },
  date: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  heroCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroLabel: { fontSize: 13, color: COLORS.textSecondary },
  heroValue: { fontSize: 28, fontWeight: "700", color: COLORS.primary, marginTop: 4 },
  heroSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  improvement: { fontSize: 14, color: COLORS.success, marginTop: 4 },
  progressWrap: {
    height: 8,
    backgroundColor: COLORS.primaryPale,
    borderRadius: 4,
    marginTop: SPACING.md,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 4 },
  progressLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  shareProgress: { marginTop: SPACING.sm },
  shareProgressLabel: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: "600", color: COLORS.textPrimary, marginTop: SPACING.xl },
  missionScroll: { marginTop: SPACING.sm, marginHorizontal: -SPACING.base },
  milestoneScroll: { marginTop: SPACING.sm, marginHorizontal: -SPACING.base, gap: SPACING.sm },
  emptyMilestones: { fontSize: 13, color: COLORS.textMuted, marginTop: SPACING.sm },
  missionCard: {
    width: 160,
    marginLeft: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  missionTitle: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  missionCo2: { fontSize: 13, color: COLORS.success, marginTop: 4 },
  missionPoints: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  communityCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primaryPale,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
  },
  communityTitle: { fontSize: 16, fontWeight: "600", color: COLORS.primary },
  communitySub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
});
