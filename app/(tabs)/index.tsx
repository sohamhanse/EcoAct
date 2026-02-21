import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 32, fontWeight: "700" }}>
        🌍 Eco Action
      </Text>

      <Text style={{ marginVertical: 16, fontSize: 16 }}>
        Track your carbon footprint and earn rewards for real impact.
      </Text>

      <Pressable
        onPress={() => router.push("/calculator")}
        style={{
          backgroundColor: "#22c55e",
          padding: 14,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
          Start
        </Text>
      </Pressable>
    </View>
  );
}