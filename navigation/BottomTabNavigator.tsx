import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";
import HomeScreen from "@/app/screens/HomeScreen";
import CalculatorScreen from "@/app/screens/CalculatorScreen";
import MissionsScreen from "@/app/screens/MissionsScreen";
import LeaderboardScreen from "@/app/screens/LeaderboardScreen";
import ProfileScreen from "@/app/screens/ProfileScreen";

export type TabParamList = {
  Home: undefined;
  Calculator: undefined;
  Missions: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const tabIcons: Record<keyof TabParamList, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: "home", inactive: "home-outline" },
  Calculator: { active: "calculator", inactive: "calculator-outline" },
  Missions: { active: "leaf", inactive: "leaf-outline" },
  Leaderboard: { active: "trophy", inactive: "trophy-outline" },
  Profile: { active: "person", inactive: "person-outline" },
};

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarAccessibilityLabel: `${route.name} tab`,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: SPACING.sm,
          paddingTop: SPACING.sm,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: TYPOGRAPHY.size.xs },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? tabIcons[route.name].active : tabIcons[route.name].inactive}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calculator" component={CalculatorScreen} />
      <Tab.Screen name="Missions" component={MissionsScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
