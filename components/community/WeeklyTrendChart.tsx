import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";

type DataPoint = { date: string; dayLabel: string; co2Saved: number; missionCount: number };

type Props = {
  data: DataPoint[];
  maxValue?: number;
};

export const WeeklyTrendChart = React.memo(function WeeklyTrendChart({ data, maxValue }: Props) {
  const max = maxValue ?? Math.max(1, ...data.map((d) => d.co2Saved));
  const height = 80;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>WEEKLY ACTIVITY</Text>
      <View style={styles.chartRow}>
        {data.length === 0 ? (
          <Text style={styles.empty}>No data this week</Text>
        ) : (
          data.map((d) => (
            <View key={d.date} style={styles.barWrap}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: max > 0 ? (d.co2Saved / max) * height : 0,
                    },
                  ]}
                />
              </View>
              <Text style={styles.dayLabel}>{d.dayLabel}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 100,
    paddingHorizontal: SPACING.xs,
  },
  barWrap: {
    flex: 1,
    alignItems: "center",
  },
  barContainer: {
    height: 80,
    width: "70%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "100%",
    minHeight: 4,
    backgroundColor: COLORS.accent,
    borderTopLeftRadius: RADIUS.sm,
    borderTopRightRadius: RADIUS.sm,
  },
  dayLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  empty: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    flex: 1,
  },
});
