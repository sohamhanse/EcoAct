import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { LegacyStackParamList } from "@/navigation/AppNavigator";
import { badgeLabels } from "../services/badgeEngine";
import { useCarbonContext } from "../context/CarbonContext";

type Props = NativeStackScreenProps<LegacyStackParamList, "Dashboard">;

function parseNumber(value: string): number {
  const normalized = value.replace(",", ".").replace(/[^0-9.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function DashboardScreen({ navigation }: Props) {
  const {
    currentUser,
    state,
    todayDateKey,
    hasCompletedDailyLogToday,
    needsMonthlyUtilityUpdate,
    todaysMissions,
    todayMissionCompletions,
    dynamicMonthlyKg,
    netImpactKg,
    improvementPercent,
    submitDailyQuickLog,
    submitMonthlyUtilityLog,
    completeMission,
    signOut,
  } = useCarbonContext();

  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);

  const [dailyCarKm, setDailyCarKm] = useState("0");
  const [dailyFoodType, setDailyFoodType] = useState<"veg" | "non-veg">("veg");
  const [acUsed, setAcUsed] = useState(false);
  const [acHours, setAcHours] = useState("0");

  const [electricityKwh, setElectricityKwh] = useState("0");
  const [lpgUsage, setLpgUsage] = useState("0");
  const [gasCylinderCount, setGasCylinderCount] = useState("0");

  const todayLog = state.dailyLogsByDate[todayDateKey];
  const baselineKg = state.baselineResult?.annualTotalKg ?? 0;

  useEffect(() => {
    if (!hasCompletedDailyLogToday) {
      setShowDailyModal(true);
    }
  }, [hasCompletedDailyLogToday]);

  useEffect(() => {
    if (needsMonthlyUtilityUpdate) {
      setShowMonthlyModal(true);
    }
  }, [needsMonthlyUtilityUpdate]);

  const missionCompletionCount = todayMissionCompletions.length;
  const carbonNeutralProgress = Math.max(0, Math.min(100, improvementPercent));

  const badgeNames = useMemo(
    () => state.badges.map((badgeId) => badgeLabels[badgeId]),
    [state.badges],
  );

  function handleDailySubmit() {
    submitDailyQuickLog({
      carKm: parseNumber(dailyCarKm),
      foodType: dailyFoodType,
      acHours: acUsed ? parseNumber(acHours) : 0,
    });

    setShowDailyModal(false);
  }

  function handleMonthlySubmit() {
    submitMonthlyUtilityLog({
      electricityKwh: parseNumber(electricityKwh),
      lpgUsage: parseNumber(lpgUsage),
      gasCylinderCount: parseNumber(gasCylinderCount),
    });

    setShowMonthlyModal(false);
  }

  function handleMissionComplete(missionId: string) {
    completeMission(missionId);
  }

  function handleSignOut() {
    signOut();
    navigation.replace("Auth");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Hello, {currentUser?.name ?? "Eco User"}</Text>
        <Text style={styles.heroSubtitle}>Daily climate actions compound into measurable impact.</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Current Net Carbon</Text>
          <Text style={styles.metricValue}>{(netImpactKg / 1000).toFixed(2)} t/year</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total CO2 Saved</Text>
          <Text style={styles.metricValue}>{state.totalSavedKg.toFixed(2)} kg</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Current Streak</Text>
          <Text style={styles.metricValue}>{state.streak} days</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Points</Text>
          <Text style={styles.metricValue}>{state.points}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Today&apos;s Quick Log</Text>
        {todayLog ? (
          <>
            <Text style={styles.bodyText}>Car km: {todayLog.carKm}</Text>
            <Text style={styles.bodyText}>Food: {todayLog.foodType === "veg" ? "Veg" : "Non-veg"}</Text>
            <Text style={styles.bodyText}>AC hours: {todayLog.acHours}</Text>
            <Text style={styles.bodyText}>Daily CO2: {todayLog.dailyEmissionKg.toFixed(2)} kg</Text>
          </>
        ) : (
          <Text style={styles.bodyText}>No daily log submitted yet.</Text>
        )}

        <Pressable style={styles.outlineButton} onPress={() => setShowDailyModal(true)}>
          <Text style={styles.outlineButtonLabel}>
            {todayLog ? "Update Today&apos;s Log" : "Open Daily Quick Log"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Today&apos;s Missions</Text>
        <Text style={styles.bodyText}>Completed today: {missionCompletionCount}/3</Text>
        {todaysMissions.map((mission) => {
          const completed = todayMissionCompletions.includes(mission.id);
          return (
            <View key={mission.id} style={styles.missionItem}>
              <Text style={styles.missionTitle}>{mission.title}</Text>
              <Text style={styles.bodyText}>{mission.description}</Text>
              <Text style={styles.bodyText}>
                Difficulty: {mission.difficulty.toUpperCase()} | Saved: {mission.co2SavedKg.toFixed(2)} kg
              </Text>
              <Pressable
                style={[styles.missionButton, completed && styles.missionButtonDisabled]}
                onPress={() => handleMissionComplete(mission.id)}
                disabled={completed}
              >
                <Text style={styles.missionButtonLabel}>{completed ? "Completed" : "Complete Mission"}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Carbon Neutral Progress</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${carbonNeutralProgress}%` }]} />
        </View>
        <Text style={styles.bodyText}>
          Baseline: {(baselineKg / 1000).toFixed(2)} t/year | Dynamic month: {dynamicMonthlyKg.toFixed(2)} kg
        </Text>
        <Text style={styles.bodyText}>Net reduction: {improvementPercent.toFixed(2)}%</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Badges</Text>
        {badgeNames.length === 0 ? (
          <Text style={styles.bodyText}>No badges unlocked yet.</Text>
        ) : (
          badgeNames.map((name) => (
            <Text key={name} style={styles.bodyText}>
              • {name}
            </Text>
          ))
        )}
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.outlineButton} onPress={() => navigation.navigate("BaselineQuestionnaire")}>
          <Text style={styles.outlineButtonLabel}>Recalculate Baseline</Text>
        </Pressable>
        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonLabel}>Sign Out</Text>
        </Pressable>
      </View>

      <Modal visible={showDailyModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Daily Quick Log</Text>
            <Text style={styles.bodyText}>Q1: How many km did you drive today?</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={dailyCarKm}
              onChangeText={setDailyCarKm}
            />
            <Text style={styles.bodyText}>Q2: What did you eat today?</Text>
            <View style={styles.toggleRow}>
              <OptionToggle label="Veg" active={dailyFoodType === "veg"} onPress={() => setDailyFoodType("veg")} />
              <OptionToggle
                label="Non-veg"
                active={dailyFoodType === "non-veg"}
                onPress={() => setDailyFoodType("non-veg")}
              />
            </View>
            <Text style={styles.bodyText}>Q3: Did you use AC today?</Text>
            <View style={styles.toggleRow}>
              <OptionToggle label="Yes" active={acUsed} onPress={() => setAcUsed(true)} />
              <OptionToggle label="No" active={!acUsed} onPress={() => setAcUsed(false)} />
            </View>
            {acUsed ? (
              <>
                <Text style={styles.bodyText}>AC hours today</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={acHours} onChangeText={setAcHours} />
              </>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondaryButton} onPress={() => setShowDailyModal(false)}>
                <Text style={styles.modalSecondaryLabel}>Later</Text>
              </Pressable>
              <Pressable style={styles.modalPrimaryButton} onPress={handleDailySubmit}>
                <Text style={styles.modalPrimaryLabel}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showMonthlyModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Monthly Utilities Update</Text>
            <Text style={styles.bodyText}>Electricity bill / kWh</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={electricityKwh}
              onChangeText={setElectricityKwh}
            />
            <Text style={styles.bodyText}>LPG usage</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={lpgUsage} onChangeText={setLpgUsage} />
            <Text style={styles.bodyText}>Gas cylinder count</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={gasCylinderCount}
              onChangeText={setGasCylinderCount}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondaryButton} onPress={() => setShowMonthlyModal(false)}>
                <Text style={styles.modalSecondaryLabel}>Later</Text>
              </Pressable>
              <Pressable style={styles.modalPrimaryButton} onPress={handleMonthlySubmit}>
                <Text style={styles.modalPrimaryLabel}>Update</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function OptionToggle({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.toggleButton, active && styles.toggleButtonActive]} onPress={onPress}>
      <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{label}</Text>
    </Pressable>
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
    paddingBottom: 30,
  },
  heroCard: {
    backgroundColor: "#0f766e",
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  heroTitle: {
    color: "#ecfeff",
    fontSize: 25,
    fontWeight: "700",
  },
  heroSubtitle: {
    color: "#ccfbf1",
    fontSize: 13,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    gap: 4,
  },
  metricLabel: {
    color: "#475569",
    fontSize: 12,
  },
  metricValue: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 7,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
  bodyText: {
    color: "#334155",
    fontSize: 13,
  },
  missionItem: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
    gap: 4,
  },
  missionTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
  },
  missionButton: {
    marginTop: 4,
    borderRadius: 9,
    backgroundColor: "#166534",
    alignItems: "center",
    paddingVertical: 10,
  },
  missionButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  missionButtonLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#16a34a",
  },
  actionsRow: {
    gap: 8,
  },
  outlineButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0f766e",
    alignItems: "center",
    paddingVertical: 11,
    backgroundColor: "#ffffff",
  },
  outlineButtonLabel: {
    color: "#0f766e",
    fontWeight: "600",
    fontSize: 13,
  },
  signOutButton: {
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
    backgroundColor: "#b91c1c",
  },
  signOutButtonLabel: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    gap: 8,
  },
  modalTitle: {
    color: "#0f172a",
    fontSize: 18,
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
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 9,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
  },
  toggleButtonActive: {
    borderColor: "#0f766e",
    backgroundColor: "#ccfbf1",
  },
  toggleLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  toggleLabelActive: {
    color: "#115e59",
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  modalSecondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
    backgroundColor: "#ffffff",
  },
  modalSecondaryLabel: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  modalPrimaryButton: {
    flex: 1,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
    backgroundColor: "#166534",
  },
  modalPrimaryLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
