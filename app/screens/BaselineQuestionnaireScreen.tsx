import Slider from "@react-native-community/slider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { LegacyStackParamList } from "@/navigation/AppNavigator";
import { useCarbonContext } from "../context/CarbonContext";
import type {
  BaselineQuestionnaire,
  DietType,
  ElectricityBand,
  GroceryTransportMode,
  MeatFrequency,
  OnlinePurchaseBand,
  PublicTransportFrequency,
} from "../types/domain";

type Props = NativeStackScreenProps<LegacyStackParamList, "BaselineQuestionnaire">;

const TOTAL_STEPS = 10;

const defaultQuestionnaire: BaselineQuestionnaire = {
  carKmPerWeek: 120,
  publicTransportFrequency: "1-2",
  groceryTransportMode: "car",
  dietType: "non-vegetarian",
  meatFrequency: "3-4",
  acHoursPerDay: 4,
  electricityBand: "100-200",
  onlinePurchaseBand: "3-5",
};

function OptionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.optionButton, selected && styles.optionButtonActive]} onPress={onPress}>
      <Text style={[styles.optionText, selected && styles.optionTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function BaselineQuestionnaireScreen({ navigation }: Props) {
  const { saveBaselineResult } = useCarbonContext();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<BaselineQuestionnaire>(defaultQuestionnaire);

  const progressPercent = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step]);

  function nextStep() {
    setStep((previous) => Math.min(previous + 1, TOTAL_STEPS));
  }

  function previousStep() {
    setStep((previous) => Math.max(previous - 1, 1));
  }

  function submitQuestionnaire() {
    saveBaselineResult(answers);
    navigation.replace("BaselineResult");
  }

  return (
    <View style={styles.screen}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Step {step} of {TOTAL_STEPS}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}>
        {step === 1 ? (
          <>
            <Text style={styles.questionTitle}>Q1. How many km do you drive per week?</Text>
            <Slider
              minimumValue={0}
              maximumValue={500}
              step={1}
              value={answers.carKmPerWeek}
              onValueChange={(value) => setAnswers((previous) => ({ ...previous, carKmPerWeek: value }))}
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(answers.carKmPerWeek)}
              onChangeText={(value) =>
                setAnswers((previous) => ({
                  ...previous,
                  carKmPerWeek: Number.isFinite(Number(value)) ? Number(value) : 0,
                }))
              }
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.questionTitle}>Q2. How often do you use public transport?</Text>
            {(["never", "1-2", "3-5", "daily"] as PublicTransportFrequency[]).map((option) => (
              <OptionButton
                key={option}
                label={
                  option === "never"
                    ? "Never"
                    : option === "1-2"
                      ? "1–2 times/week"
                      : option === "3-5"
                        ? "3–5 times/week"
                        : "Daily"
                }
                selected={answers.publicTransportFrequency === option}
                onPress={() =>
                  setAnswers((previous) => ({
                    ...previous,
                    publicTransportFrequency: option,
                  }))
                }
              />
            ))}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.questionTitle}>Q3. How do you go for grocery shopping?</Text>
            {(
              [
                ["car", "Car"],
                ["bike", "Bike"],
                ["public-transport", "Public Transport"],
                ["walk", "Walk"],
                ["bicycle", "Bicycle"],
              ] as [GroceryTransportMode, string][]
            ).map(([value, label]) => (
              <OptionButton
                key={value}
                label={label}
                selected={answers.groceryTransportMode === value}
                onPress={() => setAnswers((previous) => ({ ...previous, groceryTransportMode: value }))}
              />
            ))}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Text style={styles.questionTitle}>Q4. Diet type?</Text>
            {(
              [
                ["vegetarian", "Vegetarian"],
                ["eggetarian", "Eggetarian"],
                ["non-vegetarian", "Non-Vegetarian"],
              ] as [DietType, string][]
            ).map(([value, label]) => (
              <OptionButton
                key={value}
                label={label}
                selected={answers.dietType === value}
                onPress={() => setAnswers((previous) => ({ ...previous, dietType: value }))}
              />
            ))}
          </>
        ) : null}

        {step === 5 ? (
          <>
            <Text style={styles.questionTitle}>Q5. Meat consumption frequency?</Text>
            {(
              [
                ["daily", "Daily"],
                ["3-4", "3–4 days/week"],
                ["1-2", "1–2 days/week"],
                ["rarely", "Rarely"],
              ] as [MeatFrequency, string][]
            ).map(([value, label]) => (
              <OptionButton
                key={value}
                label={label}
                selected={answers.meatFrequency === value}
                onPress={() => setAnswers((previous) => ({ ...previous, meatFrequency: value }))}
              />
            ))}
          </>
        ) : null}

        {step === 6 ? (
          <>
            <Text style={styles.questionTitle}>Q6. AC usage hours per day?</Text>
            <Slider
              minimumValue={0}
              maximumValue={12}
              step={1}
              value={answers.acHoursPerDay}
              onValueChange={(value) => setAnswers((previous) => ({ ...previous, acHoursPerDay: value }))}
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(answers.acHoursPerDay)}
              onChangeText={(value) =>
                setAnswers((previous) => ({
                  ...previous,
                  acHoursPerDay: Number.isFinite(Number(value)) ? Number(value) : 0,
                }))
              }
            />
          </>
        ) : null}

        {step === 7 ? (
          <>
            <Text style={styles.questionTitle}>Q7. Monthly electricity usage?</Text>
            {(
              [
                ["<100", "<100 kWh"],
                ["100-200", "100–200 kWh"],
                ["200-400", "200–400 kWh"],
                ["400+", "400+ kWh"],
              ] as [ElectricityBand, string][]
            ).map(([value, label]) => (
              <OptionButton
                key={value}
                label={label}
                selected={answers.electricityBand === value}
                onPress={() => setAnswers((previous) => ({ ...previous, electricityBand: value }))}
              />
            ))}
          </>
        ) : null}

        {step === 8 ? (
          <>
            <Text style={styles.questionTitle}>Q8. Online purchases per month?</Text>
            {(
              [
                ["0-2", "0–2"],
                ["3-5", "3–5"],
                ["6-10", "6–10"],
                ["10+", "10+"],
              ] as [OnlinePurchaseBand, string][]
            ).map(([value, label]) => (
              <OptionButton
                key={value}
                label={label}
                selected={answers.onlinePurchaseBand === value}
                onPress={() => setAnswers((previous) => ({ ...previous, onlinePurchaseBand: value }))}
              />
            ))}
          </>
        ) : null}

        {step === 9 ? (
          <>
            <Text style={styles.questionTitle}>Step 9. Review your answers</Text>
            <Text style={styles.reviewRow}>Car km/week: {answers.carKmPerWeek}</Text>
            <Text style={styles.reviewRow}>Public transport: {answers.publicTransportFrequency}</Text>
            <Text style={styles.reviewRow}>Grocery mode: {answers.groceryTransportMode}</Text>
            <Text style={styles.reviewRow}>Diet: {answers.dietType}</Text>
            <Text style={styles.reviewRow}>Meat frequency: {answers.meatFrequency}</Text>
            <Text style={styles.reviewRow}>AC hours/day: {answers.acHoursPerDay}</Text>
            <Text style={styles.reviewRow}>Electricity: {answers.electricityBand}</Text>
            <Text style={styles.reviewRow}>Online purchases: {answers.onlinePurchaseBand}</Text>
          </>
        ) : null}

        {step === 10 ? (
          <>
            <Text style={styles.questionTitle}>Step 10. Generate baseline</Text>
            <Text style={styles.submitText}>
              Submit the questionnaire to calculate your baseline CO2, category breakdown, and biggest source.
            </Text>
            <Pressable style={styles.submitButton} onPress={submitQuestionnaire}>
              <Text style={styles.submitButtonLabel}>Calculate Baseline</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={[styles.navButton, step === 1 && styles.navButtonDisabled]} onPress={previousStep} disabled={step === 1}>
          <Text style={[styles.navButtonLabel, step === 1 && styles.navButtonLabelDisabled]}>Back</Text>
        </Pressable>
        {step < TOTAL_STEPS ? (
          <Pressable style={styles.navButtonPrimary} onPress={nextStep}>
            <Text style={styles.navButtonPrimaryLabel}>Next</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 14,
    gap: 10,
  },
  progressContainer: {
    gap: 6,
    marginTop: 4,
  },
  progressLabel: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "600",
  },
  progressTrack: {
    height: 9,
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0f766e",
    borderRadius: 999,
  },
  card: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardContent: {
    padding: 16,
    gap: 10,
  },
  questionTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
  },
  optionButtonActive: {
    borderColor: "#0f766e",
    backgroundColor: "#ccfbf1",
  },
  optionText: {
    color: "#334155",
    fontSize: 14,
  },
  optionTextActive: {
    color: "#115e59",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: 15,
    marginTop: 2,
  },
  reviewRow: {
    color: "#334155",
    fontSize: 14,
  },
  submitText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 19,
  },
  submitButton: {
    marginTop: 6,
    backgroundColor: "#166534",
    borderRadius: 11,
    alignItems: "center",
    paddingVertical: 12,
  },
  submitButtonLabel: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  navButton: {
    flex: 1,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#94a3b8",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  navButtonDisabled: {
    backgroundColor: "#f8fafc",
  },
  navButtonLabel: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 14,
  },
  navButtonLabelDisabled: {
    color: "#94a3b8",
  },
  navButtonPrimary: {
    flex: 1,
    borderRadius: 11,
    backgroundColor: "#0f766e",
    alignItems: "center",
    paddingVertical: 12,
  },
  navButtonPrimaryLabel: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
});
