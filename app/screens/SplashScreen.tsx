import { getAccessToken } from "@/api/axiosInstance";
import { COLORS } from "@/constants/colors";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { useAuthStore } from "@/store/useAuthStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from "react-native";

const ONBOARDING_KEY = "ecoact_onboarding_done";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const { user, hydrated, refreshUser } = useAuthStore();
  const pulse = useRef(new Animated.Value(0.95)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.05,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0.95,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, pulse]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    async function decideRoute() {
      const token = await getAccessToken();
      if (cancelled) return;
      if (token && user) {
        navigation.replace("Main");
        return;
      }
      if (token && !user) {
        try {
          await refreshUser();
          if (cancelled) return;
          navigation.replace("Main");
        } catch {
          navigation.replace("Onboarding");
        }
        return;
      }
      const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (onboardingDone === "true") {
        navigation.replace("Auth");
      } else {
        navigation.replace("Onboarding");
      }
    }
    const t = setTimeout(decideRoute, 1500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [hydrated, user, navigation, refreshUser]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoCircle, { transform: [{ scale: pulse }], opacity: fade }]}>
        <Text style={styles.logoText}>ET</Text>
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: fade }]}>EcoAct</Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: fade }]}>Track. Act. Reduce.</Animated.Text>
      {!hydrated ? <ActivityIndicator size="small" color={COLORS.primaryPale} style={styles.loader} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 94,
    height: 94,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#ecfdf5",
    fontSize: 34,
    fontWeight: "700",
  },
  title: {
    marginTop: 16,
    color: "#ecfdf5",
    fontSize: 34,
    fontWeight: "700",
  },
  tagline: {
    marginTop: 8,
    color: "#d1fae5",
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
});
