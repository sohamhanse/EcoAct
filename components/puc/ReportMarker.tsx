import { View, Text, StyleSheet } from "react-native";
import type { PollutionLevel } from "@/src/types";
import { TYPOGRAPHY } from "@/constants/typography";

type Props = {
  level: PollutionLevel;
  count?: number;
};

const COLORS_BY_LEVEL: Record<PollutionLevel, string> = {
  mild: "#22C55E",
  heavy: "#F59E0B",
  severe: "#EF4444",
};

export function ReportMarker({ level, count }: Props) {
  const bg = COLORS_BY_LEVEL[level];
  return (
    <View style={[styles.marker, { backgroundColor: bg }]}>
      <Text style={styles.text}>{count ?? "!"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  text: {
    color: "#fff",
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
});

