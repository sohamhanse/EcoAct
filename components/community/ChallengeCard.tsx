import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import type { CommunityChallengeResponse } from "@/src/types";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SHADOWS } from "@/constants/shadows";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";

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
    borderLeftWidth: SPACING.xs,
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
    fontSize: TYPOGRAPHY.size.md,
    marginRight: SPACING.sm,
  },
  badge: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
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
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
  },
  countdownUrgent: {
    color: COLORS.danger,
  },
  title: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: TYPOGRAPHY.size.sm,
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
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  contributors: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  completedAt: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  failedCopy: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});
