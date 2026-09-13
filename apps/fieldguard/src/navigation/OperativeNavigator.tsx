import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DashboardScreen } from "../screens/operative/DashboardScreen";
import { DeliveryFormScreen } from "../screens/operative/DeliveryFormScreen";
import { RouteOptimizationScreen } from "../screens/operative/RouteOptimizationScreen";
import { LogoutButton } from "../components/LogoutButton";

export type OperativeStackParamList = {
  Dashboard: undefined;
  DeliveryForm: { barcodeId?: string };
  RouteOptimization: undefined;
};

const Stack = createNativeStackNavigator<OperativeStackParamList>();

export function OperativeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "Today's Deliveries", headerRight: () => <LogoutButton /> }}
      />
      <Stack.Screen name="DeliveryForm" component={DeliveryFormScreen} options={{ title: "Deliver Package" }} />
      <Stack.Screen
        name="RouteOptimization"
        component={RouteOptimizationScreen}
        options={{ title: "Optimized Route" }}
      />
    </Stack.Navigator>
  );
}
