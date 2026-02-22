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
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "@/store/useAuthStore";
import { useCommunityStore } from "@/store/useCommunityStore";
import {
  getCommunities,
  getMyCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityEvents,
  getCommunityQuizzes,
} from "@/api/community.api";
import type { ApiCommunity, ApiCommunityEvent, ApiCommunityQuiz } from "@/src/types";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";
import { useCommunityStats } from "@/hooks/useCommunityStats";
import { useChallenge } from "@/hooks/useChallenge";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { CommunityHeroBanner } from "@/components/community/CommunityHeroBanner";
import { StatsTileRow } from "@/components/community/StatsTileRow";
import { ChallengeCard } from "@/components/community/ChallengeCard";
import { WeeklyTrendChart } from "@/components/community/WeeklyTrendChart";
import { TopContributorRow } from "@/components/community/TopContributorRow";
import { ActivityFeed } from "@/components/community/ActivityFeed";
import { ChallengeCompletionModal } from "@/components/community/ChallengeCompletionModal";
import { ShareBottomSheet } from "@/components/sharing/ShareBottomSheet";
import type { SharePayload } from "@/components/sharing/ShareCard";
import type { MainStackParamList } from "@/navigation/MainNavigator";

type Tab = "discover" | "mine";
type Nav = NativeStackNavigationProp<MainStackParamList, "Community">;

