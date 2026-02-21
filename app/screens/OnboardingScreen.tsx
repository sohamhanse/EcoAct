import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";

const ONBOARDING_KEY = "ecotrack_onboarding_done";
const { width } = Dimensions.get("window");

const SLIDES = [
  { title: "Track your footprint", subtitle: "Understand your carbon impact with our simple calculator." },
  { title: "Complete missions", subtitle: "Earn points and reduce CO₂ with daily eco actions." },
  { title: "Compete & collaborate", subtitle: "Climb the leaderboard and join communities." },
];

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

export default function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  async function continueToAuth() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    navigation.replace("Auth");
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>EcoTrack</Text>
        <Text style={styles.heroSubtitle}>Track and reward environmental actions</Text>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </View>
        )}
      />
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>

      <Pressable style={styles.primaryButton} onPress={continueToAuth}>
        <Text style={styles.primaryButtonLabel}>Continue with Google</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={continueToAuth}>
        <Text style={styles.secondaryButtonLabel}>Skip to calculator</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.base,
    paddingTop: SPACING["3xl"],
    backgroundColor: COLORS.background,
  },
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  heroTitle: {
    color: "#ecfdf5",
    fontSize: 28,
    fontWeight: "700",
  },
  heroSubtitle: {
    color: "#ccfbf1",
    fontSize: 14,
    marginTop: 4,
  },
  slide: {
    paddingHorizontal: SPACING.base,
    justifyContent: "center",
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  slideSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: SPACING.base,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: "center",
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
  },
  primaryButtonLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  secondaryButtonLabel: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 15,
  },
});
