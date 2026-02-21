import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import type { CommunityChallengeResponse } from "@/src/types";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";

type Props = {
  challenge: CommunityChallengeResponse | null;
};

function countdownText(days: number, hours: number): string {
  if (days > 0) return `${days} day${days === 1 ? "" : "s"} left`;
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} left`;
  return "Ending soon";
}

export const ChallengeCard = React.memo(function ChallengeCard({ challenge }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (challenge) {
      progress.value = withSpring(Math.min(100, challenge.progressPercent), {
        damping: 15,
        stiffness: 90,
      });
    }
  }, [challenge?.progressPercent, challenge?._id]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  if (!challenge) return null;

  const isCompleted = challenge.status === "completed";
  const isFailed = challenge.status === "failed";
  const isActive = challenge.status === "active";
  const countdown = countdownText(challenge.daysRemaining, challenge.hoursRemaining);
  const isUrgent = isActive && challenge.daysRemaining === 0 && challenge.hoursRemaining < 6;

  return (
    <View
      style={[
        styles.card,
        isCompleted && styles.cardCompleted,
        isFailed && styles.cardFailed,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{isCompleted ? "🎉" : isFailed ? "⏱" : "🏆"}</Text>
        <Text
          style={[
            styles.badge,
            isCompleted && styles.badgeCompleted,
            isFailed && styles.badgeFailed,
            isUrgent && styles.badgeUrgent,
          ]}
        >
          {isCompleted ? "COMPLETED ✓" : isFailed ? "FAILED" : "ACTIVE CHALLENGE"}
        </Text>
        {isActive && (
          <Text style={[styles.countdown, isUrgent && styles.countdownUrgent]}>
            {countdown}
          </Text>
        )}
      </View>
      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {challenge.description}
      </Text>
      {!isFailed && (
        <View style={styles.progressWrap}>
          <Animated.View style={[styles.progressFill, progressBarStyle]} />
        </View>
      )}
      <Text style={styles.stats}>
        {Math.round(challenge.currentCo2Kg)} kg saved of {challenge.goalCo2Kg} kg goal
      </Text>
      <Text style={styles.contributors}>👥 {challenge.participantCount} contributors</Text>
      {isCompleted && challenge.completedAt && (
        <Text style={styles.completedAt}>
          Goal reached on {new Date(challenge.completedAt).toLocaleDateString()}
        </Text>
      )}
      {isFailed && (
        <Text style={styles.failedCopy}>Better luck next time. Final progress above.</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primaryPale,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.md,
  },
  cardCompleted: {
    borderLeftColor: COLORS.accent,
    backgroundColor: COLORS.primaryPale,
  },
  cardFailed: {
    opacity: 0.85,
    borderLeftColor: COLORS.textMuted,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  emoji: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  badgeCompleted: {
    color: COLORS.accent,
  },
  badgeFailed: {
    color: COLORS.textMuted,
  },
  badgeUrgent: {
    color: COLORS.danger,
  },
  countdown: {
    marginLeft: "auto",
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  countdownUrgent: {
    color: COLORS.danger,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  progressWrap: {
    height: 10,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    overflow: "hidden",
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
  },
  stats: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  contributors: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  completedAt: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  failedCopy: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});

const SHADOWS = {
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};
