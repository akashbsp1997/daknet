import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/LoginScreen";
import { DeliveryDashboardScreen } from "../screens/DeliveryDashboardScreen";
import { DeliveryFormScreen } from "../screens/DeliveryFormScreen";
import { TamperAlertScreen } from "../screens/TamperAlertScreen";
import { RouteOptimizationScreen } from "../screens/RouteOptimizationScreen";
import { AdminPanelScreen } from "../screens/AdminPanelScreen";

export type RootStackParamList = {
  Login: undefined;
  Dashboard: { postmanId: string };
  DeliveryForm: { postmanId: string; barcodeId?: string };
  TamperAlerts: undefined;
  RouteOptimization: { postmanId: string };
  AdminPanel: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "FieldGuard" }} />
        <Stack.Screen name="Dashboard" component={DeliveryDashboardScreen} options={{ title: "Today's Deliveries" }} />
        <Stack.Screen name="DeliveryForm" component={DeliveryFormScreen} options={{ title: "Deliver Package" }} />
        <Stack.Screen name="TamperAlerts" component={TamperAlertScreen} options={{ title: "Fraud Alerts" }} />
        <Stack.Screen name="RouteOptimization" component={RouteOptimizationScreen} options={{ title: "Optimized Route" }} />
        <Stack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ title: "Admin" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
