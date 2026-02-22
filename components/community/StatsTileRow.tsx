import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SHADOWS } from "@/constants/shadows";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";

type Props = {
  thisMonthCo2: number;
  monthOverMonthChange: number;
  avgCo2PerMember: number;
};

export const StatsTileRow = React.memo(function StatsTileRow({
  thisMonthCo2,
  monthOverMonthChange,
  avgCo2PerMember,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.tile, SHADOWS.md]}>
        <Text style={styles.label}>This Month</Text>
        <Text style={styles.value}>{thisMonthCo2} kg</Text>
        <Text style={styles.sublabel}>CO₂ saved</Text>
      </View>
      <View style={[styles.tile, SHADOWS.md]}>
        <Text style={styles.label}>vs Last Month</Text>
        <Text
          style={[
            styles.value,
            monthOverMonthChange >= 0 ? styles.valuePositive : styles.valueNegative,
          ]}
        >
          {monthOverMonthChange >= 0 ? "+" : ""}
          {monthOverMonthChange}%
        </Text>
        <Text style={styles.sublabel}>
          {monthOverMonthChange >= 0 ? "↑ more action" : "↓ less action"}
        </Text>
      </View>
      <View style={[styles.tile, SHADOWS.md]}>
        <Text style={styles.label}>Per Member</Text>
        <Text style={styles.value}>{avgCo2PerMember} kg</Text>
        <Text style={styles.sublabel}>avg</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  value: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  valuePositive: {
    color: COLORS.success,
  },
  valueNegative: {
    color: COLORS.danger,
  },
  sublabel: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
