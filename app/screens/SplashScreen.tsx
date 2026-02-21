import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../../App";
import { useCarbonContext } from "../context/CarbonContext";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const { isHydrated, entryRoute } = useCarbonContext();
  const pulse = useRef(new Animated.Value(0.95)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    ).start();

    Animated.timing(fade, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [fade, pulse]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const timeout = setTimeout(() => {
      navigation.replace(entryRoute);
    }, 2500);

    return () => clearTimeout(timeout);
  }, [entryRoute, isHydrated, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoCircle, { transform: [{ scale: pulse }], opacity: fade }]}>
        <Text style={styles.logoText}>EA</Text>
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: fade }]}>EcoAct</Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: fade }]}>Track. Act. Reduce.</Animated.Text>
      {!isHydrated ? <ActivityIndicator size="small" color="#d1fae5" style={styles.loader} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#064e3b",
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 94,
    height: 94,
    borderRadius: 999,
    backgroundColor: "#10b981",
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
