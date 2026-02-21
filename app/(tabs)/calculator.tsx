import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { calculateAnnualCarbon } from "@/features/carbon/carbonCalculator";
import { useCarbonStore } from "@/store/useCarbonStore";
import type { CarbonAssessmentInput, CarbonBreakdown } from "@/types/app";

type InputForm = {
  carKmPerWeek: string;
  busKmPerWeek: string;
  shortHaulFlightsPerYear: string;
  meatMealsPerWeek: string;
  electricityKwhPerMonth: string;
  renewableEnergySharePercent: string;
  onlineOrdersPerMonth: string;
};

const fieldConfigs: { key: keyof InputForm; label: string; hint: string }[] = [
  {
    key: "carKmPerWeek",
    label: "Car km per week",
    hint: "Approximate weekly private car distance",
  },
  {
    key: "busKmPerWeek",
    label: "Bus or metro km per week",
    hint: "Public transport travel distance",
  },
  {
    key: "shortHaulFlightsPerYear",
    label: "Short flights per year",
    hint: "Round trips under ~1500 km",
  },
  {
    key: "meatMealsPerWeek",
    label: "Meat meals per week",
    hint: "Out of 21 meals per week",
  },
  {
    key: "electricityKwhPerMonth",
    label: "Home electricity kWh per month",
    hint: "Find this on your utility bill",
  },
  {
    key: "renewableEnergySharePercent",
    label: "Renewable share (%)",
    hint: "Percent of home electricity from renewables",
  },
  {
    key: "onlineOrdersPerMonth",
    label: "Online deliveries per month",
    hint: "Include food + e-commerce deliveries",
  },
];

const categoryTips: Record<keyof CarbonBreakdown, string> = {
  transport: "Try replacing two short car trips each week with biking or transit.",
  food: "Start with two plant-based meals each week and reduce red meat portions.",
  homeEnergy: "Lower thermostat intensity by 1 degree and avoid standby power overnight.",
  shopping: "Batch purchases into fewer deliveries and prioritize local pickup options.",
};

function formatCategoryLabel(category: keyof CarbonBreakdown): string {
  if (category === "homeEnergy") {
    return "Home energy";
  }

  return category.charAt(0).toUpperCase() + category.slice(1);
}

function parseNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function CalculatorScreen() {
  const setAssessment = useCarbonStore((state) => state.setAssessment);
  const baselineKgPerYear = useCarbonStore((state) => state.baselineKgPerYear);
  const breakdown = useCarbonStore((state) => state.breakdown);

  const [form, setForm] = useState<InputForm>({
    carKmPerWeek: "120",
    busKmPerWeek: "25",
    shortHaulFlightsPerYear: "2",
    meatMealsPerWeek: "8",
    electricityKwhPerMonth: "280",
    renewableEnergySharePercent: "20",
    onlineOrdersPerMonth: "6",
  });
  const [error, setError] = useState("");

  const topCategories = useMemo(() => {
    return (Object.keys(breakdown) as (keyof CarbonBreakdown)[])
      .sort((left, right) => breakdown[right] - breakdown[left])
      .slice(0, 2);
  }, [breakdown]);

  function updateField(key: keyof InputForm, value: string) {
    setForm((state) => ({
      ...state,
      [key]: value,
    }));
    setError("");
  }

  function handleCalculate() {
    const input: CarbonAssessmentInput = {
      carKmPerWeek: parseNumber(form.carKmPerWeek),
      busKmPerWeek: parseNumber(form.busKmPerWeek),
      shortHaulFlightsPerYear: parseNumber(form.shortHaulFlightsPerYear),
      meatMealsPerWeek: parseNumber(form.meatMealsPerWeek),
      electricityKwhPerMonth: parseNumber(form.electricityKwhPerMonth),
      renewableEnergySharePercent: parseNumber(form.renewableEnergySharePercent),
      onlineOrdersPerMonth: parseNumber(form.onlineOrdersPerMonth),
    };

    const hasInvalid = Object.values(input).some((value) => value < 0);
    if (hasInvalid) {
      setError("Values must be zero or greater.");
      return;
    }

    setAssessment(calculateAnnualCarbon(input));
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Carbon Footprint Calculator</Text>
        <Text style={styles.subtitle}>
          Estimate your annual CO2 output from transport, food, home energy, and shopping habits.
        </Text>
      </View>

      <View style={styles.formCard}>
        {fieldConfigs.map((field) => (
          <View key={field.key} style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              value={form[field.key]}
              onChangeText={(value) => updateField(field.key, value)}
              keyboardType="numeric"
              style={styles.input}
            />
            <Text style={styles.fieldHint}>{field.hint}</Text>
          </View>
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.button} onPress={handleCalculate}>
          <Text style={styles.buttonLabel}>Calculate footprint</Text>
        </Pressable>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Current result</Text>
        <Text style={styles.resultValue}>{baselineKgPerYear.toFixed(1)} kg CO2 / year</Text>
        <Text style={styles.resultMeta}>Recalculate anytime after lifestyle changes.</Text>

        {(Object.keys(breakdown) as (keyof CarbonBreakdown)[]).map((category) => (
          <View key={category} style={styles.resultRow}>
            <Text style={styles.resultRowLabel}>{formatCategoryLabel(category)}</Text>
            <Text style={styles.resultRowValue}>{breakdown[category].toFixed(1)} kg</Text>
          </View>
        ))}
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Personalized focus areas</Text>
        {topCategories.map((category) => (
          <Text key={category} style={styles.tipLine}>
            {categoryTips[category]}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 30,
  },
  headerCard: {
    backgroundColor: "#0f766e",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  title: {
    color: "#f0fdfa",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#ccfbf1",
    fontSize: 13,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 12,
  },
  fieldBlock: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
  },
  fieldHint: {
    fontSize: 12,
    color: "#64748b",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    fontSize: 15,
    color: "#0f172a",
  },
  error: {
    color: "#b91c1c",
    fontSize: 13,
  },
  button: {
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonLabel: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
  },
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 8,
  },
  resultTitle: {
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 16,
  },
  resultValue: {
    color: "#14532d",
    fontSize: 24,
    fontWeight: "700",
  },
  resultMeta: {
    color: "#64748b",
    fontSize: 12,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  resultRowLabel: {
    color: "#1e293b",
    textTransform: "capitalize",
    fontSize: 13,
  },
  resultRowValue: {
    color: "#1e293b",
    fontSize: 13,
    fontWeight: "600",
  },
  tipCard: {
    backgroundColor: "#ecfccb",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bef264",
    padding: 14,
    gap: 8,
  },
  tipTitle: {
    color: "#365314",
    fontWeight: "700",
    fontSize: 15,
  },
  tipLine: {
    color: "#3f6212",
    fontSize: 13,
    lineHeight: 18,
  },
});
