import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";
import { createVehicle, getPUCValidityPreview } from "@/api/puc.api";
import type { PUCStackParamList } from "@/navigation/PUCNavigator";
import { usePUCStore } from "@/store/usePUCStore";

type Nav = NativeStackNavigationProp<PUCStackParamList, "AddVehicle">;

const VEHICLE_TYPES = [
  { key: "two_wheeler", label: "Two-Wheeler" },
  { key: "three_wheeler", label: "Three-Wheeler" },
  { key: "four_wheeler", label: "Four-Wheeler" },
  { key: "commercial", label: "Commercial" },
] as const;

const FUEL_TYPES = [
  { key: "petrol", label: "Petrol" },
  { key: "diesel", label: "Diesel" },
  { key: "cng", label: "CNG" },
  { key: "electric", label: "Electric" },
] as const;

export default function AddVehicleScreen() {
  const navigation = useNavigation<Nav>();
  const [nickname, setNickname] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vehicleType, setVehicleType] = useState<(typeof VEHICLE_TYPES)[number]["key"]>("two_wheeler");
  const [fuelType, setFuelType] = useState<(typeof FUEL_TYPES)[number]["key"]>("petrol");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{ validityMonths: number; expiryDate: string | null; exempt: boolean } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const setDashboard = usePUCStore((s) => s.setDashboard);

  useEffect(() => {
    let active = true;
    async function loadPreview() {
      setPreviewLoading(true);
      try {
        const data = await getPUCValidityPreview({ fuelType });
        if (active) setPreview(data);
      } catch {
        if (active) setPreview(null);
      } finally {
        if (active) setPreviewLoading(false);
      }
    }
    loadPreview();
    return () => {
      active = false;
    };
  }, [fuelType]);

  const normalizedVehicleNumber = useMemo(
    () => vehicleNumber.toUpperCase().replace(/\s+/g, ""),
    [vehicleNumber],
  );

  async function handleSave() {
    if (!nickname.trim() || normalizedVehicleNumber.length < 4) {
      Alert.alert("Missing fields", "Nickname and vehicle number are required.");
      return;
    }
    setSaving(true);
    try {
      await createVehicle({
        nickname: nickname.trim(),
        vehicleNumber: normalizedVehicleNumber,
        vehicleType,
        fuelType,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        yearOfManufacture: year ? Number(year) : undefined,
      });
      setDashboard(null);
      navigation.replace("PUCHome");
    } catch (e) {
      Alert.alert("Could not save vehicle", e instanceof Error ? e.message : "Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Add Vehicle</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Tell us about your vehicle</Text>
        <TextInput
          style={styles.input}
          placeholder="Vehicle Nickname"
          value={nickname}
          onChangeText={setNickname}
          placeholderTextColor={COLORS.textMuted}
        />
        <TextInput
          style={styles.input}
          placeholder="Vehicle Number"
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
          autoCapitalize="characters"
          placeholderTextColor={COLORS.textMuted}
        />
        <TextInput
          style={styles.input}
          placeholder="Brand (optional)"
          value={brand}
          onChangeText={setBrand}
          placeholderTextColor={COLORS.textMuted}
        />
        <TextInput
          style={styles.input}
          placeholder="Model (optional)"
          value={model}
          onChangeText={setModel}
          placeholderTextColor={COLORS.textMuted}
        />
        <TextInput
          style={styles.input}
          placeholder="Year of Manufacture (optional)"
          value={year}
          onChangeText={setYear}
          keyboardType="number-pad"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.section}>Vehicle type</Text>
        <View style={styles.optionGrid}>
          {VEHICLE_TYPES.map((v) => (
            <Pressable
              key={v.key}
              style={[styles.optionChip, vehicleType === v.key && styles.optionChipActive]}
              onPress={() => setVehicleType(v.key)}
            >
              <Text style={[styles.optionLabel, vehicleType === v.key && styles.optionLabelActive]}>{v.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Fuel type</Text>
        <View style={styles.optionGrid}>
          {FUEL_TYPES.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.optionChip, fuelType === f.key && styles.optionChipActive]}
              onPress={() => setFuelType(f.key)}
            >
              <Text style={[styles.optionLabel, fuelType === f.key && styles.optionLabelActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>

        {fuelType === "electric" ? (
          <Text style={styles.exemptNote}>
            Electric vehicles are PUC-exempt in India. This vehicle will be marked exempt automatically.
          </Text>
        ) : null}

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Based on your fuel type</Text>
          {previewLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Text style={styles.previewText}>
                PUC validity: {preview?.validityMonths ?? 0} month(s)
              </Text>
              <Text style={styles.previewText}>
                Next renewal: {preview?.expiryDate ? new Date(preview.expiryDate).toLocaleDateString() : "Exempt"}
              </Text>
            </>
          )}
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnLabel}>{saving ? "Saving..." : "Save Vehicle"}</Text>
        </Pressable>
      </ScrollView>
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
  content: { padding: SPACING.base, paddingBottom: SPACING["3xl"] },
  section: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  optionChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  optionChipActive: { backgroundColor: COLORS.primaryPale, borderColor: COLORS.primary },
  optionLabel: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.semibold },
  optionLabelActive: { color: COLORS.primary },
  exemptNote: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.info,
  },
  previewCard: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  previewTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  previewText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  saveBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  saveBtnLabel: {
    color: "#052E22",
    fontWeight: TYPOGRAPHY.weight.bold,
    fontSize: TYPOGRAPHY.size.base,
  },
});

