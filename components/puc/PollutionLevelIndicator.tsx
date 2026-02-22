import { View, StyleSheet } from "react-native";
import type { PollutionLevel } from "@/src/types";
import { SPACING } from "@/constants/spacing";

type Props = {
  level: PollutionLevel;
};

export function PollutionLevelIndicator({ level }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.segment, styles.mild, level === "mild" && styles.active]} />
      <View style={[styles.segment, styles.heavy, level === "heavy" && styles.active]} />
      <View style={[styles.segment, styles.severe, level === "severe" && styles.active]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 6,
    opacity: 0.25,
  },
  active: { opacity: 1 },
  mild: { backgroundColor: "#22C55E" },
  heavy: { backgroundColor: "#F59E0B" },
  severe: { backgroundColor: "#EF4444" },
});