export default function CommunityScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const mine = useCommunityStore((s) => s.mine);
  const setMine = useCommunityStore((s) => s.setMine);
  const [tab, setTab] = useState<Tab>("discover");
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"college" | "city" | "company" | "">("");
  const [loading, setLoading] = useState(true);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [events, setEvents] = useState<ApiCommunityEvent[]>([]);
  const [quizzes, setQuizzes] = useState<ApiCommunityQuiz[]>([]);

  const communityId = mine?._id ?? null;
  const { stats, loading: statsLoading, refetch: refetchStats } = useCommunityStats(communityId);
  const { challenge, showCelebration, dismissCelebration, refetch: refetchChallenge } = useChallenge(communityId);
  const { activities, loading: feedLoading, hasMore, loadMore, refetch: refetchFeed } = useActivityFeed(communityId, { limit: 5 });

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

  const loadEngagement = useCallback(async () => {
    if (!communityId) {
      setEvents([]);
      setQuizzes([]);
      return;
    }
    setEngagementLoading(true);
    try {
      const [eventsRes, quizzesRes] = await Promise.all([
        getCommunityEvents(communityId, { page: 1, limit: 5 }),
        getCommunityQuizzes(communityId, { page: 1, limit: 5 }),
      ]);
      setEvents(eventsRes.events ?? []);
      setQuizzes(quizzesRes.quizzes ?? []);
    } catch {
      setEvents([]);
      setQuizzes([]);
    } finally {
      setEngagementLoading(false);
    }
  }, [communityId]);

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
    loadEngagement();
  }, [loadEngagement]);

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

  function handleLeave() {
    Alert.alert("Leave community", "Are you sure you want to leave this community?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await leaveCommunity();
            setMine(null);
            await useAuthStore.getState().refreshUser();
          } catch {}
        },
      },
    ]);
  }

  function onRefreshMine() {
    refetchStats();
    refetchChallenge();
    refetchFeed();
    loadEngagement();
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
        <Pressable
          style={[styles.tab, tab === "discover" && styles.tabActive]}
          onPress={() => setTab("discover")}
          accessibilityLabel="Discover communities"
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === "discover" }}
        >
          <Text style={[styles.tabText, tab === "discover" && styles.tabTextActive]}>Discover</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "mine" && styles.tabActive]}
          onPress={() => setTab("mine")}
          accessibilityLabel="My community"
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === "mine" }}
        >
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
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); onRefreshMine(); }} tintColor={COLORS.primary} />
            }
          >
            <CommunityHeroBanner
              name={mine.name}
              type={mine.type}
              memberCount={mine.memberCount}
              totalCo2Saved={mine.totalCo2Saved}
            />
            <Pressable
              style={styles.engagementCta}
              onPress={() =>
                navigation.navigate("CommunityEngagement", {
                  communityId: mine._id,
                  communityName: mine.name,
                })
              }
            >
              <Text style={styles.engagementCtaTitle}>Open Events & Quizzes</Text>
              <Text style={styles.engagementCtaSubtitle}>RSVP to activities and take community quizzes</Text>
            </Pressable>
            {statsLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
            ) : stats ? (
              <>
                <StatsTileRow
                  thisMonthCo2={stats.stats.thisMonthCo2}
                  monthOverMonthChange={stats.stats.monthOverMonthChange}
                  avgCo2PerMember={stats.stats.avgCo2PerMember}
                />
                <Text style={styles.sectionTitle}>THIS WEEK'S CHALLENGE</Text>
                <ChallengeCard challenge={challenge} />
                <Text style={styles.sectionTitle}>UPCOMING EVENTS</Text>
                {engagementLoading ? (
                  <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: SPACING.sm }} />
                ) : events.length > 0 ? (
                  <View style={styles.engagementList}>
                    {events.map((event) => (
                      <View key={event._id} style={styles.engagementCard}>
                        <Text style={styles.engagementTitle}>{event.title}</Text>
                        <Text style={styles.engagementMeta}>
                          {new Date(event.startAt).toLocaleDateString()} · {event.location || "Community venue"}
                        </Text>
                        <Text style={styles.engagementSubtext}>
                          {event.rsvps} RSVPs{event.maxParticipants ? ` / ${event.maxParticipants} max` : ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyEngagement}>No published events yet</Text>
                )}
                <Text style={styles.sectionTitle}>LIVE QUIZZES</Text>
                {engagementLoading ? (
                  <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: SPACING.sm }} />
                ) : quizzes.length > 0 ? (
                  <View style={styles.engagementList}>
                    {quizzes.map((quiz) => (
                      <View key={quiz._id} style={styles.engagementCard}>
                        <Text style={styles.engagementTitle}>{quiz.title}</Text>
                        <Text style={styles.engagementMeta}>
                          {quiz.questionCount} questions · Pass {quiz.passingScore}% · {quiz.attempts} attempts
                        </Text>
                        <Text style={styles.engagementSubtext}>Average score: {quiz.avgScore}%</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyEngagement}>No published quizzes yet</Text>
                )}
                <WeeklyTrendChart
                  data={stats.weeklyTrend}
                  maxValue={Math.max(1, ...stats.weeklyTrend.map((d) => d.co2Saved))}
                />
                <TopContributorRow
                  contributors={stats.topContributors}
                  currentUserId={user?._id}
                />
                <ActivityFeed
                  activities={activities}
                  loading={feedLoading}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                  limit={5}
                />
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>THIS WEEK'S CHALLENGE</Text>
                <ChallengeCard challenge={challenge} />
                <Text style={styles.sectionTitle}>UPCOMING EVENTS</Text>
                {engagementLoading ? (
                  <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: SPACING.sm }} />
                ) : events.length > 0 ? (
                  <View style={styles.engagementList}>
                    {events.map((event) => (
                      <View key={event._id} style={styles.engagementCard}>
                        <Text style={styles.engagementTitle}>{event.title}</Text>
                        <Text style={styles.engagementMeta}>
                          {new Date(event.startAt).toLocaleDateString()} · {event.location || "Community venue"}
                        </Text>
                        <Text style={styles.engagementSubtext}>
                          {event.rsvps} RSVPs{event.maxParticipants ? ` / ${event.maxParticipants} max` : ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyEngagement}>No published events yet</Text>
                )}
                <Text style={styles.sectionTitle}>LIVE QUIZZES</Text>
                {engagementLoading ? (
                  <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: SPACING.sm }} />
                ) : quizzes.length > 0 ? (
                  <View style={styles.engagementList}>
                    {quizzes.map((quiz) => (
                      <View key={quiz._id} style={styles.engagementCard}>
                        <Text style={styles.engagementTitle}>{quiz.title}</Text>
                        <Text style={styles.engagementMeta}>
                          {quiz.questionCount} questions · Pass {quiz.passingScore}% · {quiz.attempts} attempts
                        </Text>
                        <Text style={styles.engagementSubtext}>Average score: {quiz.avgScore}%</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyEngagement}>No published quizzes yet</Text>
                )}
              </>
            )}
            <Pressable style={styles.leaveBtn} onPress={handleLeave}>
              <Text style={styles.leaveBtnLabel}>Leave community</Text>
            </Pressable>
          </ScrollView>
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
                <Pressable
                  style={styles.viewEngagementBtn}
                  onPress={() =>
                    navigation.navigate("CommunityEngagement", {
                      communityId: item._id,
                      communityName: item.name,
                    })
                  }
                >
                  <Text style={styles.viewEngagementLabel}>View events & quizzes</Text>
                </Pressable>
                {!isJoined ? (
                  <Pressable
                    style={[styles.joinBtn, joiningId === item._id && styles.joinBtnDisabled]}
                    onPress={() => handleJoin(item._id)}
                    disabled={!!joiningId}
                    accessibilityLabel={`Join ${item.name}`}
                    accessibilityRole="button"
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

      <ChallengeCompletionModal
        visible={showCelebration}
        challenge={challenge}
        communityName={mine?.name}
        onDismiss={dismissCelebration}
        onShare={setSharePayload}
      />

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
  header: { flexDirection: "row", alignItems: "center", padding: SPACING.base, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { paddingVertical: SPACING.sm, paddingRight: SPACING.base },
  backBtnLabel: { fontSize: TYPOGRAPHY.size.base, color: COLORS.primary, fontWeight: TYPOGRAPHY.weight.semibold },
  title: { fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  tabs: { flexDirection: "row", padding: SPACING.base, gap: SPACING.sm },
  tab: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.base, borderRadius: RADIUS.sm },
  tabActive: { backgroundColor: COLORS.primaryPale },
  tabText: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: TYPOGRAPHY.weight.semibold },
  search: { marginHorizontal: SPACING.base, marginBottom: SPACING.sm, padding: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, fontSize: TYPOGRAPHY.size.base },
  typeRow: { flexDirection: "row", paddingHorizontal: SPACING.base, gap: SPACING.sm, marginBottom: SPACING.sm },
  typeChip: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  typeChipActive: { backgroundColor: COLORS.primaryPale, borderColor: COLORS.primary },
  typeChipText: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  typeChipTextActive: { color: COLORS.primary, fontWeight: TYPOGRAPHY.weight.semibold },
  list: { padding: SPACING.base, paddingBottom: SPACING["3xl"] },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.base, paddingBottom: SPACING["3xl"] },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardName: { fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  cardType: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary, marginTop: 2, textTransform: "capitalize" },
  cardMeta: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
  cardDesc: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary, marginTop: SPACING.sm },
  viewEngagementBtn: { marginTop: SPACING.md },
  viewEngagementLabel: { color: COLORS.primary, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.semibold },
  joinBtn: { marginTop: SPACING.md, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: SPACING.md, alignItems: "center" },
  joinBtnDisabled: { opacity: 0.7 },
  joinBtnLabel: { color: COLORS.primaryContrast, fontWeight: TYPOGRAPHY.weight.semibold },
  joinedLabel: { marginTop: SPACING.md, fontSize: TYPOGRAPHY.size.sm, color: COLORS.success, fontWeight: TYPOGRAPHY.weight.semibold },
  leaveBtn: { marginTop: SPACING.xl, paddingVertical: SPACING.md, alignItems: "center" },
  leaveBtnLabel: { color: COLORS.danger, fontWeight: TYPOGRAPHY.weight.semibold },
  empty: { padding: SPACING.xl, fontSize: TYPOGRAPHY.size.base, color: COLORS.textSecondary, textAlign: "center" },
  engagementCta: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primaryPale,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  engagementCtaTitle: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.primary,
  },
  engagementCtaSubtitle: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  engagementList: { gap: SPACING.sm, marginBottom: SPACING.md },
  engagementCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  engagementTitle: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textPrimary,
  },
  engagementMeta: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  engagementSubtext: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
  },
  emptyEngagement: {
    marginBottom: SPACING.md,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textMuted,
  },
});
