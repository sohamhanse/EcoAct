import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable } from "react-native";
import { useAuthStore } from "@/store/useAuthStore";
import { getGlobalLeaderboard, getCommunityLeaderboard, getWeeklyLeaderboard } from "@/api/leaderboard.api";
import type { LeaderboardEntry } from "@/src/types";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";

type Tab = "global" | "community" | "weekly";

const TAB_LABELS: Record<Tab, string> = { global: "Global", community: "Community", weekly: "Weekly" };

export default function LeaderboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("global");
  const [list, setList] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (pageNum = 1, append = false) => {
    try {
      let res: { leaderboard: LeaderboardEntry[]; total: number };
      if (tab === "global") res = await getGlobalLeaderboard(pageNum);
      else if (tab === "weekly") res = await getWeeklyLeaderboard(pageNum);
      else if (user?.communityId) res = await getCommunityLeaderboard(user.communityId!, pageNum);
      else {
        setList([]);
        setTotal(0);
        return;
      }
      setList(append ? (prev) => [...prev, ...res.leaderboard] : res.leaderboard);
      setTotal(res.total);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, user?.communityId]);

  useEffect(() => {
    setPage(1);
    load(1, false);
  }, [load, tab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    load(1, false);
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(["global", "community", "weekly"] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            accessibilityLabel={`${TAB_LABELS[t]} leaderboard`}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{TAB_LABELS[t]}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : tab === "community" && !user?.communityId ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Join a community to see the community leaderboard.</Text>
          <Text style={styles.emptySubtext}>Go to the Community tab to discover and join.</Text>
        </View>
      ) : list.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No one on the leaderboard yet.</Text>
          <Text style={styles.emptySubtext}>Complete missions to climb the ranks.</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => String(item._id) + item.rank}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          renderItem={({ item }) => (
            <View
              style={[styles.row, user?._id === item._id && styles.rowHighlight]}
              accessibilityLabel={`Rank ${item.rank}, ${item.name}, ${item.totalPoints} points, ${item.totalCo2Saved} kg saved`}
              accessibilityRole="text"
            >
              <Text style={styles.rank}>{item.rank}</Text>
              <View style={styles.avatar}><Text style={styles.avatarText}>{(item.name ?? "?")[0]}</Text></View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.totalPoints} pts · {item.totalCo2Saved} kg saved</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabs: { flexDirection: "row", padding: SPACING.base, gap: SPACING.sm },
  tab: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.base, borderRadius: RADIUS.sm, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primaryPale, borderColor: COLORS.primary },
  tabText: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: TYPOGRAPHY.weight.semibold },
  list: { padding: SPACING.base, paddingBottom: SPACING["3xl"] },
  row: { flexDirection: "row", alignItems: "center", padding: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  rowHighlight: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryPale },
  rank: { width: SPACING["2xl"], fontSize: TYPOGRAPHY.size.base, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textSecondary },
  avatar: { width: SPACING["3xl"], height: SPACING["3xl"], borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginRight: SPACING.sm },
  avatarText: { color: COLORS.primaryContrast, fontWeight: TYPOGRAPHY.weight.bold, fontSize: TYPOGRAPHY.size.base },
  info: { flex: 1 },
  name: { fontSize: TYPOGRAPHY.size.base, fontWeight: TYPOGRAPHY.weight.semibold, color: COLORS.textPrimary },
  meta: { fontSize: TYPOGRAPHY.size.xs, color: COLORS.textSecondary, marginTop: 2 },
  emptyState: { padding: SPACING.xl, alignItems: "center" },
  emptyText: { fontSize: TYPOGRAPHY.size.base, color: COLORS.textSecondary, textAlign: "center" },
  emptySubtext: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textMuted, marginTop: SPACING.sm, textAlign: "center" },
});
