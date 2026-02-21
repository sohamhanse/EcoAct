import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/store/useAuthStore";
import { useCommunityStore } from "@/store/useCommunityStore";
import { getCommunities, getMyCommunity, joinCommunity, leaveCommunity } from "@/api/community.api";
import type { ApiCommunity } from "@/src/types";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";

type Tab = "discover" | "mine";

export default function CommunityScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const mine = useCommunityStore((s) => s.mine);
  const setMine = useCommunityStore((s) => s.setMine);
  const [tab, setTab] = useState<Tab>("discover");
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"college" | "city" | "company" | "">("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const loadDiscover = useCallback(async () => {
    try {
      const list = await getCommunities({
        ...(typeFilter && { type: typeFilter }),
        ...(search.trim() && { search: search.trim() }),
      });
      setCommunities(list);
    } catch {
      setCommunities([]);
    }
  }, [typeFilter, search]);

  const loadMine = useCallback(async () => {
    try {
      const res = await getMyCommunity();
      setMine(res.community ?? null);
    } catch {
      setMine(null);
    }
  }, [setMine]);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadDiscover(), loadMine()]);
    setLoading(false);
    setRefreshing(false);
  }, [loadDiscover, loadMine]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab === "discover") {
      const t = setTimeout(loadDiscover, 300);
      return () => clearTimeout(t);
    }
  }, [tab, search, typeFilter, loadDiscover]);

  async function handleJoin(id: string) {
    setJoiningId(id);
    try {
      await joinCommunity(id);
      await loadMine();
      await useAuthStore.getState().refreshUser();
    } finally {
      setJoiningId(null);
    }
  }

  async function handleLeave() {
    try {
      await leaveCommunity();
      setMine(null);
      await useAuthStore.getState().refreshUser();
    } catch {}
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnLabel}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Community</Text>
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "discover" && styles.tabActive]} onPress={() => setTab("discover")}>
          <Text style={[styles.tabText, tab === "discover" && styles.tabTextActive]}>Discover</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "mine" && styles.tabActive]} onPress={() => setTab("mine")}>
          <Text style={[styles.tabText, tab === "mine" && styles.tabTextActive]}>My community</Text>
        </Pressable>
      </View>

      {tab === "discover" && (
        <>
          <TextInput
            style={styles.search}
            placeholder="Search communities"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.textMuted}
          />
          <View style={styles.typeRow}>
            {(["college", "city", "company"] as const).map((t) => (
              <Pressable
                key={t}
                style={[styles.typeChip, typeFilter === t && styles.typeChipActive]}
                onPress={() => setTypeFilter(typeFilter === t ? "" : t)}
              >
                <Text style={[styles.typeChipText, typeFilter === t && styles.typeChipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : tab === "mine" ? (
        mine ? (
          <View style={styles.mineCard}>
            <Text style={styles.mineName}>{mine.name}</Text>
            <Text style={styles.mineType}>{mine.type}</Text>
            <Text style={styles.mineMeta}>{mine.memberCount} members · {mine.totalCo2Saved} kg saved</Text>
            <Pressable style={styles.leaveBtn} onPress={handleLeave}>
              <Text style={styles.leaveBtnLabel}>Leave community</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.empty}>You haven't joined a community yet. Discover and join one above.</Text>
        )
      ) : (
        <FlatList
          data={communities}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
          renderItem={({ item }) => {
            const isJoined = mine?._id === item._id;
            return (
              <View style={styles.card}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardType}>{item.type}</Text>
                <Text style={styles.cardMeta}>{item.memberCount} members · {item.totalCo2Saved} kg saved</Text>
                {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
                {!isJoined ? (
                  <Pressable
                    style={[styles.joinBtn, joiningId === item._id && styles.joinBtnDisabled]}
                    onPress={() => handleJoin(item._id)}
                    disabled={!!joiningId}
                  >
                    <Text style={styles.joinBtnLabel}>{joiningId === item._id ? "…" : "Join"}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.joinedLabel}>Joined</Text>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", padding: SPACING.base, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { paddingVertical: 8, paddingRight: 16 },
  backBtnLabel: { fontSize: 16, color: COLORS.primary, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },
  tabs: { flexDirection: "row", padding: SPACING.base, gap: SPACING.sm },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADIUS.sm },
  tabActive: { backgroundColor: COLORS.primaryPale },
  tabText: { fontSize: 14, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: "600" },
  search: { marginHorizontal: SPACING.base, marginBottom: SPACING.sm, padding: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, fontSize: 15 },
  typeRow: { flexDirection: "row", paddingHorizontal: SPACING.base, gap: SPACING.sm, marginBottom: SPACING.sm },
  typeChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  typeChipActive: { backgroundColor: COLORS.primaryPale, borderColor: COLORS.primary },
  typeChipText: { fontSize: 13, color: COLORS.textSecondary },
  typeChipTextActive: { color: COLORS.primary, fontWeight: "600" },
  list: { padding: SPACING.base, paddingBottom: SPACING["3xl"] },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardName: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  cardType: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, textTransform: "capitalize" },
  cardMeta: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8 },
  joinBtn: { marginTop: 12, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 10, alignItems: "center" },
  joinBtnDisabled: { opacity: 0.7 },
  joinBtnLabel: { color: "#fff", fontWeight: "600" },
  joinedLabel: { marginTop: 12, fontSize: 14, color: COLORS.success, fontWeight: "600" },
  mineCard: { margin: SPACING.base, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border },
  mineName: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary },
  mineType: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textTransform: "capitalize" },
  mineMeta: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 },
  leaveBtn: { marginTop: SPACING.lg, paddingVertical: 10, alignItems: "center" },
  leaveBtnLabel: { color: COLORS.danger, fontWeight: "600" },
  empty: { padding: SPACING.xl, fontSize: 15, color: COLORS.textSecondary, textAlign: "center" },
});
