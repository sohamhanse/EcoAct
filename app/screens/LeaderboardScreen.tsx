import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable } from "react-native";
import { useAuthStore } from "@/store/useAuthStore";
import { getGlobalLeaderboard, getCommunityLeaderboard, getWeeklyLeaderboard } from "@/api/leaderboard.api";
import type { LeaderboardEntry } from "@/src/types";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";

type Tab = "global" | "community" | "weekly";

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
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id + item.rank}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          renderItem={({ item }) => (
            <View style={[styles.row, user?._id === item._id && styles.rowHighlight]}>
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
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primaryPale, borderColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: "600" },
  list: { padding: SPACING.base, paddingBottom: SPACING["3xl"] },
  row: { flexDirection: "row", alignItems: "center", padding: SPACING.md, backgroundColor: COLORS.surface, borderRadius: 8, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  rowHighlight: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryPale },
  rank: { width: 28, fontSize: 16, fontWeight: "700", color: COLORS.textSecondary },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginRight: SPACING.sm },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
