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
import { calculateFootprint } from "@/constants/emissionFactors";
import type { CalculatorAnswers } from "@/constants/emissionFactors";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";

const STEPS = 8;
const INDIA_AVG = 1700;

const defaultAnswers: CalculatorAnswers = {
  carKmPerWeek: 50,
  publicTransportFrequency: "few_times_week",
  dietType: "non_vegetarian",
  meatFrequency: "few_times_week",
  acUsageHours: 3,
  electricityRange: "medium",
  onlinePurchasesPerMonth: 4,
  flightsPerYear: 2,
};

export default function CalculatorScreen() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<CalculatorAnswers>(defaultAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const { total, breakdown } = useMemo(() => calculateFootprint(answers), [answers]);
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
    const net = total;
    const vsAvg = ((net - INDIA_AVG) / INDIA_AVG) * 100;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.resultTitle}>Your footprint</Text>
        <Text style={styles.resultValue}>{total.toLocaleString()} kg CO₂/year</Text>
        <Text style={styles.vsAvg}>
          India average: {INDIA_AVG} kg/year · You are {vsAvg >= 0 ? "above" : "below"} average by {Math.abs(Math.round(vsAvg))}%
        </Text>
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>Breakdown</Text>
          <View style={styles.breakdownRow}><Text>Transport</Text><Text>{breakdown.transport} kg</Text></View>
          <View style={styles.breakdownRow}><Text>Food</Text><Text>{breakdown.food} kg</Text></View>
          <View style={styles.breakdownRow}><Text>Energy</Text><Text>{breakdown.energy} kg</Text></View>
          <View style={styles.breakdownRow}><Text>Shopping</Text><Text>{breakdown.shopping} kg</Text></View>
        </View>
        <Pressable style={styles.cta} onPress={() => setDone(false)}>
          <Text style={styles.ctaLabel}>Recalculate</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.progressText}>Step {step + 1} of {STEPS}</Text>
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>

      {step === 0 && (
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
      {step === 1 && (
        <>
          <Text style={styles.q}>How often do you use public transport?</Text>
          {(["daily", "few_times_week", "rarely", "never"] as const).map((opt) => (
            <Pressable
              key={opt}
              style={[styles.chip, answers.publicTransportFrequency === opt && styles.chipActive]}
              onPress={() => setAnswers((a) => ({ ...a, publicTransportFrequency: opt }))}
            >
              <Text style={[styles.chipText, answers.publicTransportFrequency === opt && styles.chipTextActive]}>{opt.replace("_", " ")}</Text>
            </Pressable>
          ))}
        </>
      )}
      {step === 2 && (
        <>
          <Text style={styles.q}>Diet type?</Text>
          {(["vegan", "vegetarian", "non_vegetarian"] as const).map((opt) => (
            <Pressable
              key={opt}
              style={[styles.chip, answers.dietType === opt && styles.chipActive]}
              onPress={() => setAnswers((a) => ({ ...a, dietType: opt }))}
            >
              <Text style={[styles.chipText, answers.dietType === opt && styles.chipTextActive]}>{opt.replace("_", " ")}</Text>
            </Pressable>
          ))}
        </>
      )}
      {step === 3 && (
        <>
          <Text style={styles.q}>How often do you eat meat?</Text>
          {(["daily", "few_times_week", "rarely", "never"] as const).map((opt) => (
            <Pressable
              key={opt}
              style={[styles.chip, answers.meatFrequency === opt && styles.chipActive]}
              onPress={() => setAnswers((a) => ({ ...a, meatFrequency: opt }))}
            >
              <Text style={[styles.chipText, answers.meatFrequency === opt && styles.chipTextActive]}>{opt.replace("_", " ")}</Text>
            </Pressable>
          ))}
        </>
      )}
      {step === 4 && (
        <>
          <Text style={styles.q}>AC hours per day?</Text>
          <Text style={styles.val}>{answers.acUsageHours}</Text>
          <Slider
            minimumValue={0}
            maximumValue={12}
            step={0.5}
            value={answers.acUsageHours}
            onValueChange={(v) => setAnswers((a) => ({ ...a, acUsageHours: v }))}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.border}
          />
        </>
      )}
      {step === 5 && (
        <>
          <Text style={styles.q}>Electricity usage?</Text>
          {(["low", "medium", "high", "very_high"] as const).map((opt) => (
            <Pressable
              key={opt}
              style={[styles.chip, answers.electricityRange === opt && styles.chipActive]}
              onPress={() => setAnswers((a) => ({ ...a, electricityRange: opt }))}
            >
              <Text style={[styles.chipText, answers.electricityRange === opt && styles.chipTextActive]}>{opt.replace("_", " ")}</Text>
            </Pressable>
          ))}
        </>
      )}
      {step === 6 && (
        <>
          <Text style={styles.q}>Online purchases per month?</Text>
          <Text style={styles.val}>{answers.onlinePurchasesPerMonth}</Text>
          <Slider
            minimumValue={0}
            maximumValue={30}
            step={1}
            value={answers.onlinePurchasesPerMonth}
            onValueChange={(v) => setAnswers((a) => ({ ...a, onlinePurchasesPerMonth: v }))}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.border}
          />
        </>
      )}
      {step === 7 && (
        <>
          <Text style={styles.q}>Flights per year?</Text>
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
            <Text style={styles.primaryBtnLabel}>{submitting ? "Saving…" : "Save & see results"}</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, paddingBottom: SPACING["3xl"] },
  progressText: { fontSize: 13, color: COLORS.textSecondary },
  progressBar: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginTop: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 2 },
  q: { fontSize: 18, fontWeight: "600", color: COLORS.textPrimary, marginTop: SPACING.lg },
  val: { fontSize: 24, fontWeight: "700", color: COLORS.primary, marginVertical: SPACING.sm },
  chip: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.sm, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.sm },
  chipActive: { backgroundColor: COLORS.primaryPale, borderColor: COLORS.primary },
  chipText: { fontSize: 15, color: COLORS.textPrimary },
  chipTextActive: { color: COLORS.primary, fontWeight: "600" },
  preview: { marginTop: SPACING.xl, padding: SPACING.md, backgroundColor: COLORS.primaryPale, borderRadius: RADIUS.md },
  previewLabel: { fontSize: 12, color: COLORS.textSecondary },
  previewVal: { fontSize: 20, fontWeight: "700", color: COLORS.primary },
  buttons: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.xl },
  primaryBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: "center" },
  primaryBtnLabel: { color: "#fff", fontWeight: "600", fontSize: 16 },
  secondaryBtn: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, justifyContent: "center" },
  secondaryBtnLabel: { color: COLORS.primary, fontWeight: "600" },
  resultTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },
  resultValue: { fontSize: 32, fontWeight: "700", color: COLORS.primary, marginTop: SPACING.sm },
  vsAvg: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.sm },
  breakdown: { marginTop: SPACING.xl },
  breakdownTitle: { fontSize: 16, fontWeight: "600", marginBottom: SPACING.sm },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  cta: { marginTop: SPACING.xl, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: "center" },
  ctaLabel: { color: "#fff", fontWeight: "600" },
});
