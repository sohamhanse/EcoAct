import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";

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
        <Ionicons name={iconName} size={24} color="#fff" />
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
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  meta: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: SPACING.xs,
  },
  co2: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginTop: SPACING.sm,
  },
});
