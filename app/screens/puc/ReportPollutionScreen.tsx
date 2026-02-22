import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { submitPollutionReport } from "@/api/pollutionReport.api";
import type { PUCStackParamList } from "@/navigation/PUCNavigator";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";

type Nav = NativeStackNavigationProp<PUCStackParamList, "ReportPollution">;
type ScreenRoute = RouteProp<PUCStackParamList, "ReportPollution">;

const LEVELS = ["mild", "heavy", "severe"] as const;
const TYPES = ["black_smoke", "white_smoke", "strong_odor", "visible_exhaust", "multiple"] as const;
const VEHICLES = ["two_wheeler", "three_wheeler", "four_wheeler", "commercial_truck", "bus", "unknown"] as const;

const POINTS = { mild: 20, heavy: 35, severe: 50 } as const;
const IMPACT = { mild: 120, heavy: 450, severe: 900 } as const;

export default function ReportPollutionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();

  const [pollutionLevel, setPollutionLevel] = useState<(typeof LEVELS)[number]>("heavy");
  const [pollutionType, setPollutionType] = useState<(typeof TYPES)[number]>("black_smoke");
  const [vehicleType, setVehicleType] = useState<(typeof VEHICLES)[number]>("unknown");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [locationName, setLocationName] = useState(route.params?.locationName ?? "");
  const [city, setCity] = useState(route.params?.city ?? "Mumbai");
  const [state, setState] = useState(route.params?.state ?? "Maharashtra");
  const [latitude, setLatitude] = useState(String(route.params?.lat ?? 19.076));
  const [longitude, setLongitude] = useState(String(route.params?.lng ?? 72.877));
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const rewardText = useMemo(
    () => `+${POINTS[pollutionLevel]} pts · Potential impact ~${IMPACT[pollutionLevel]} kg CO2e/year`,
    [pollutionLevel],
  );

  async function handleSubmit() {
    if (!city.trim() || !state.trim()) {
      Alert.alert("Missing location", "City and state are required.");
      return;
    }
    setSaving(true);
    try {
      const response = await submitPollutionReport({
        vehicleNumber: vehicleNumber.trim() || undefined,
        vehicleType,
        vehicleColor: vehicleColor.trim() || undefined,
        pollutionLevel,
        pollutionType,
        description: description.trim() || undefined,
        latitude: Number(latitude),
        longitude: Number(longitude),
        locationName: locationName.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
      });
      Alert.alert(
        "Report submitted",
        `+${response.report.pointsAwarded} pts earned. Thank you for acting.`,
      );
      navigation.replace("PUCHome");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Try again.";
      if (message.includes("DAILY_REPORT_LIMIT_REACHED")) {
        Alert.alert("Limit reached", "You have reached today's report limit (10/10).");
      } else {
        Alert.alert("Could not submit report", message);
      }
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
        <Text style={styles.title}>Report Polluting Vehicle</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Pollution level</Text>
        <View style={styles.optionGrid}>
          {LEVELS.map((level) => (
            <Pressable
              key={level}
              style={[styles.optionChip, pollutionLevel === level && styles.optionChipActive]}
              onPress={() => setPollutionLevel(level)}
            >
              <Text style={[styles.optionLabel, pollutionLevel === level && styles.optionLabelActive]}>
                {level.replace("_", " ")}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Type of pollution</Text>
        <View style={styles.optionGrid}>
          {TYPES.map((type) => (
            <Pressable
              key={type}
              style={[styles.optionChip, pollutionType === type && styles.optionChipActive]}
              onPress={() => setPollutionType(type)}
            >
              <Text style={[styles.optionLabel, pollutionType === type && styles.optionLabelActive]}>
                {type.replace("_", " ")}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Vehicle type</Text>
        <View style={styles.optionGrid}>
          {VEHICLES.map((type) => (
            <Pressable
              key={type}
              style={[styles.optionChip, vehicleType === type && styles.optionChipActive]}
              onPress={() => setVehicleType(type)}
            >
              <Text style={[styles.optionLabel, vehicleType === type && styles.optionLabelActive]}>
                {type.replace("_", " ")}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Vehicle details (optional)</Text>
        <TextInput
          style={styles.input}
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
          placeholder="Vehicle Number"
          autoCapitalize="characters"
          placeholderTextColor={COLORS.textMuted}
        />
        <TextInput
          style={styles.input}
          value={vehicleColor}
          onChangeText={setVehicleColor}
          placeholder="Vehicle Color"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.section}>Location</Text>
        <TextInput
          style={styles.input}
          value={locationName}
          onChangeText={setLocationName}
          placeholder="Location Name"
          placeholderTextColor={COLORS.textMuted}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor={COLORS.textMuted}
          />
          <TextInput
            style={[styles.input, styles.half]}
            value={state}
            onChangeText={setState}
            placeholder="State"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            value={latitude}
            onChangeText={setLatitude}
            placeholder="Latitude"
            keyboardType="decimal-pad"
            placeholderTextColor={COLORS.textMuted}
          />
          <TextInput
            style={[styles.input, styles.half]}
            value={longitude}
            onChangeText={setLongitude}
            placeholder="Longitude"
            keyboardType="decimal-pad"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <Text style={styles.section}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what you observed"
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={300}
        />

        <View style={styles.rewardCard}>
          <Text style={styles.rewardTitle}>Reporting earns</Text>
          <Text style={styles.rewardText}>{rewardText}</Text>
        </View>

        <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
          <Text style={styles.submitBtnLabel}>{saving ? "Submitting..." : "Submit Report"}</Text>
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
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.bold,
    fontSize: TYPOGRAPHY.size.sm,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  optionChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  optionChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryPale,
  },
  optionLabel: {
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.xs,
    textTransform: "capitalize",
  },
  optionLabelActive: { color: COLORS.primary },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  row: { flexDirection: "row", gap: SPACING.sm },
  half: { flex: 1 },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  rewardCard: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  rewardTitle: { fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  rewardText: { marginTop: SPACING.xs, fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  submitBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  submitBtnLabel: {
    color: "#052E22",
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
});

