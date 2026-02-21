import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ActivityFeedItem } from "@/src/types";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";

type Props = {
  item: ActivityFeedItem;
  isHighlight?: boolean;
};

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  mission_complete: "leaf",
  member_joined: "person-add",
  badge_earned: "trophy",
  challenge_completed: "flag",
  milestone: "trending-up",
};

export const ActivityRow = React.memo(function ActivityRow({ item, isHighlight }: Props) {
  const iconName = iconMap[item.type] ?? "ellipse";
  return (
    <View style={[styles.row, isHighlight && styles.rowHighlight]}>
      <View style={[styles.iconWrap, { backgroundColor: item.iconColor + "20" }]}>
        <Ionicons name={iconName} size={18} color={item.iconColor} />
      </View>
      <View style={styles.body}>
        <Text style={styles.text} numberOfLines={2}>
          {item.text}
        </Text>
        <Text style={styles.subtext} numberOfLines={1}>
          {item.subtext}
        </Text>
      </View>
      <Text style={styles.timeAgo}>{item.timeAgo}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowHighlight: {
    backgroundColor: COLORS.primaryPale,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  body: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  subtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
  },
});
