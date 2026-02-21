import { View, Text } from "react-native";
import { useMissionStore } from "../../store/useMissionStore";
import { useCarbonStore } from "../../store/useCarbonStore";

export default function Dashboard() {
  const { savedCO2, points } = useMissionStore();
  const baseline = useCarbonStore((s) => s.baseline);

  const progress = Math.min(
    Math.round((savedCO2 / baseline) * 100),
    100
  );

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>
        Impact Dashboard
      </Text>

      <Text>CO₂ Saved: {savedCO2} kg</Text>
      <Text>Points: {points}</Text>
      <Text>Carbon Neutral Progress: {progress}%</Text>
    </View>
  );
}