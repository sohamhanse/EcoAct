import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";
import { usePUCVehicles } from "@/hooks/usePUCVehicles";
import { usePollutionMap } from "@/hooks/usePollutionMap";
import { VehicleCard } from "@/components/puc/VehicleCard";
import { PollutionReportCard } from "@/components/puc/PollutionReportCard";
import { ReportMarker } from "@/components/puc/ReportMarker";
import type { PUCStackParamList } from "@/navigation/PUCNavigator";

type Nav = NativeStackNavigationProp<PUCStackParamList, "PUCHome">;
type InternalTab = "vehicles" | "report_map";

export default function PUCHomeScreen() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<InternalTab>("vehicles");
  const {
    dashboard,
    loading: vehiclesLoading,
    refetch: refetchVehicles,
  } = usePUCVehicles();
  const {
    mapData,
    filteredReports,
    loading: mapLoading,
    refetch: refetchMap,
    hours,
    setHours,
  } = usePollutionMap();

  const refreshing = vehiclesLoading || mapLoading;
  const complianceProgress = useMemo(() => {
    if (!dashboard?.summary.totalVehicles) return 0;
    return Math.round((dashboard.summary.compliantCount / dashboard.summary.totalVehicles) * 100);
  }, [dashboard]);

  function onRefresh() {
    refetchVehicles();
    refetchMap();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PUC</Text>
        <Text style={styles.subtitle}>Compliance Tracker + Community Reporting</Text>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabBtn, tab === "vehicles" && styles.tabBtnActive]}
          onPress={() => setTab("vehicles")}
        >
          <Text style={[styles.tabText, tab === "vehicles" && styles.tabTextActive]}>MY VEHICLES</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, tab === "report_map" && styles.tabBtnActive]}
          onPress={() => setTab("report_map")}
        >
          <Text style={[styles.tabText, tab === "report_map" && styles.tabTextActive]}>REPORT MAP</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {tab === "vehicles" ? (
          vehiclesLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
          ) : (
            <>
              <View style={styles.summaryCard}>
                <View style={styles.summaryHead}>
                  <Text style={styles.summaryTitle}>MY VEHICLES</Text>
                  <Pressable onPress={() => navigation.navigate("AddVehicle")} style={styles.addBtn}>
                    <Text style={styles.addBtnLabel}>+ Add Vehicle</Text>
                  </Pressable>
                </View>
                <Text style={styles.summaryText}>
                  {dashboard?.summary.compliantCount ?? 0} of {dashboard?.summary.totalVehicles ?? 0} vehicles compliant
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${complianceProgress}%` }]} />
                </View>
                <Text style={styles.summaryText}>{complianceProgress}% compliance rate</Text>
              </View>

              {(dashboard?.vehicles?.length ?? 0) === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>CAR</Text>
                  <Text style={styles.emptyTitle}>Add your vehicle</Text>
                  <Text style={styles.emptyCopy}>Track PUC status and earn points every time you comply.</Text>
                  <Pressable style={styles.primaryAction} onPress={() => navigation.navigate("AddVehicle")}>
                    <Text style={styles.primaryActionLabel}>Add My First Vehicle</Text>
                  </Pressable>
                </View>
              ) : (
                dashboard?.vehicles.map((item) => (
                  <VehicleCard
                    key={item.vehicle._id}
                    item={item}
                    onLog={() => navigation.navigate("LogPUC", { vehicleId: item.vehicle._id })}
                    onViewHistory={() => navigation.navigate("VehicleDetail", { vehicleId: item.vehicle._id })}
                  />
                ))
              )}
            </>
          )
        ) : mapLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
        ) : (
          <>
            <View style={styles.mapPlaceholder}>
              <View style={styles.mapHeader}>
                <Text style={styles.mapTitle}>REPORTS IN YOUR AREA</Text>
                <Pressable style={styles.inlineBtn} onPress={() => navigation.navigate("PUCMap")}>
                  <Text style={styles.inlineBtnLabel}>Open full map</Text>
                </Pressable>
              </View>
              <Text style={styles.mapStats}>
                Total: {mapData?.cityStats.totalReports ?? 0} · Severe: {mapData?.cityStats.severeCount ?? 0}
              </Text>
              <View style={styles.hotspotRow}>
                {(mapData?.hotspots ?? []).slice(0, 4).map((spot, idx) => (
                  <View key={`${spot.lat}-${spot.lng}-${idx}`} style={styles.hotspotChip}>
                    <ReportMarker level={spot.maxLevel} count={spot.count} />
                    <Text style={styles.hotspotText}>{spot.locationName || "Hotspot"}</Text>
                  </View>
                ))}
                {(mapData?.hotspots ?? []).length === 0 ? (
                  <Text style={styles.noHotspots}>No hotspots detected in selected timeframe.</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.filterRow}>
              {[1, 24, 168].map((h) => (
                <Pressable
                  key={h}
                  style={[styles.filterChip, hours === h && styles.filterChipActive]}
                  onPress={() => setHours(h)}
                >
                  <Text style={[styles.filterChipLabel, hours === h && styles.filterChipLabelActive]}>
                    {h === 1 ? "Last 1h" : h === 24 ? "Last 24h" : "Last 7d"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportsRow}>
              {filteredReports.slice(0, 10).map((report) => (
                <PollutionReportCard key={report._id} report={report} />
              ))}
              {filteredReports.length === 0 ? (
                <Text style={styles.noHotspots}>No reports yet in this radius.</Text>
              ) : null}
            </ScrollView>

            <Pressable
              style={styles.primaryAction}
              onPress={() => navigation.navigate("ReportPollution" as never)}
            >
              <Text style={styles.primaryActionLabel}>Report a Vehicle I am Seeing Now</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  title: { fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  subtitle: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
  },
  tabBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryPale,
  },
  tabText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textSecondary,
  },
  tabTextActive: { color: COLORS.primary },
  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING.base,
    paddingBottom: SPACING["3xl"],
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  summaryTitle: { fontSize: TYPOGRAPHY.size.base, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  summaryText: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  addBtn: {
    backgroundColor: COLORS.primaryPale,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  addBtnLabel: { color: COLORS.primary, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.semibold },
  progressTrack: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    height: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primaryPale,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: "center",
  },
  emptyEmoji: { fontSize: TYPOGRAPHY.size.lg, color: COLORS.textMuted },
  emptyTitle: { fontSize: TYPOGRAPHY.size.base, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary, marginTop: SPACING.sm },
  emptyCopy: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary, marginTop: SPACING.xs, textAlign: "center" },
  primaryAction: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  primaryActionLabel: {
    color: "#052E22",
    fontWeight: TYPOGRAPHY.weight.bold,
    fontSize: TYPOGRAPHY.size.sm,
  },
  mapPlaceholder: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  mapHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mapTitle: { fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  inlineBtn: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm },
  inlineBtnLabel: { color: COLORS.primary, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.semibold },
  mapStats: { marginTop: SPACING.sm, fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  hotspotRow: { marginTop: SPACING.sm, gap: SPACING.sm },
  hotspotChip: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  hotspotText: { fontSize: TYPOGRAPHY.size.xs, color: COLORS.textSecondary, flex: 1 },
  noHotspots: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textMuted, marginTop: SPACING.sm },
  reportsRow: { marginTop: SPACING.md, marginHorizontal: -SPACING.base, paddingHorizontal: SPACING.base },
  filterRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryPale,
  },
  filterChipLabel: { fontSize: TYPOGRAPHY.size.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.weight.semibold },
  filterChipLabelActive: { color: COLORS.primary },
});
