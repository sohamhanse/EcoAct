import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useAuthStore } from "@/store/useAuthStore";
import { submitCalculator } from "@/api/calculator.api";
import {
  calculateFootprint,
  GRID_EMISSION_FACTORS,
  type CalculatorAnswers,
  type IndianState,
  type CityType,
  type VehicleType,
  type PublicTransportMode,
  type DietTypeIndia,
  type AcTonnage,
  type ElectricityRange,
} from "@/constants/emissionFactors";
import { OffsetSection } from "@/components/calculator/OffsetSection";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";

const STEPS = 10;
const INDIA_AVG = 1700;

const STATES: { value: IndianState; label: string }[] = [
  { value: "maharashtra", label: "Maharashtra" },
  { value: "delhi", label: "Delhi" },
  { value: "karnataka", label: "Karnataka" },
  { value: "tamil_nadu", label: "Tamil Nadu" },
  { value: "gujarat", label: "Gujarat" },
  { value: "rajasthan", label: "Rajasthan" },
  { value: "uttar_pradesh", label: "Uttar Pradesh" },
  { value: "west_bengal", label: "West Bengal" },
  { value: "telangana", label: "Telangana" },
  { value: "andhra_pradesh", label: "Andhra Pradesh" },
  { value: "madhya_pradesh", label: "Madhya Pradesh" },
  { value: "kerala", label: "Kerala" },
  { value: "punjab", label: "Punjab" },
  { value: "haryana", label: "Haryana" },
  { value: "bihar", label: "Bihar" },
  { value: "odisha", label: "Odisha" },
  { value: "jharkhand", label: "Jharkhand" },
  { value: "chhattisgarh", label: "Chhattisgarh" },
  { value: "assam", label: "Assam" },
  { value: "goa", label: "Goa" },
  { value: "other", label: "Other" },
];

const CITIES: { value: CityType; label: string }[] = [
  { value: "delhi", label: "Delhi" },
  { value: "mumbai", label: "Mumbai" },
  { value: "bangalore", label: "Bangalore" },
  { value: "hyderabad", label: "Hyderabad" },
  { value: "chennai", label: "Chennai" },
  { value: "other", label: "Other city" },
];

const VEHICLES: { value: VehicleType; engineSize?: "small" | "mid" | "suv"; label: string }[] = [
  { value: "petrol_car", engineSize: "small", label: "Petrol Car (small)" },
  { value: "petrol_car", engineSize: "mid", label: "Petrol Car (mid/large)" },
  { value: "diesel_car", label: "Diesel Car" },
  { value: "cng_car", label: "CNG Car" },
  { value: "electric_car", label: "Electric Car" },
  { value: "two_wheeler", label: "Two-Wheeler" },
  { value: "e_scooter", label: "E-Scooter" },
  { value: "none", label: "None" },
];

const PT_MODES: { value: PublicTransportMode; label: string }[] = [
  { value: "metro", label: "Metro" },
  { value: "bus_diesel", label: "City Bus (Diesel)" },
  { value: "bus_electric", label: "City Bus (Electric)" },
  { value: "auto_cng", label: "Auto (CNG)" },
  { value: "auto_petrol", label: "Auto (Petrol)" },
  { value: "erickshaw", label: "E-Rickshaw" },
  { value: "train", label: "Train" },
  { value: "none", label: "I don't use" },
];

const DIETS: { value: DietTypeIndia; label: string }[] = [
  { value: "vegan_local", label: "Vegan (local, seasonal)" },
  { value: "vegetarian_dairy", label: "Vegetarian (includes dairy)" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "non_veg_low", label: "Non-veg (1–2x/week)" },
  { value: "non_veg_moderate", label: "Non-veg (3–4x/week)" },
  { value: "non_veg_high", label: "Non-veg (daily)" },
];

const AC_TONNAGES: { value: AcTonnage; label: string }[] = [
  { value: "1_ton", label: "1 Ton" },
  { value: "1.5_ton", label: "1.5 Ton" },
  { value: "2_ton", label: "2 Ton" },
];

