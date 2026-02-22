import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";
import { getVehicleHistory, getVehicleStatus } from "@/api/puc.api";
import { PUCStatusBadge } from "@/components/puc/PUCStatusBadge";
import type { ApiPUCRecord, ApiVehicle, ApiVehiclePUCStatus } from "@/src/types";
import type { PUCStackParamList } from "@/navigation/PUCNavigator";

type Nav = NativeStackNavigationProp<PUCStackParamList, "VehicleDetail">;
type ScreenRoute = RouteProp<PUCStackParamList, "VehicleDetail">;

export default function VehicleDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const { vehicleId } = route.params;

  const [vehicle, setVehicle] = useState<ApiVehicle | null>(null);
  const [status, setStatus] = useState<ApiVehiclePUCStatus | null>(null);
  const [history, setHistory] = useState<ApiPUCRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        getVehicleStatus(vehicleId),
        getVehicleHistory(vehicleId),
      ]);
      setVehicle(statusRes.vehicle);
      setStatus(statusRes.pucStatus);
      setHistory(historyRes.history);
    } catch {
      setVehicle(null);
      setStatus(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!vehicle || !status) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Vehicle details unavailable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Vehicle Detail</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleName}>{vehicle.nickname}</Text>
          <Text style={styles.vehicleMeta}>
            {[vehicle.brand, vehicle.model].filter(Boolean).join(" ")} · {vehicle.vehicleNumber}
          </Text>
          <Text style={styles.vehicleMetaSecondary}>
            {vehicle.vehicleType.replace("_", " ")} · {vehicle.fuelType}
          </Text>
          <View style={styles.badgeWrap}>
            <PUCStatusBadge status={status.status} />
          </View>
          {status.expiryDate ? (
            <Text style={styles.vehicleStatusText}>
              Expires on {new Date(status.expiryDate).toLocaleDateString()} ({status.daysRemaining} day(s) remaining)
            </Text>
          ) : (
            <Text style={styles.vehicleStatusText}>
              {status.status === "exempt" ? "Electric vehicle. No PUC needed." : "No PUC record yet."}
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Certificate History</Text>
        {history.length === 0 ? (
          <Text style={styles.empty}>No certificates logged yet.</Text>
        ) : (
          history.map((record) => (
            <View key={record._id} style={styles.timelineCard}>
              <View style={styles.timelineHead}>
                <Text style={styles.timelineTitle}>{new Date(record.testDate).toLocaleDateString()}</Text>
                <Text style={[styles.timelineStatus, record.isOnTime ? styles.onTime : styles.late]}>
                  {record.isOnTime ? "ON TIME" : "LATE"} · +{record.pointsAwarded} pts
                </Text>
              </View>
              <Text style={styles.timelineMeta}>Expires: {new Date(record.expiryDate).toLocaleDateString()}</Text>
              {(record.pucCenterName || record.pucCenterCity) ? (
                <Text style={styles.timelineMeta}>
                  Center: {[record.pucCenterName, record.pucCenterCity].filter(Boolean).join(", ")}
                </Text>
              ) : null}
              <Text style={styles.timelineMeta}>
                CO: {record.readings.co ?? "-"} · HC: {record.readings.hc ?? "-"} · Smoke: {record.readings.smokeOpacity ?? "-"} · {record.readings.result.toUpperCase()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {vehicle.fuelType !== "electric" ? (
        <View style={styles.footer}>
          <Pressable style={styles.logBtn} onPress={() => navigation.navigate("LogPUC", { vehicleId })}>
            <Text style={styles.logBtnLabel}>Log New PUC Certificate</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { marginRight: SPACING.sm, paddingVertical: SPACING.xs },
  backLabel: { color: COLORS.primary, fontWeight: TYPOGRAPHY.weight.semibold, fontSize: TYPOGRAPHY.size.base },
  title: { fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  content: { padding: SPACING.base, paddingBottom: SPACING["3xl"] },
  vehicleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  vehicleName: { fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  vehicleMeta: { marginTop: SPACING.xs, fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  vehicleMetaSecondary: { marginTop: 2, fontSize: TYPOGRAPHY.size.xs, color: COLORS.textMuted, textTransform: "capitalize" },
  badgeWrap: { marginTop: SPACING.sm },
  vehicleStatusText: { marginTop: SPACING.sm, fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  timelineCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  timelineHead: { flexDirection: "row", justifyContent: "space-between", gap: SPACING.sm },
  timelineTitle: { fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  timelineStatus: { fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.semibold },
  onTime: { color: COLORS.success },
  late: { color: COLORS.warning },
  timelineMeta: { marginTop: SPACING.xs, fontSize: TYPOGRAPHY.size.xs, color: COLORS.textSecondary },
  footer: {
    padding: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  logBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  logBtnLabel: {
    color: "#052E22",
    fontWeight: TYPOGRAPHY.weight.bold,
    fontSize: TYPOGRAPHY.size.base,
  },
  empty: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textMuted, textAlign: "center" },
});

