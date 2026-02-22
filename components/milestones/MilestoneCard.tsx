import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ActiveMilestone } from "@/api/milestone.api";
import { COLORS } from "@/constants/colors";
import { MILESTONE_ICONS } from "@/constants/milestones";
import { RADIUS } from "@/constants/radius";
import { SHADOWS } from "@/constants/shadows";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";

type Props = {
  milestone: ActiveMilestone;
};

export const MilestoneCard = React.memo(function MilestoneCard({ milestone }: Props) {
  const icon = MILESTONE_ICONS[milestone.icon] ?? "🍃";
  const isUrgent = milestone.daysRemaining <= 2;
  const progressPct = milestone.progress.percentComplete;
  const { currentValue, targetValue, unit } = milestone.progress;
  const unitLabel = unit === "kg_co2" ? "kg" : unit === "missions" ? "missions" : "days";

  return (
    <View style={[styles.card, SHADOWS.md]}>
      <View style={styles.header}>
        <Text style={styles.period}>{milestone.periodLabel.toUpperCase()}</Text>
        <Text style={[styles.daysLeft, isUrgent && styles.daysLeftUrgent]}>
          {milestone.daysRemaining} days left
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{milestone.label}</Text>
        <Text style={styles.desc}>{milestone.description}</Text>
      </View>
      <View style={styles.progressWrap}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(100, progressPct)}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {progressPct}% · {currentValue}/{targetValue} {unitLabel}
        </Text>
      </View>
      <Text style={styles.bonus}>+{milestone.reward.bonusPoints} pts on completion</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  period: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    letterSpacing: 0.1,
  },
  daysLeft: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
  },
  daysLeftUrgent: {
    color: COLORS.accentWarm,
  },
  body: {
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: TYPOGRAPHY.size.xl,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
  },
  desc: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progressWrap: {
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: SPACING.sm,
    backgroundColor: COLORS.primaryPale,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
  },
  progressText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  bonus: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
});
