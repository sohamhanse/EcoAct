import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";

type Contributor = {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  co2Saved: number;
  missionCount: number;
};

type Props = {
  contributors: Contributor[];
  currentUserId?: string | null;
  currentUserRank?: number | null;
};

const medals = ["🥇", "🥈", "🥉"];

export const TopContributorRow = React.memo(function TopContributorRow({
  contributors,
  currentUserId,
  currentUserRank,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>TOP CONTRIBUTORS THIS MONTH</Text>
      {contributors.map((c) => (
        <View
          key={c.userId}
          style={[
            styles.row,
            currentUserId === c.userId && styles.rowHighlight,
          ]}
        >
          <Text style={styles.medal}>{c.rank <= 3 ? medals[c.rank - 1] : "  "}</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(c.name ?? "?")[0]}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{c.name}</Text>
            <Text style={styles.meta}>
              {c.co2Saved} kg  •  {c.missionCount} missions
            </Text>
          </View>
        </View>
      ))}
      {currentUserRank != null && currentUserRank > 5 && (
        <Text style={styles.youRank}>You're #{currentUserRank} this month</Text>
      )}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowHighlight: {
    backgroundColor: COLORS.primaryPale,
  },
  medal: {
    width: 28,
    fontSize: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  youRank: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});