const ELECTRICITY_OPTS: { value: ElectricityRange; label: string }[] = [
  { value: "low", label: "Low (studio/1 BHK)" },
  { value: "medium", label: "Medium (2 BHK)" },
  { value: "high", label: "High (3 BHK + AC)" },
  { value: "very_high", label: "Very High (multiple ACs)" },
];

const defaultAnswers: CalculatorAnswers = {
  state: "other",
  city: "other",
  vehicleType: "petrol_car",
  engineSize: "mid",
  carKmPerWeek: 50,
  twoWheelerKmPerWeek: 0,
  publicTransportMode: "metro",
  publicTransportKmPerWeek: 20,
  flightsPerYear: 2,
  dietType: "vegetarian_dairy",
  acHoursPerDay: 3,
  acTonnage: "1.5_ton",
  electricityRange: "medium",
  onlinePurchasesPerMonth: 4,
};

export default function CalculatorScreen() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<CalculatorAnswers>(defaultAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const result = useMemo(() => calculateFootprint(answers), [answers]);
  const { total, transport, food, energy, shopping, gridFactor, comparedToIndiaAvg } = result;
  const breakdown = { transport, food, energy, shopping };
  const progress = ((step + 1) / STEPS) * 100;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitCalculator(answers);
      await refreshUser();
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const vsAvg = ((total - INDIA_AVG) / INDIA_AVG) * 100;
    const stateLabel = STATES.find((s) => s.value === answers.state)?.label ?? "Your state";
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.resultTitle}>Your footprint</Text>
        <Text style={styles.resultValue}>{total.toLocaleString()} kg CO₂/year</Text>
        <Text style={styles.vsAvg}>
          India average: {INDIA_AVG} kg/year · You are {vsAvg >= 0 ? "above" : "below"} average by{" "}
          {Math.abs(Math.round(vsAvg))}%
        </Text>
        <Text style={styles.gridFactor}>
          ⚡ Using {stateLabel} grid factor: {gridFactor.toFixed(2)} kg CO₂/kWh
        </Text>
        <Text style={styles.gridSource}>(Source: CEA CO2 Baseline Database v18, 2023)</Text>
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Transport</Text>
            <Text style={styles.breakdownValue}>{breakdown.transport} kg</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Food</Text>
            <Text style={styles.breakdownValue}>{breakdown.food} kg</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Energy</Text>
            <Text style={styles.breakdownValue}>{breakdown.energy} kg</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Shopping</Text>
            <Text style={styles.breakdownValue}>{breakdown.shopping} kg</Text>
          </View>
        </View>
        <OffsetSection co2Kg={total} />
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.8 }]}
          onPress={() => setDone(false)}
          accessibilityLabel="Recalculate footprint"
          accessibilityRole="button"
        >
          <Text style={styles.ctaLabel}>Recalculate</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.progressText}>
        Step {step + 1} of {STEPS}
      </Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {step === 0 && (
        <>
          <Text style={styles.q}>What state do you live in?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {STATES.map((s) => (
              <Pressable
                key={s.value}
                style={[styles.chip, answers.state === s.value && styles.chipActive]}
                onPress={() => setAnswers((a) => ({ ...a, state: s.value }))}
              >
                <Text style={[styles.chipText, answers.state === s.value && styles.chipTextActive]}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {answers.state && (
            <Text style={styles.hint}>
              Grid factor: {GRID_EMISSION_FACTORS[answers.state].toFixed(2)} kg/kWh
            </Text>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <Text style={styles.q}>What city type? (affects metro factor)</Text>
          <View style={styles.chipGrid}>
            {CITIES.map((c) => (
              <Pressable
                key={c.value}
                style={[styles.chip, answers.city === c.value && styles.chipActive]}
                onPress={() => setAnswers((a) => ({ ...a, city: c.value }))}
              >
                <Text style={[styles.chipText, answers.city === c.value && styles.chipTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.q}>What is your primary vehicle?</Text>
          <View style={styles.chipGrid}>
            {VEHICLES.map((v) => (
              <Pressable
                key={`${v.value}-${v.engineSize ?? "x"}`}
                style={[
                  styles.chip,
                  answers.vehicleType === v.value &&
                    (v.engineSize ? answers.engineSize === v.engineSize : true) &&
                    styles.chipActive,
                ]}
                onPress={() =>
                  setAnswers((a) => ({
                    ...a,
                    vehicleType: v.value,
                    engineSize: v.engineSize,
                  }))
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    answers.vehicleType === v.value &&
                      (v.engineSize ? answers.engineSize === v.engineSize : true) &&
                      styles.chipTextActive,
                  ]}
                >
                  {v.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.q}>How many km do you drive per week?</Text>
          <Text style={styles.val}>{answers.carKmPerWeek}</Text>
          <Slider
            minimumValue={0}
            maximumValue={500}
            step={5}
            value={answers.carKmPerWeek}
            onValueChange={(v) => setAnswers((a) => ({ ...a, carKmPerWeek: v }))}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.border}
          />
        </>
      )}

      {step === 4 && (
        <>
          <Text style={styles.q}>How do you commute? (public transport)</Text>
          <View style={styles.chipGrid}>
            {PT_MODES.map((m) => (
              <Pressable
                key={m.value}
                style={[styles.chip, answers.publicTransportMode === m.value && styles.chipActive]}
                onPress={() => setAnswers((a) => ({ ...a, publicTransportMode: m.value }))}
              >
                <Text
                  style={[
                    styles.chipText,
                    answers.publicTransportMode === m.value && styles.chipTextActive,
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.q}>How many km per week?</Text>
          <Text style={styles.val}>{answers.publicTransportKmPerWeek}</Text>
          <Slider
            minimumValue={0}
            maximumValue={100}
            step={5}
            value={answers.publicTransportKmPerWeek}
            onValueChange={(v) =>
              setAnswers((a) => ({ ...a, publicTransportKmPerWeek: v }))
            }
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.border}
          />
        </>
      )}

      {step === 5 && (
        <>
          <Text style={styles.q}>How many flights do you take per year?</Text>
          <Text style={styles.val}>{answers.flightsPerYear}</Text>
          <Slider
            minimumValue={0}
            maximumValue={20}
            step={1}
            value={answers.flightsPerYear}
            onValueChange={(v) => setAnswers((a) => ({ ...a, flightsPerYear: v }))}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.border}
          />
          <Text style={styles.hint}>Domestic avg 1,500 km per flight</Text>
        </>
      )}

      {step === 6 && (
        <>
          <Text style={styles.q}>What best describes your diet?</Text>
          <View style={styles.chipGrid}>
            {DIETS.map((d) => (
              <Pressable
                key={d.value}
                style={[styles.chip, answers.dietType === d.value && styles.chipActive]}
                onPress={() => setAnswers((a) => ({ ...a, dietType: d.value }))}
              >
                <Text
                  style={[styles.chipText, answers.dietType === d.value && styles.chipTextActive]}
                >
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {step === 7 && (
        <>
          <Text style={styles.q}>How many hours/day do you use AC?</Text>
          <Text style={styles.val}>{answers.acHoursPerDay}</Text>
          <Slider
            minimumValue={0}
            maximumValue={12}
            step={0.5}
            value={answers.acHoursPerDay}
            onValueChange={(v) => setAnswers((a) => ({ ...a, acHoursPerDay: v }))}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.border}
          />
          {answers.acHoursPerDay > 0 && (
            <>
              <Text style={styles.q}>AC size?</Text>
              <View style={styles.chipRow}>
                {AC_TONNAGES.map((t) => (
                  <Pressable
                    key={t.value}
                    style={[styles.chip, answers.acTonnage === t.value && styles.chipActive]}
                    onPress={() => setAnswers((a) => ({ ...a, acTonnage: t.value }))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        answers.acTonnage === t.value && styles.chipTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </>
      )}

      {step === 8 && (
        <>
          <Text style={styles.q}>What is your household electricity usage?</Text>
          <View style={styles.chipGrid}>
            {ELECTRICITY_OPTS.map((e) => (
              <Pressable
                key={e.value}
                style={[styles.chip, answers.electricityRange === e.value && styles.chipActive]}
                onPress={() => setAnswers((a) => ({ ...a, electricityRange: e.value }))}
              >
                <Text
                  style={[
                    styles.chipText,
                    answers.electricityRange === e.value && styles.chipTextActive,
                  ]}
                >
                  {e.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {step === 9 && (
        <>
          <Text style={styles.q}>How many online purchases per month?</Text>
          <Text style={styles.val}>{answers.onlinePurchasesPerMonth}</Text>
          <Slider
            minimumValue={0}
            maximumValue={30}
            step={1}
            value={answers.onlinePurchasesPerMonth}
            onValueChange={(v) =>
              setAnswers((a) => ({ ...a, onlinePurchasesPerMonth: v }))
            }
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.border}
          />
          <Text style={styles.hint}>Each delivery ≈ 6.5 kg CO₂</Text>
        </>
      )}

      <View style={styles.preview}>
        <Text style={styles.previewLabel}>Preview</Text>
        <Text style={styles.previewVal}>{total} kg CO₂/year</Text>
      </View>

      <View style={styles.buttons}>
        {step > 0 && (
          <Pressable style={styles.secondaryBtn} onPress={() => setStep((s) => s - 1)}>
            <Text style={styles.secondaryBtnLabel}>Back</Text>
          </Pressable>
        )}
        {step < STEPS - 1 ? (
          <Pressable style={styles.primaryBtn} onPress={() => setStep((s) => s + 1)}>
            <Text style={styles.primaryBtnLabel}>Next</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primaryBtn} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.primaryBtnLabel}>
              {submitting ? "Saving…" : "Save & see results"}
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, paddingBottom: SPACING["3xl"] },
  progressText: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary },
  progressBar: {
    height: SPACING.xs,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.xs,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: RADIUS.sm },
  q: { fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.semibold, color: COLORS.textPrimary, marginTop: SPACING.lg },
  val: { fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.primary, marginVertical: SPACING.sm },
  hint: { fontSize: TYPOGRAPHY.size.xs, color: COLORS.textMuted, marginTop: SPACING.xs },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginTop: SPACING.sm },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginTop: SPACING.sm },
  chip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primaryPale, borderColor: COLORS.primary },
  chipText: { fontSize: TYPOGRAPHY.size.base, color: COLORS.textPrimary },
  chipTextActive: { color: COLORS.primary, fontWeight: TYPOGRAPHY.weight.semibold },
  preview: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.primaryPale,
    borderRadius: RADIUS.md,
  },
  previewLabel: { fontSize: TYPOGRAPHY.size.xs, color: COLORS.textSecondary },
  previewVal: { fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.primary },
  buttons: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.xl },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  primaryBtnLabel: { color: COLORS.primaryContrast, fontWeight: TYPOGRAPHY.weight.semibold, fontSize: TYPOGRAPHY.size.base },
  secondaryBtn: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, justifyContent: "center" },
  secondaryBtnLabel: { color: COLORS.primary, fontWeight: TYPOGRAPHY.weight.semibold },
  resultTitle: { fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.textPrimary },
  resultValue: { fontSize: TYPOGRAPHY.size["2xl"], fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.primary, marginTop: SPACING.sm },
  vsAvg: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary, marginTop: SPACING.sm },
  gridFactor: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textSecondary, marginTop: SPACING.sm },
  gridSource: { fontSize: TYPOGRAPHY.size.xs, color: COLORS.textMuted, marginTop: 2 },
  breakdown: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  breakdownTitle: { fontSize: TYPOGRAPHY.size.base, fontWeight: TYPOGRAPHY.weight.semibold, marginBottom: SPACING.sm, color: COLORS.textPrimary },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  breakdownLabel: { fontSize: TYPOGRAPHY.size.base, color: COLORS.textPrimary },
  breakdownValue: { fontSize: TYPOGRAPHY.size.base, fontWeight: TYPOGRAPHY.weight.semibold, color: COLORS.textSecondary },
  cta: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  ctaLabel: { color: COLORS.primaryContrast, fontWeight: TYPOGRAPHY.weight.semibold },
});
