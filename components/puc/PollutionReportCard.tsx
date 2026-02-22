import { View, Text, StyleSheet } from "react-native";
import type { ApiPollutionReport } from "@/src/types";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";
import { PollutionLevelIndicator } from "./PollutionLevelIndicator";

type Props = {
  report: ApiPollutionReport;
};

function timeAgo(raw: string): string {
  const date = new Date(raw);
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  return `${Math.floor(diffSec / 86400)} day(s) ago`;
}

export function PollutionReportCard({ report }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {report.pollutionLevel.toUpperCase()} · {report.vehicleType.replace("_", " ")}
      </Text>
      <Text style={styles.meta}>{report.locationName || `${report.city}, ${report.state}`}</Text>
      <Text style={styles.metaSmall}>{timeAgo(report.reportedAt)}</Text>
      <View style={styles.indicatorWrap}>
        <PollutionLevelIndicator level={report.pollutionLevel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
    textTransform: "capitalize",
  },
  meta: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
  },
  metaSmall: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
  },
  indicatorWrap: {
    marginTop: SPACING.sm,
  },
});

