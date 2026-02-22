import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { usePollutionMap } from "@/hooks/usePollutionMap";
import type { PUCStackParamList } from "@/navigation/PUCNavigator";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";
import { PollutionReportCard } from "@/components/puc/PollutionReportCard";
import { ReportMarker } from "@/components/puc/ReportMarker";

type Nav = NativeStackNavigationProp<PUCStackParamList, "PUCMap">;

export default function MapScreen() {
  const navigation = useNavigation<Nav>();
  const {
    loading,
    mapData,
    filteredReports,
    levelFilter,
    setLevelFilter,
    hours,
    setHours,
    center,
    setCenter,
    refetch,
  } = usePollutionMap();

  const cityLabel = useMemo(() => {
    const first = mapData?.reports[0];
    return first?.city ?? "Your city";
  }, [mapData?.reports]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Pollution Map</Text>
      </View>

      <View style={styles.filterRow}>
        {(["all", "mild", "heavy", "severe"] as const).map((level) => (
          <Pressable
            key={level}
            style={[styles.filterChip, levelFilter === level && styles.filterChipActive]}
            onPress={() => setLevelFilter(level)}
          >
            <Text style={[styles.filterChipLabel, levelFilter === level && styles.filterChipLabelActive]}>
              {level === "all" ? "All" : level}
            </Text>
          </Pressable>
        ))}
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

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.mapSurface}>
            <Text style={styles.mapTitle}>Hotspot clusters</Text>
            <Text style={styles.mapSubtitle}>Map dependency not installed. Showing hotspot data list.</Text>
            <View style={styles.hotspotsWrap}>
              {(mapData?.hotspots ?? []).map((spot, index) => (
                <View key={`${spot.lat}-${spot.lng}-${index}`} style={styles.hotspotRow}>
                  <ReportMarker level={spot.maxLevel} count={spot.count} />
                  <View style={styles.hotspotInfo}>
                    <Text style={styles.hotspotLocation}>{spot.locationName || "Unnamed location"}</Text>
                    <Text style={styles.hotspotMeta}>
                      {spot.count} reports · {spot.maxLevel} max · ({spot.lat.toFixed(2)}, {spot.lng.toFixed(2)})
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      navigation.navigate("ReportPollution", {
                        lat: spot.lat,
                        lng: spot.lng,
                        locationName: spot.locationName,
                        city: cityLabel,
                      })
                    }
                  >
                    <Text style={styles.sameAreaLink}>Report same area</Text>
                  </Pressable>
                </View>
              ))}
              {(mapData?.hotspots ?? []).length === 0 ? (
                <Text style={styles.empty}>No hotspots in this range.</Text>
              ) : null}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportRow}>
            {filteredReports.map((report) => (
              <PollutionReportCard key={report._id} report={report} />
            ))}
            {filteredReports.length === 0 ? (
              <Text style={styles.empty}>No reports for this filter.</Text>
            ) : null}
          </ScrollView>
        </ScrollView>
      )}

      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>
          {cityLabel} · {mapData?.cityStats.totalReports ?? 0} reports · {mapData?.cityStats.severeCount ?? 0} severe
        </Text>
      </View>

      <Pressable
        style={styles.locationFab}
        onPress={() => {
          setCenter({ ...center, lat: 19.076, lng: 72.877 });
          refetch();
        }}
      >
        <Text style={styles.locationFabLabel}>My Location</Text>
      </Pressable>
      <Pressable style={styles.reportFab} onPress={() => navigation.navigate("ReportPollution" as never)}>
        <Text style={styles.reportFabLabel}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
  filterRow: { flexDirection: "row", gap: SPACING.sm, paddingHorizontal: SPACING.base, paddingTop: SPACING.sm },
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
  filterChipLabel: { fontSize: TYPOGRAPHY.size.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.weight.semibold, textTransform: "capitalize" },
  filterChipLabelActive: { color: COLORS.primary },
  content: { padding: SPACING.base, paddingBottom: 120 },
  mapSurface: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  mapTitle: { fontSize: TYPOGRAPHY.size.base, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  mapSubtitle: { marginTop: SPACING.xs, fontSize: TYPOGRAPHY.size.xs, color: COLORS.textMuted },
  hotspotsWrap: { marginTop: SPACING.sm, gap: SPACING.sm },
  hotspotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  hotspotInfo: { flex: 1 },
  hotspotLocation: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.weight.semibold },
  hotspotMeta: { marginTop: 2, fontSize: TYPOGRAPHY.size.xs, color: COLORS.textSecondary },
  sameAreaLink: { color: COLORS.primary, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.semibold },
  reportRow: { marginTop: SPACING.md, marginHorizontal: -SPACING.base, paddingHorizontal: SPACING.base },
  empty: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.size.sm, marginTop: SPACING.sm },
  bottomBar: {
    position: "absolute",
    left: SPACING.base,
    right: SPACING.base,
    bottom: SPACING.base,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  bottomText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.size.xs },
  locationFab: {
    position: "absolute",
    right: SPACING.base,
    bottom: 72,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  locationFabLabel: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.semibold },
  reportFab: {
    position: "absolute",
    right: SPACING.base,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  reportFabLabel: { color: "#052E22", fontSize: 28, lineHeight: 28, fontWeight: TYPOGRAPHY.weight.bold },
});
