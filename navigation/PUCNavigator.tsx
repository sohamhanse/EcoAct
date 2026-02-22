import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PUCHomeScreen from "@/app/screens/puc/PUCHomeScreen";
import AddVehicleScreen from "@/app/screens/puc/AddVehicleScreen";
import VehicleDetailScreen from "@/app/screens/puc/VehicleDetailScreen";
import LogPUCScreen from "@/app/screens/puc/LogPUCScreen";
import ReportPollutionScreen from "@/app/screens/puc/ReportPollutionScreen";
import MapScreen from "@/app/screens/puc/MapScreen";

export type PUCStackParamList = {
  PUCHome: undefined;
  AddVehicle: undefined;
  VehicleDetail: { vehicleId: string };
  LogPUC: { vehicleId: string };
  ReportPollution: { lat?: number; lng?: number; locationName?: string; city?: string; state?: string };
  PUCMap: undefined;
};

const Stack = createNativeStackNavigator<PUCStackParamList>();

export default function PUCNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PUCHome" component={PUCHomeScreen} />
      <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <Stack.Screen name="LogPUC" component={LogPUCScreen} />
      <Stack.Screen name="ReportPollution" component={ReportPollutionScreen} />
      <Stack.Screen name="PUCMap" component={MapScreen} />
    </Stack.Navigator>
  );
}

