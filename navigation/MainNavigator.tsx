import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomTabNavigator } from "./BottomTabNavigator";
import CommunityScreen from "@/app/screens/CommunityScreen";
import CommunityEngagementScreen from "@/app/screens/CommunityEngagementScreen";

export type MainStackParamList = {
  Tabs: undefined;
  Community: undefined;
  CommunityEngagement: { communityId: string; communityName?: string };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={BottomTabNavigator} />
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="CommunityEngagement" component={CommunityEngagementScreen} />
    </Stack.Navigator>
  );
}
