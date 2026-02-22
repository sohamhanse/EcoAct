import React from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import type { CommunityChallengeResponse } from "@/src/types";
import type { SharePayload } from "@/components/sharing/ShareCard";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";

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
    backgroundColor: "rgba(0,0,0,0.5)",
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
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  stats: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: "center",
  },
  contributors: {
    fontSize: 14,
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
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
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
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
