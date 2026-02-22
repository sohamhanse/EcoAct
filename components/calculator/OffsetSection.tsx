import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useNavigation } from "@react-navigation/native";
import {
  OFFSET_PROVIDERS,
  calculateOffsetCost,
} from "@/constants/offsetProviders";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";

const shadowSm = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
};

type Props = {
  co2Kg: number;
};

export function OffsetSection({ co2Kg }: Props) {
  const navigation = useNavigation();
  const { avgCostInr, treesEquivalent } = calculateOffsetCost(co2Kg);
  const monthlyEst = Math.round(avgCostInr / 12);

  async function openProvider(url: string) {
    await WebBrowser.openBrowserAsync(url);
  }

  function goToMissions() {
    (navigation as { navigate: (name: string) => void }).navigate("Missions");
  }

  return (
    <View style={styles.section}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>OFFSET YOUR FOOTPRINT</Text>
        <View style={styles.dividerLine} />
      </View>

      <Text style={styles.heroTitle}>You could make this year carbon neutral</Text>
      <Text style={styles.heroSub}>for as little as</Text>
      <Text style={styles.heroCost}>₹{avgCostInr.toLocaleString()}</Text>
      <Text style={styles.heroSub}>per year (~₹{monthlyEst}/month)</Text>
      <Text style={styles.trees}>That's equivalent to planting {treesEquivalent} trees 🌳</Text>

      <Text style={styles.providersTitle}>VERIFIED OFFSET PROVIDERS</Text>

      {OFFSET_PROVIDERS.map((p) => {
        const costPerYear = Math.round(co2Kg * p.pricePerKgInr);
        return (
          <View key={p.id} style={[styles.providerCard, shadowSm]}>
            <View style={styles.providerHeader}>
              <Text style={styles.providerName}>{p.name}</Text>
              {p.indiaFocused && (
                <View style={styles.indiaBadge}>
                  <Text style={styles.indiaBadgeText}>India</Text>
                </View>
              )}
            </View>
            <Text style={styles.providerDesc}>{p.description}</Text>
            <Text style={styles.verification}>✓ {p.verificationBadge}</Text>
            <View style={styles.providerFooter}>
              <Text style={styles.price}>
                ₹{p.pricePerKgInr}/kg · ₹{costPerYear.toLocaleString()}/year
              </Text>
              <Pressable
                style={styles.offsetBtn}
                onPress={() => openProvider(p.url)}
              >
                <Text style={styles.offsetBtnText}>Offset Now →</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <Text style={styles.disclaimer}>
        EcoTrack does not receive commission. These are independent verified providers.
      </Text>

      <View style={styles.reduceCard}>
        <Text style={styles.reduceTitle}>But first — reduce before you offset.</Text>
        <Text style={styles.reduceBody}>
          Every kg reduced is worth more than any kg offset. Start with missions →
        </Text>
        <Pressable style={styles.missionsBtn} onPress={goToMissions}>
          <Text style={styles.missionsBtnLabel}>Explore Missions</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACING.xl },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerLabel: {
    marginHorizontal: SPACING.md,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  heroCost: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.primary,
    textAlign: "center",
    marginVertical: SPACING.sm,
    fontFamily: "monospace",
  },
  trees: {
    fontSize: 14,
    color: COLORS.accent,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  providersTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  providerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  providerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  providerName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  indiaBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  indiaBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  providerDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  verification: {
    fontSize: 11,
    color: COLORS.accent,
    marginTop: 4,
  },
  providerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  price: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  offsetBtn: {},
  offsetBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  reduceCard: {
    backgroundColor: COLORS.primaryPale,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
  },
  reduceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  reduceBody: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  missionsBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  missionsBtnLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
