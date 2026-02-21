import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CarbonProvider } from "./app/context/CarbonContext";
import AuthScreen from "./app/screens/AuthScreen";
import BaselineQuestionnaireScreen from "./app/screens/BaselineQuestionnaireScreen";
import BaselineResultScreen from "./app/screens/BaselineResultScreen";
import DashboardScreen from "./app/screens/DashboardScreen";
import OnboardingScreen from "./app/screens/OnboardingScreen";
import SplashScreen from "./app/screens/SplashScreen";

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  BaselineQuestionnaire: undefined;
  BaselineResult: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <CarbonProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#ffffff",
            },
            headerTintColor: "#0f172a",
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: "Welcome" }} />
          <Stack.Screen name="Auth" component={AuthScreen} options={{ title: "Authentication" }} />
          <Stack.Screen
            name="BaselineQuestionnaire"
            component={BaselineQuestionnaireScreen}
            options={{ title: "Baseline Setup" }}
          />
          <Stack.Screen
            name="BaselineResult"
            component={BaselineResultScreen}
            options={{ title: "Your Baseline Impact" }}
          />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Eco Dashboard" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </CarbonProvider>
  );
}
