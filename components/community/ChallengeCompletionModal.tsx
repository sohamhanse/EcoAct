import React from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import type { CommunityChallengeResponse } from "@/src/types";
import type { SharePayload } from "@/components/sharing/ShareCard";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";

type Props = {
  visible: boolean;
  challenge: CommunityChallengeResponse | null;
  communityName?: string;
  onDismiss: () => void;
  onShare?: (payload: SharePayload) => void;
};

export const ChallengeCompletionModal = React.memo(function ChallengeCompletionModal({
  visible,
  challenge,
  communityName = "Our",
  onDismiss,
  onShare,
}: Props) {
  if (!challenge) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>We Did It Together!</Text>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.stats}>
            {challenge.goalCo2Kg} kg CO₂ saved as a community
          </Text>
          <Text style={styles.contributors}>
            {challenge.participantCount} contributors made this happen
          </Text>
          {onShare && (
            <Pressable
              style={styles.shareButton}
              onPress={() => {
                const start = challenge?.startDate ? new Date(challenge.startDate).getTime() : 0;
                const end = challenge?.endDate ? new Date(challenge.endDate).getTime() : 0;
                const days = start && end ? Math.ceil((end - start) / (24 * 60 * 60 * 1000)) : 7;
                onShare({
                  type: "challenge",
                  data: {
                    communityName,
                    co2Kg: challenge?.goalCo2Kg ?? 0,
                    days,
                    memberCount: challenge?.participantCount ?? 0,
                  },
                });
              }}
            >
              <Text style={styles.shareButtonLabel}>🌍 Share with Friends</Text>
            </Pressable>
          )}
          <Pressable style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonLabel}>Awesome!</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  box: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  emoji: {
    fontSize: TYPOGRAPHY.size["4xl"],
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  challengeTitle: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.primary,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  stats: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: "center",
  },
  contributors: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  shareButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignSelf: "stretch",
  },
  shareButtonLabel: {
    color: COLORS.primaryContrast,
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.base,
    textAlign: "center",
  },
  button: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  buttonLabel: {
    color: COLORS.primaryContrast,
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.base,
  },
});
