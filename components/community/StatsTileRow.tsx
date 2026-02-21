import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";

const shadowMd = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
};

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
      <View style={[styles.tile, shadowMd]}>
        <Text style={styles.label}>This Month</Text>
        <Text style={styles.value}>{thisMonthCo2} kg</Text>
        <Text style={styles.sublabel}>CO₂ saved</Text>
      </View>
      <View style={[styles.tile, shadowMd]}>
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
      <View style={[styles.tile, shadowMd]}>
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
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 4,
  },
  valuePositive: {
    color: COLORS.success,
  },
  valueNegative: {
    color: COLORS.danger,
  },
  sublabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
