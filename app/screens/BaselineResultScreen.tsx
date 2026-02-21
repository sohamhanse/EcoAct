import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PieChart } from "react-native-chart-kit";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { RootStackParamList } from "../../App";
import { useCarbonContext } from "../context/CarbonContext";

type Props = NativeStackScreenProps<RootStackParamList, "BaselineResult">;

function sourceLabel(value: string): string {
  if (value === "transport") {
    return "Transport";
  }
  if (value === "food") {
    return "Food";
  }
  if (value === "energy") {
    return "Energy";
  }
  return "Shopping";
}

export default function BaselineResultScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { state } = useCarbonContext();
  const result = state.baselineResult;

  if (!result) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>No baseline found. Please complete the questionnaire first.</Text>
        <Pressable style={styles.fallbackButton} onPress={() => navigation.replace("BaselineQuestionnaire")}>
          <Text style={styles.fallbackButtonLabel}>Go to Questionnaire</Text>
        </Pressable>
      </View>
    );
  }

  const chartWidth = Math.max(width - 52, 240);
  const differenceFromIndia = result.annualTotalKg - result.indiaAverageKg;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{result.annualTotalTons.toFixed(2)} tons/year</Text>
        <Text style={styles.heroSubtitle}>Total Annual CO2 Emission</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        <PieChart
          data={[
            {
              name: "Transport",
              population: result.breakdownKg.transport,
              color: "#0284c7",
              legendFontColor: "#334155",
              legendFontSize: 12,
            },
            {
              name: "Food",
              population: result.breakdownKg.food,
              color: "#16a34a",
              legendFontColor: "#334155",
              legendFontSize: 12,
            },
            {
              name: "Energy",
              population: result.breakdownKg.energy,
              color: "#ea580c",
              legendFontColor: "#334155",
              legendFontSize: 12,
            },
            {
              name: "Shopping",
              population: result.breakdownKg.shopping,
              color: "#7c3aed",
              legendFontColor: "#334155",
              legendFontSize: 12,
            },
          ]}
          width={chartWidth}
          height={230}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="8"
          hasLegend
          absolute
          chartConfig={{
            color: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
          }}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.detailText}>Your biggest contributor is {sourceLabel(result.topEmissionSource)}.</Text>
        <Text style={styles.detailText}>
          Comparison vs Indian average ({(result.indiaAverageKg / 1000).toFixed(1)} tons/year):{" "}
          {differenceFromIndia >= 0 ? `${(differenceFromIndia / 1000).toFixed(2)} tons above` : `${Math.abs(differenceFromIndia / 1000).toFixed(2)} tons below`}
          .
        </Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => navigation.replace("Dashboard")}>
        <Text style={styles.primaryButtonLabel}>Start Reducing</Text>
      </Pressable>
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
    gap: 12,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: "#14532d",
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  heroTitle: {
    color: "#f0fdf4",
    fontSize: 34,
    fontWeight: "700",
  },
  heroSubtitle: {
    color: "#dcfce7",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
  detailText: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 19,
  },
  primaryButton: {
    marginTop: 3,
    borderRadius: 11,
    backgroundColor: "#166534",
    alignItems: "center",
    paddingVertical: 13,
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  fallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f1f5f9",
    gap: 10,
  },
  fallbackText: {
    color: "#334155",
    fontSize: 14,
    textAlign: "center",
  },
  fallbackButton: {
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  fallbackButtonLabel: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
