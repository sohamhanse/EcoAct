import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";

type Props = {
  name: string;
  type: string;
  memberCount: number;
  totalCo2Saved: number;
};

const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  college: "school",
  city: "business",
  company: "briefcase",
};

export const CommunityHeroBanner = React.memo(function CommunityHeroBanner({
  name,
  type,
  memberCount,
  totalCo2Saved,
}: Props) {
  const iconName = typeIcons[type] ?? "people";
  return (
    <View style={styles.gradient}>
      <View style={styles.iconRow}>
        <Ionicons name={iconName} size={24} color={COLORS.primaryContrast} />
        <Text style={styles.name}>{name}</Text>
      </View>
      <Text style={styles.meta}>
        {type.charAt(0).toUpperCase() + type.slice(1)} Community  •  {memberCount} members
      </Text>
      <Text style={styles.co2}>{totalCo2Saved.toLocaleString()} kg CO₂ saved all time</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  gradient: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  name: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.primaryContrast,
  },
  meta: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.primaryContrastMuted,
    marginTop: SPACING.xs,
  },
  co2: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.primaryContrast,
    marginTop: SPACING.sm,
  },
});
