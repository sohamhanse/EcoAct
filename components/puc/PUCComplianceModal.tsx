import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";

type Props = {
  visible: boolean;
  pointsAwarded: number;
  co2ImpactKg: number;
  onClose: () => void;
  onShare?: () => void;
};

export function PUCComplianceModal({
  visible,
  pointsAwarded,
  co2ImpactKg,
  onClose,
  onShare,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>PUC Logged</Text>
          <Text style={styles.value}>+{pointsAwarded} pts earned</Text>
          <Text style={styles.subtext}>~{co2ImpactKg} kg CO2e prevented/year</Text>
          <Text style={styles.caption}>Compliance is environmental action.</Text>
          <View style={styles.row}>
            {onShare ? (
              <Pressable style={[styles.btn, styles.ghostBtn]} onPress={onShare}>
                <Text style={styles.ghostLabel}>Share</Text>
              </Pressable>
            ) : null}
            <Pressable style={[styles.btn, styles.primaryBtn]} onPress={onClose}>
              <Text style={styles.primaryLabel}>Awesome</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.base,
  },
  modal: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
  },
  value: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.primary,
  },
  subtext: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  caption: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textMuted,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  btn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
  },
  primaryLabel: {
    color: COLORS.primaryContrast,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  ghostLabel: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
});

