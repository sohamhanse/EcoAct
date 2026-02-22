import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ActiveMilestone } from "@/api/milestone.api";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";
import { MILESTONE_ICONS } from "@/constants/milestones";

const shadowMd = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
};

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
    <View style={[styles.card, shadowMd]}>
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
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.1,
  },
  daysLeft: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  daysLeftUrgent: {
    color: COLORS.accentWarm,
  },
  body: {
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  desc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progressWrap: {
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: 8,
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
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  bonus: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
