import { View, Text, StyleSheet, Pressable } from "react-native";
import type { ApiVehicleWithStatus } from "@/src/types";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";
import { PUCStatusBadge } from "./PUCStatusBadge";

type Props = {
  item: ApiVehicleWithStatus;
  onLog: () => void;
  onViewHistory: () => void;
};

function progressColor(percentUsed: number): string {
  if (percentUsed > 90) return COLORS.danger;
  if (percentUsed > 70) return COLORS.warning;
  return COLORS.success;
}

function statusLine(item: ApiVehicleWithStatus): string {
  const s = item.pucStatus;
  if (s.status === "exempt") return "Electric vehicles are PUC-exempt.";
  if (s.status === "no_record") return "No PUC record yet.";
  if (s.status === "expired") return `Expired ${Math.abs(s.daysRemaining)} day(s) ago. Fine risk: INR 10,000.`;
  if (s.status === "expiring_soon") return `PUC expires in ${s.daysRemaining} day(s).`;
  return `PUC valid for ${s.daysRemaining} more day(s).`;
}

export function VehicleCard({ item, onLog, onViewHistory }: Props) {
  const validityDays = item.pucStatus.validityDays ?? 0;
  const daysRemaining = Math.max(0, item.pucStatus.daysRemaining);
  const usedPercent =
    validityDays > 0
      ? Math.max(0, Math.min(100, Math.round(((validityDays - daysRemaining) / validityDays) * 100)))
      : 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.nickname}>{item.vehicle.nickname}</Text>
        <PUCStatusBadge status={item.pucStatus.status} />
      </View>
      <Text style={styles.meta}>
        {[item.vehicle.brand, item.vehicle.model].filter(Boolean).join(" ")} · {item.vehicle.vehicleNumber}
      </Text>
      <Text style={styles.metaSecondary}>
        {item.vehicle.fuelType.replace("_", " ")} · {item.vehicle.vehicleType.replace("_", " ")}
      </Text>
      <Text style={[styles.statusLine, item.pucStatus.status === "expired" && styles.statusLineDanger]}>
        {statusLine(item)}
      </Text>

      {item.pucStatus.status !== "exempt" && validityDays > 0 ? (
        <>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${usedPercent}%`, backgroundColor: progressColor(usedPercent) }]} />
          </View>
          <Text style={styles.progressLabel}>{usedPercent}% of validity period used</Text>
        </>
      ) : null}

      <View style={styles.buttonRow}>
        {item.pucStatus.status !== "exempt" ? (
          <Pressable style={[styles.btn, styles.primaryBtn]} onPress={onLog}>
            <Text style={styles.primaryBtnLabel}>
              {item.pucStatus.status === "expired" ? "Log PUC Now - Urgent" : "Log PUC"}
            </Text>
          </Pressable>
        ) : null}
        <Pressable style={[styles.btn, styles.ghostBtn]} onPress={onViewHistory}>
          <Text style={styles.ghostBtnLabel}>View History</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nickname: {
    flex: 1,
    marginRight: SPACING.sm,
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
  },
  meta: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  metaSecondary: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    textTransform: "capitalize",
  },
  statusLine: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  statusLineDanger: {
    color: COLORS.danger,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  progressTrack: {
    marginTop: SPACING.sm,
    height: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primaryPale,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
  },
  progressLabel: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
  },
  buttonRow: {
    marginTop: SPACING.md,
    flexDirection: "row",
    gap: SPACING.sm,
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
  primaryBtnLabel: {
    color: COLORS.primaryContrast,
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.sm,
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  ghostBtnLabel: {
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.sm,
  },
});

