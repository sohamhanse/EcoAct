import { View, Text, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "@/constants/typography";
import { SPACING } from "@/constants/spacing";
import type { PUCStatusType } from "@/src/types";

type Props = {
  status: PUCStatusType;
  compact?: boolean;
};

const statusConfig: Record<PUCStatusType, { label: string; bg: string; text: string; dot: string }> = {
  valid: { label: "VALID", bg: "#E8F5EE", text: "#1A6B3C", dot: "#1A6B3C" },
  expiring_soon: { label: "EXPIRING", bg: "#FEF3C7", text: "#D97706", dot: "#D97706" },
  expired: { label: "EXPIRED", bg: "#FEE2E2", text: "#DC2626", dot: "#DC2626" },
  no_record: { label: "NO RECORD", bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
  exempt: { label: "EXEMPT", bg: "#EFF6FF", text: "#3B82F6", dot: "#3B82F6" },
};

export function PUCStatusBadge({ status, compact }: Props) {
  const cfg = statusConfig[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, compact && styles.badgeCompact]}>
      <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  badgeCompact: {
    paddingVertical: 4,
    paddingHorizontal: SPACING.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.semibold,
    letterSpacing: 0.3,
  },
});

