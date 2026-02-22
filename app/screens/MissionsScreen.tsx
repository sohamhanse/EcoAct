import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAuthStore } from "@/store/useAuthStore";
import { getMissions, completeMission, getMissionStats } from "@/api/missions.api";
import type { ApiMission } from "@/src/types";
import { ShareBottomSheet } from "@/components/sharing/ShareBottomSheet";
import type { SharePayload } from "@/components/sharing/ShareCard";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";

const CATEGORIES = ["All", "transport", "food", "energy", "shopping", "water"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  transport: COLORS.transport,
  food: COLORS.food,
  energy: COLORS.energy,
  shopping: COLORS.shopping,
  water: COLORS.water,
};

export default function MissionsScreen() {
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [missions, setMissions] = useState<ApiMission[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    points: number;
    co2: number;
    badges: string[];
    newTotalCo2Saved?: number;
    missionsCount?: number;
  } | null>(null);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [stats, setStats] = useState<{ missionsCount: number; totalCo2Saved: number; totalPoints: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, s] = await Promise.all([getMissions(filter === "All" ? undefined : { category: filter }), getMissionStats()]);
      setMissions(list);
      setStats(s);
    } catch {
      setMissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleComplete(missionId: string) {
    setCompletingId(missionId);
    try {
      const res = await completeMission(missionId);
      await refreshUser();
      setModal({
        points: res.pointsAwarded,
        co2: res.co2SavedAwarded,
        badges: res.newlyEarnedBadges ?? [],
        newTotalCo2Saved: res.newTotalCo2Saved,
        missionsCount: (stats?.missionsCount ?? 0) + 1,
      });
      load();
    } catch {
      setCompletingId(null);
    } finally {
      setCompletingId(null);
    }
  }

  const filtered = filter === "All" ? missions : missions.filter((m) => m.category === filter);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            style={[styles.filterChip, filter === c && styles.filterChipActive]}
            onPress={() => setFilter(c)}
          >
            <Text style={[styles.filterChipText, filter === c && styles.filterChipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>
      {stats && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>{stats.missionsCount} done · {stats.totalCo2Saved} kg saved · {stats.totalPoints} pts</Text>
        </View>
      )}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.cardAccent, { backgroundColor: CATEGORY_COLORS[item.category] ?? COLORS.primary }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <View style={styles.badges}>
                  <View style={styles.co2Badge}><Text style={styles.co2BadgeText}>−{item.co2Saved} kg</Text></View>
                  <Text style={styles.pointsBadge}>{item.basePoints} pts</Text>
                  <Text style={styles.diffBadge}>{item.difficulty}</Text>
                </View>
                <Pressable
                  style={[styles.completeBtn, completingId === item._id && styles.completeBtnDisabled]}
                  onPress={() => handleComplete(item._id)}
                  disabled={!!completingId}
                >
                  <Text style={styles.completeBtnLabel}>
                    {completingId === item._id ? "…" : "Mark complete"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={!!modal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModal(null)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Mission complete!</Text>
            {modal && (
              <>
                <Text style={styles.modalPoints}>+{modal.points} points</Text>
                <Text style={styles.modalCo2}>−{modal.co2} kg CO₂ saved</Text>
                {modal.badges.length > 0 && <Text style={styles.modalBadges}>New badge(s): {modal.badges.join(", ")}</Text>}
                {modal.badges.length > 0 && (
                  <Pressable
                    style={styles.shareBadgeBtn}
                    onPress={() => {
                      const badgeName = modal.badges[0].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                      setSharePayload({
                        type: "badge",
                        data: {
                          badgeName,
                          co2Saved: modal.newTotalCo2Saved ?? 0,
                          missionsDone: modal.missionsCount ?? 1,
                        },
                      });
                    }}
                  >
                    <Text style={styles.shareBadgeBtnLabel}>📤 Share Badge</Text>
                  </Pressable>
                )}
              </>
            )}
            <Pressable style={styles.modalBtn} onPress={() => setModal(null)}>
              <Text style={styles.modalBtnLabel}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ShareBottomSheet
        visible={!!sharePayload}
        payload={sharePayload}
        onDismiss={() => setSharePayload(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterRow: { flexDirection: "row", flexWrap: "wrap", padding: SPACING.base, gap: SPACING.sm },
  filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primaryPale, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.primary, fontWeight: "600" },
  statsBar: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.sm },
  statsText: { fontSize: 13, color: COLORS.textSecondary },
  list: { padding: SPACING.base, paddingBottom: SPACING["3xl"] },
  card: { flexDirection: "row", backgroundColor: COLORS.surface, borderRadius: RADIUS.md, marginBottom: SPACING.md, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: SPACING.md },
  cardTitle: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  badges: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  co2Badge: { backgroundColor: COLORS.primaryPale, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm },
  co2BadgeText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  pointsBadge: { fontSize: 12, color: COLORS.textSecondary },
  diffBadge: { fontSize: 11, color: COLORS.textMuted, textTransform: "capitalize" },
  completeBtn: { marginTop: 12, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 8, alignItems: "center" },
  completeBtnDisabled: { opacity: 0.7 },
  completeBtnLabel: { color: "#fff", fontWeight: "600", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: SPACING.xl },
  modalBox: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.xl, width: "100%", maxWidth: 320 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  modalPoints: { fontSize: 24, fontWeight: "700", color: COLORS.primary, textAlign: "center", marginTop: SPACING.md },
  modalCo2: { fontSize: 16, color: COLORS.success, textAlign: "center", marginTop: 4 },
  modalBadges: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginTop: 8 },
  modalBtn: { marginTop: SPACING.xl, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: "center" },
  modalBtnLabel: { color: "#fff", fontWeight: "600" },
  shareBadgeBtn: {
    marginTop: SPACING.md,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  shareBadgeBtnLabel: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },
});
