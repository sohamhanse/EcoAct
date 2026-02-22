import { COLORS } from "@/constants/colors";
import {
    OFFSET_PROVIDERS,
    calculateOffsetCost,
} from "@/constants/offsetProviders";
import { RADIUS } from "@/constants/radius";
import { SHADOWS } from "@/constants/shadows";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";
import { useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
          <View key={p.id} style={[styles.providerCard, SHADOWS.sm]}>
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
        EcoAct does not receive commission. These are independent verified providers.
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
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  heroSub: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.xs,
  },
  heroCost: {
    fontSize: TYPOGRAPHY.size["3xl"],
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.primary,
    textAlign: "center",
    marginVertical: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  trees: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.accent,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  providersTitle: {
    fontSize: TYPOGRAPHY.size.xs,
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
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
  },
  indiaBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  indiaBadgeText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.primaryContrast,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  providerDesc: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  verification: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.accent,
    marginTop: SPACING.xs,
  },
  providerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  price: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  offsetBtn: {},
  offsetBtnText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.primary,
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.size.xs,
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
    borderColor: COLORS.primaryBorderSubtle,
  },
  reduceTitle: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.primary,
  },
  reduceBody: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  missionsBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  missionsBtnLabel: {
    color: COLORS.primaryContrast,
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.base,
  },
});
