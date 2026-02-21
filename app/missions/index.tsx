import { View, Text, Pressable } from "react-native";
import { missions } from "../../features/missions/missionList";
import { useMissionStore } from "../../store/useMissionStore";
import { useRouter } from "expo-router";

export default function Missions() {
  const complete = useMissionStore((s) => s.complete);
  const router = useRouter();

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "600" }}>
        Daily Missions
      </Text>

      {missions.map((m) => (
        <Pressable
          key={m.id}
          onPress={() => complete(m.co2Saved)}
          style={{
            padding: 14,
            borderRadius: 10,
            borderWidth: 1,
            marginVertical: 8,
          }}
        >
          <Text>{m.title}</Text>
          <Text>{m.co2Saved} kg CO₂ saved</Text>
        </Pressable>
      ))}

      <Pressable
        onPress={() => router.push("/dashboard")}
        style={{
          backgroundColor: "#16a34a",
          padding: 14,
          borderRadius: 10,
          marginTop: 16,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          View Impact
        </Text>
      </Pressable>
    </View>
  );
}