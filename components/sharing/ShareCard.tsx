import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const CARD_WIDTH = 360;
const CARD_HEIGHT = 640;

export interface BadgeShareData {
  badgeName: string;
  co2Saved: number;
  missionsDone: number;
}

export interface ChallengeShareData {
  communityName: string;
  co2Kg: number;
  days: number;
  memberCount: number;
}

export interface FootprintShareData {
  improvementPercent: number;
  from: number;
  to: number;
  progressPercent: number;
}

export type SharePayload =
  | { type: "badge"; data: BadgeShareData }
  | { type: "challenge"; data: ChallengeShareData }
  | { type: "footprint"; data: FootprintShareData };

type Props = SharePayload;

export const ShareCard = React.forwardRef<View, Props>(function ShareCard(props, _ref) {
  if (props.type === "badge") {
    return (
      <View style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
        <LinearGradient
          colors={["#0F1912", "#1A6B3C"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <Text style={styles.badgeEmoji}>🏅</Text>
          <Text style={styles.badgeLine1}>I just earned</Text>
          <Text style={styles.badgeLine2}>{props.data.badgeName}</Text>
          <Text style={styles.badgeLine3}>on EcoAct</Text>
          <View style={styles.divider} />
          <Text style={styles.badgeStats}>
            {props.data.co2Saved} kg CO₂ saved · {props.data.missionsDone} missions done
          </Text>
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>🌿 EcoAct</Text>
            <Text style={styles.footerTag}>Track. Act. Reduce.</Text>
          </View>
        </View>
      </View>
    );
  }

  if (props.type === "challenge") {
    return (
      <View style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
        <LinearGradient
          colors={["#1A6B3C", "#00C896"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <Text style={styles.challengeEmoji}>🌍</Text>
          <Text style={styles.challengeTitle}>We did it together!</Text>
          <Text style={styles.challengeLine1}>
            {props.data.communityName} community saved
          </Text>
          <Text style={styles.challengeBig}>{props.data.co2Kg} kg CO₂</Text>
          <Text style={styles.challengeLine2}>in just {props.data.days} days</Text>
          <Text style={styles.challengeContrib}>
            {props.data.memberCount} contributors made this happen
          </Text>
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>🌿 EcoAct</Text>
          </View>
        </View>
      </View>
    );
  }

  if (props.type === "footprint") {
    return (
      <View style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
        <LinearGradient
          colors={["#0F1912", "#1A2E20"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <Text style={styles.footprintLine1}>My carbon footprint</Text>
          <Text style={styles.footprintLine2}>dropped by</Text>
          <Text style={styles.footprintBig}>{props.data.improvementPercent}%</Text>
          <Text style={styles.footprintLine3}>this month 🌱</Text>
          <Text style={styles.footprintStats}>
            From {props.data.from.toLocaleString()} kg → {props.data.to.toLocaleString()} kg CO₂/year
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${props.data.progressPercent}%` },
              ]}
            />
          </View>
          <Text style={styles.footprintProgress}>
            {props.data.progressPercent}% of the way to carbon neutral
          </Text>
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>🌿 EcoAct</Text>
          </View>
        </View>
      </View>
    );
  }

  return null;
});

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 16,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeEmoji: { fontSize: 80, marginBottom: SPACING.md },
  badgeLine1: { fontSize: 16, color: "#fff", fontFamily: "System" },
  badgeLine2: { fontSize: 32, fontWeight: "700", color: "#fff", marginTop: 4 },
  badgeLine3: { fontSize: 16, color: "#fff", marginTop: 4 },
  divider: {
    width: 120,
    height: 1,
    backgroundColor: COLORS.accent,
    marginVertical: SPACING.md,
  },
  badgeStats: { fontSize: 14, color: COLORS.accent },
  challengeEmoji: { fontSize: 64, marginBottom: SPACING.sm },
  challengeTitle: { fontSize: 28, fontWeight: "700", color: "#fff", textAlign: "center" },
  challengeLine1: { fontSize: 16, color: "#fff", marginTop: SPACING.md },
  challengeBig: { fontSize: 48, fontWeight: "800", color: "#fff", marginVertical: 4 },
  challengeLine2: { fontSize: 16, color: "#fff" },
  challengeContrib: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: SPACING.md },
  footprintLine1: { fontSize: 16, color: "#fff" },
  footprintLine2: { fontSize: 16, color: "#fff", marginTop: 4 },
  footprintBig: { fontSize: 72, fontWeight: "800", color: COLORS.accent, marginVertical: 4 },
  footprintLine3: { fontSize: 16, color: "#fff" },
  footprintStats: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: SPACING.md },
  progressBar: {
    width: "80%",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: SPACING.md,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  footprintProgress: { fontSize: 13, color: "#fff", marginTop: SPACING.sm },
  footer: {
    position: "absolute",
    bottom: SPACING.xl,
    alignItems: "center",
  },
  footerBrand: { fontSize: 14, color: "rgba(255,255,255,0.9)" },
  footerTag: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
});
