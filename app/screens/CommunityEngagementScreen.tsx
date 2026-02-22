import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import {
  getCommunityEvents,
  getCommunityQuizzes,
  getCommunityQuizById,
  rsvpCommunityEvent,
  submitCommunityQuizAttempt,
} from "@/api/community.api";
import type { MainStackParamList } from "@/navigation/MainNavigator";
import type {
  ApiCommunityEvent,
  ApiCommunityQuiz,
  ApiCommunityQuizDetail,
  ApiQuizAttemptResult,
} from "@/src/types";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";

type Nav = NativeStackNavigationProp<MainStackParamList, "CommunityEngagement">;
type EngagementRoute = RouteProp<MainStackParamList, "CommunityEngagement">;

type Tab = "events" | "quizzes";

export default function CommunityEngagementScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<EngagementRoute>();
  const { communityId, communityName } = route.params;

  const [tab, setTab] = useState<Tab>("events");
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ApiCommunityEvent[]>([]);
  const [quizzes, setQuizzes] = useState<ApiCommunityQuiz[]>([]);
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null);
  const [eventStatusMap, setEventStatusMap] = useState<Record<string, "registered" | "cancelled">>({});

  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [quizLoadingId, setQuizLoadingId] = useState<string | null>(null);
  const [quizDetail, setQuizDetail] = useState<ApiCommunityQuizDetail | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizStartedAt, setQuizStartedAt] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [attemptResult, setAttemptResult] = useState<ApiQuizAttemptResult | null>(null);

  function closeQuizModal() {
    setQuizModalVisible(false);
    setQuizDetail(null);
    setSelectedAnswers([]);
    setQuizStartedAt(null);
    setAttemptResult(null);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, quizzesRes] = await Promise.all([
        getCommunityEvents(communityId, { page: 1, limit: 50 }),
        getCommunityQuizzes(communityId, { page: 1, limit: 50 }),
      ]);
      setEvents(eventsRes.events ?? []);
      setQuizzes(quizzesRes.quizzes ?? []);
      setEventStatusMap((prev) => {
        const next = { ...prev };
        for (const event of eventsRes.events ?? []) {
          if (!event.myStatus) continue;
          next[event._id] = event.myStatus === "cancelled" ? "cancelled" : "registered";
        }
        return next;
      });
    } catch {
      setEvents([]);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    load();
  }, [load]);

  const upcomingEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    [events],
  );

  async function handleRsvp(eventId: string) {
    const event = events.find((item) => item._id === eventId);
    const currentStatus =
      eventStatusMap[eventId] ??
      (event?.myStatus && event.myStatus !== "cancelled" ? "registered" : "cancelled");
    const nextStatus = currentStatus === "registered" ? "cancelled" : "registered";
    setRsvpLoadingId(eventId);
    try {
      const res = await rsvpCommunityEvent(communityId, eventId, nextStatus);
      setEventStatusMap((prev) => ({ ...prev, [eventId]: res.myStatus === "cancelled" ? "cancelled" : "registered" }));
      setEvents((prev) =>
        prev.map((event) =>
          event._id === eventId
            ? {
                ...event,
                rsvps: res.rsvps,
                attended: res.attended,
              }
            : event,
        ),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "RSVP failed";
      Alert.alert("Could not update RSVP", message);
    } finally {
      setRsvpLoadingId(null);
    }
  }

  async function openQuiz(quizId: string) {
    setQuizLoadingId(quizId);
    setAttemptResult(null);
    try {
      const detail = await getCommunityQuizById(communityId, quizId);
      setQuizDetail(detail);
      setSelectedAnswers(new Array(detail.questions.length).fill(-1));
      setQuizStartedAt(new Date().toISOString());
      setQuizModalVisible(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not load quiz";
      Alert.alert("Quiz unavailable", message);
    } finally {
      setQuizLoadingId(null);
    }
  }

  async function submitQuiz() {
    if (!quizDetail || !quizStartedAt) return;
    if (selectedAnswers.some((answer) => answer < 0)) {
      Alert.alert("Incomplete", "Please answer all questions before submitting.");
      return;
    }
    setSubmitLoading(true);
    try {
      const result = await submitCommunityQuizAttempt(communityId, quizDetail._id, {
        answers: selectedAnswers,
        startedAt: quizStartedAt,
      });
      setAttemptResult(result);
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Submission failed";
      Alert.alert("Quiz submission failed", message);
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backLabel}>← Back</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>Events & Quizzes</Text>
          <Text style={styles.subtitle}>{communityName ?? "Community"}</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabBtn, tab === "events" && styles.tabBtnActive]}
          onPress={() => setTab("events")}
        >
          <Text style={[styles.tabText, tab === "events" && styles.tabTextActive]}>Events</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, tab === "quizzes" && styles.tabBtnActive]}
          onPress={() => setTab("quizzes")}
        >
          <Text style={[styles.tabText, tab === "quizzes" && styles.tabTextActive]}>Quizzes</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {tab === "events" ? (
            upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => {
                const state = eventStatusMap[event._id] ?? "cancelled";
                const isRegistered = state === "registered";
                return (
                  <View key={event._id} style={styles.card}>
                    <Text style={styles.cardTitle}>{event.title}</Text>
                    <Text style={styles.cardMeta}>
                      {new Date(event.startAt).toLocaleString()} · {event.location || "Community venue"}
                    </Text>
                    <Text style={styles.cardDesc}>{event.description}</Text>
                    <Text style={styles.cardSubMeta}>
                      {event.rsvps} RSVPs
                      {event.maxParticipants ? ` / ${event.maxParticipants} max` : ""}
                    </Text>
                    <Pressable
                      style={[styles.actionBtn, isRegistered ? styles.cancelBtn : styles.primaryBtn]}
                      onPress={() => handleRsvp(event._id)}
                      disabled={rsvpLoadingId === event._id}
                    >
                      <Text style={[styles.actionBtnText, isRegistered && styles.cancelBtnText]}>
                        {rsvpLoadingId === event._id
                          ? "Updating..."
                          : isRegistered
                            ? "Cancel RSVP"
                            : "RSVP"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            ) : (
              <Text style={styles.empty}>No published events available.</Text>
            )
          ) : quizzes.length > 0 ? (
            quizzes.map((quiz) => (
              <View key={quiz._id} style={styles.card}>
                <Text style={styles.cardTitle}>{quiz.title}</Text>
                <Text style={styles.cardMeta}>
                  {quiz.questionCount} questions · Pass {quiz.passingScore}%
                  {quiz.timeLimitMinutes ? ` · ${quiz.timeLimitMinutes} min` : ""}
                </Text>
                <Text style={styles.cardDesc}>{quiz.description}</Text>
                <Text style={styles.cardSubMeta}>
                  {quiz.attempts} attempts · Avg score {quiz.avgScore}%
                </Text>
                <Pressable
                  style={[styles.actionBtn, styles.primaryBtn]}
                  onPress={() => openQuiz(quiz._id)}
                  disabled={quizLoadingId === quiz._id}
                >
                  <Text style={styles.actionBtnText}>
                    {quizLoadingId === quiz._id ? "Loading..." : "Take Quiz"}
                  </Text>
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No published quizzes available.</Text>
          )}
        </ScrollView>
      )}

      <Modal visible={quizModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{quizDetail?.title ?? "Quiz"}</Text>
              <Pressable onPress={closeQuizModal}>
                <Text style={styles.closeLabel}>Close</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {quizDetail?.questions.map((question, questionIndex) => (
                <View key={question.index} style={styles.questionCard}>
                  <Text style={styles.questionText}>
                    Q{questionIndex + 1}. {question.prompt}
                  </Text>
                  <View style={styles.optionList}>
                    {question.options.map((option, optionIndex) => {
                      const selected = selectedAnswers[questionIndex] === optionIndex;
                      return (
                        <Pressable
                          key={`${question.index}-${optionIndex}`}
                          style={[styles.optionBtn, selected && styles.optionBtnActive]}
                          onPress={() =>
                            setSelectedAnswers((prev) => {
                              const next = [...prev];
                              next[questionIndex] = optionIndex;
                              return next;
                            })
                          }
                        >
                          <Text style={[styles.optionText, selected && styles.optionTextActive]}>
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {attemptResult?.questionResults?.[questionIndex] ? (
                    <Text
                      style={[
                        styles.resultText,
                        attemptResult.questionResults[questionIndex].isCorrect
                          ? styles.resultCorrect
                          : styles.resultWrong,
                      ]}
                    >
                      {attemptResult.questionResults[questionIndex].isCorrect
                        ? "Correct"
                        : `Wrong · Correct option: ${question.options[attemptResult.questionResults[questionIndex].correctIndex]}`}
                    </Text>
                  ) : null}
                </View>
              ))}

              {attemptResult ? (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>
                    Score: {attemptResult.attempt.scorePercent}% ({attemptResult.attempt.correctCount}/
                    {attemptResult.attempt.totalQuestions})
                  </Text>
                  <Text style={styles.summarySub}>
                    {attemptResult.attempt.passed ? "Passed" : "Not passed yet"}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {!attemptResult ? (
              <Pressable style={[styles.actionBtn, styles.primaryBtn]} onPress={submitQuiz} disabled={submitLoading}>
                <Text style={styles.actionBtnText}>{submitLoading ? "Submitting..." : "Submit Quiz"}</Text>
              </Pressable>
            ) : (
              <Pressable style={[styles.actionBtn, styles.primaryBtn]} onPress={closeQuizModal}>
                <Text style={styles.actionBtnText}>Done</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { paddingVertical: SPACING.xs, paddingRight: SPACING.sm },
  backLabel: { color: COLORS.primary, fontWeight: TYPOGRAPHY.weight.semibold, fontSize: TYPOGRAPHY.size.base },
  title: { fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  subtitle: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary, marginTop: 2 },
  tabRow: { flexDirection: "row", gap: SPACING.sm, padding: SPACING.base },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtnActive: { backgroundColor: COLORS.primaryPale, borderColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.size.sm },
  tabTextActive: { color: COLORS.primary, fontWeight: TYPOGRAPHY.weight.semibold },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.base, paddingBottom: SPACING["3xl"], gap: SPACING.sm },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardTitle: { fontSize: TYPOGRAPHY.size.base, fontWeight: TYPOGRAPHY.weight.semibold, color: COLORS.textPrimary },
  cardMeta: { marginTop: SPACING.xs, fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  cardDesc: { marginTop: SPACING.sm, fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  cardSubMeta: { marginTop: SPACING.sm, fontSize: TYPOGRAPHY.size.xs, color: COLORS.textMuted },
  actionBtn: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  primaryBtn: { backgroundColor: COLORS.primary },
  cancelBtn: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.danger },
  actionBtnText: { color: COLORS.primaryContrast, fontWeight: TYPOGRAPHY.weight.semibold, fontSize: TYPOGRAPHY.size.sm },
  cancelBtnText: { color: COLORS.danger },
  empty: { padding: SPACING.lg, color: COLORS.textMuted, textAlign: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: COLORS.overlay },
  modalSheet: {
    maxHeight: "92%",
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.base,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  closeLabel: { color: COLORS.primary, fontWeight: TYPOGRAPHY.weight.semibold },
  modalContent: { paddingVertical: SPACING.sm, paddingBottom: SPACING.lg },
  questionCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  questionText: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.weight.semibold },
  optionList: { marginTop: SPACING.sm, gap: SPACING.xs },
  optionBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  optionBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryPale,
  },
  optionText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.size.sm },
  optionTextActive: { color: COLORS.primary, fontWeight: TYPOGRAPHY.weight.semibold },
  resultText: { marginTop: SPACING.xs, fontSize: TYPOGRAPHY.size.xs },
  resultCorrect: { color: COLORS.success },
  resultWrong: { color: COLORS.danger },
  summaryCard: {
    backgroundColor: COLORS.primaryPale,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  summaryTitle: { fontSize: TYPOGRAPHY.size.base, color: COLORS.primary, fontWeight: TYPOGRAPHY.weight.bold },
  summarySub: { marginTop: SPACING.xs, fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
});
