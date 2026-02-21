import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainNavigator } from "./MainNavigator";
import OnboardingScreen from "@/app/screens/OnboardingScreen";
import AuthScreen from "@/app/screens/AuthScreen";
import SplashScreen from "@/app/screens/SplashScreen";

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

/** Legacy routes (screens exist but are not in current navigator). */
export type LegacyStackParamList = RootStackParamList & {
  BaselineQuestionnaire: undefined;
  BaselineResult: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F7FAF8" },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Main" component={MainNavigator} />
    </Stack.Navigator>
  );
}
