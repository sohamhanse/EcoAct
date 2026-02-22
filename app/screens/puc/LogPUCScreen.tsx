import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";
import { getVehicleStatus, logVehiclePUC } from "@/api/puc.api";
import { PUCComplianceModal } from "@/components/puc/PUCComplianceModal";
import { ShareBottomSheet } from "@/components/sharing/ShareBottomSheet";
import type { SharePayload } from "@/components/sharing/ShareCard";
import type { ApiVehicle } from "@/src/types";
import type { PUCStackParamList } from "@/navigation/PUCNavigator";

type Nav = NativeStackNavigationProp<PUCStackParamList, "LogPUC">;
type ScreenRoute = RouteProp<PUCStackParamList, "LogPUC">;

export default function LogPUCScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const { vehicleId } = route.params;

  const [vehicle, setVehicle] = useState<ApiVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10));
  const [pucCenterName, setPucCenterName] = useState("");
  const [pucCenterCity, setPucCenterCity] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [co, setCo] = useState("");
  const [hc, setHc] = useState("");
  const [smokeOpacity, setSmokeOpacity] = useState("");
  const [result, setResult] = useState<"pass" | "fail">("pass");
  const [successModal, setSuccessModal] = useState<{ points: number; co2: number } | null>(null);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);

  const loadVehicle = useCallback(async () => {
    setLoading(true);
    try {
      const status = await getVehicleStatus(vehicleId);
      setVehicle(status.vehicle);
    } catch {
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  const impactPreview = useMemo(() => {
    if (!vehicle) return 0;
    if (vehicle.vehicleType === "two_wheeler") return 28;
    if (vehicle.vehicleType === "three_wheeler") return 42;
    if (vehicle.vehicleType === "four_wheeler") return 65;
    return 120;
  }, [vehicle]);

  async function handleSave() {
    if (!testDate) {
      Alert.alert("Missing date", "Test date is required.");
      return;
    }
    setSaving(true);
    try {
      const response = await logVehiclePUC(vehicleId, {
        testDate: new Date(`${testDate}T00:00:00.000Z`).toISOString(),
        pucCenterName: pucCenterName.trim() || undefined,
        pucCenterCity: pucCenterCity.trim() || undefined,
        certificateNumber: certificateNumber.trim() || undefined,
        readings: {
          co: co ? Number(co) : undefined,
          hc: hc ? Number(hc) : undefined,
          smokeOpacity: smokeOpacity ? Number(smokeOpacity) : undefined,
          result,
        },
      });
      setSuccessModal({ points: response.reward.pointsAwarded, co2: response.reward.co2ImpactKg });
    } catch (e) {
      Alert.alert("Could not log PUC", e instanceof Error ? e.message : "Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Vehicle not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Log PUC Certificate</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.vehicleContext}>
          <Text style={styles.vehicleName}>{vehicle.nickname}</Text>
          <Text style={styles.vehicleMeta}>{vehicle.vehicleNumber}</Text>
        </View>

        <Text style={styles.section}>Test date</Text>
        <TextInput
          style={styles.input}
          value={testDate}
          onChangeText={setTestDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.section}>Center details (optional)</Text>
        <TextInput
          style={styles.input}
          value={pucCenterName}
          onChangeText={setPucCenterName}
          placeholder="PUC Center Name"
          placeholderTextColor={COLORS.textMuted}
        />
        <TextInput
          style={styles.input}
          value={pucCenterCity}
          onChangeText={setPucCenterCity}
          placeholder="PUC Center City"
          placeholderTextColor={COLORS.textMuted}
        />
        <TextInput
          style={styles.input}
          value={certificateNumber}
          onChangeText={setCertificateNumber}
          placeholder="Certificate Number"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.section}>Emission readings (optional)</Text>
        <TextInput
          style={styles.input}
          value={co}
          onChangeText={setCo}
          placeholder="CO Level (%)"
          keyboardType="decimal-pad"
          placeholderTextColor={COLORS.textMuted}
        />
        <TextInput
          style={styles.input}
          value={hc}
          onChangeText={setHc}
          placeholder="HC Level (ppm)"
          keyboardType="decimal-pad"
          placeholderTextColor={COLORS.textMuted}
        />
        {vehicle.fuelType === "diesel" ? (
          <TextInput
            style={styles.input}
            value={smokeOpacity}
            onChangeText={setSmokeOpacity}
            placeholder="Smoke Opacity (%)"
            keyboardType="decimal-pad"
            placeholderTextColor={COLORS.textMuted}
          />
        ) : null}

        <View style={styles.resultRow}>
          <Pressable
            style={[styles.resultBtn, result === "pass" && styles.resultBtnActive]}
            onPress={() => setResult("pass")}
          >
            <Text style={[styles.resultBtnLabel, result === "pass" && styles.resultBtnLabelActive]}>PASS</Text>
          </Pressable>
          <Pressable
            style={[styles.resultBtn, result === "fail" && styles.resultBtnActive]}
            onPress={() => setResult("fail")}
          >
            <Text style={[styles.resultBtnLabel, result === "fail" && styles.resultBtnLabelActive]}>FAIL</Text>
          </Pressable>
        </View>

        <View style={styles.rewardCard}>
          <Text style={styles.rewardTitle}>Your reward for this log</Text>
          <Text style={styles.rewardLine}>+150 pts if on-time, +50 if late</Text>
          <Text style={styles.rewardLine}>Estimated impact: ~{impactPreview} kg CO2e/year</Text>
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnLabel}>{saving ? "Saving..." : "Save PUC Certificate"}</Text>
        </Pressable>
      </ScrollView>

      <PUCComplianceModal
        visible={!!successModal}
        pointsAwarded={successModal?.points ?? 0}
        co2ImpactKg={successModal?.co2 ?? 0}
        onClose={() => {
          setSuccessModal(null);
          navigation.replace("VehicleDetail", { vehicleId });
        }}
        onShare={() => {
          if (!successModal) return;
          setSharePayload({
            type: "puc",
            data: {
              vehicleName: vehicle.nickname,
              pointsAwarded: successModal.points,
              co2ImpactKg: successModal.co2,
            },
          });
        }}
      />

      <ShareBottomSheet
        visible={!!sharePayload}
        payload={sharePayload}
        onDismiss={() => setSharePayload(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  empty: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.size.sm },
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
  vehicleContext: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  vehicleName: { fontSize: TYPOGRAPHY.size.base, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  vehicleMeta: { marginTop: SPACING.xs, fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  section: {
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.size.base,
    marginBottom: SPACING.sm,
  },
  resultRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
  resultBtn: {
    flex: 1,
    alignItems: "center",
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
  },
  resultBtnActive: {
    backgroundColor: COLORS.primaryPale,
    borderColor: COLORS.primary,
  },
  resultBtnLabel: { color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.weight.semibold },
  resultBtnLabelActive: { color: COLORS.primary },
  rewardCard: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  rewardTitle: { fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  rewardLine: { marginTop: SPACING.xs, fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  saveBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  saveBtnLabel: {
    color: "#052E22",
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
});

