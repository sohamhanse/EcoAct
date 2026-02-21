import { View, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { calculateAnnualCarbon } from "../../features/carbon/carbonCalculator";
import { useCarbonStore } from "../../store/useCarbonStore";
import { useRouter } from "expo-router";

export default function Calculator() {
  const router = useRouter();
  const setCarbon = useCarbonStore((s) => s.setCarbon);

  const [weeklyKm, setWeeklyKm] = useState("20");
  const [meatDays, setMeatDays] = useState("3");
  const [electricity, setElectricity] = useState("150");
  const [orders, setOrders] = useState("4");

  function handleCalculate() {
    const result = calculateAnnualCarbon({
      weeklyCarKm: Number(weeklyKm),
      meatDaysPerWeek: Number(meatDays),
      electricityKwhPerMonth: Number(electricity),
      onlineOrdersPerMonth: Number(orders),
    });

    setCarbon(result.total, result.breakdown);
    router.push("/calculator/result");
  }

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "600" }}>
        Carbon Calculator
      </Text>

      {[
        ["Weekly car km", weeklyKm, setWeeklyKm],
        ["Meat days/week", meatDays, setMeatDays],
        ["Electricity kWh/month", electricity, setElectricity],
        ["Online orders/month", orders, setOrders],
      ].map(([label, value, setter]: any) => (
        <TextInput
          key={label}
          value={value}
          onChangeText={setter}
          placeholder={label}
          keyboardType="numeric"
          style={{
            borderWidth: 1,
            padding: 12,
            borderRadius: 8,
            marginVertical: 8,
          }}
        />
      ))}

      <Pressable
        onPress={handleCalculate}
        style={{
          backgroundColor: "#16a34a",
          padding: 14,
          borderRadius: 10,
          marginTop: 16,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Calculate
        </Text>
      </Pressable>
    </View>
  );
}