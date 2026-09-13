import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AdminHomeScreen } from "../screens/admin/AdminHomeScreen";
import { TamperAlertScreen } from "../screens/admin/TamperAlertScreen";
import { LogoutButton } from "../components/LogoutButton";

export type AdminStackParamList = {
  AdminHome: undefined;
  TamperAlerts: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ title: "Admin", headerRight: () => <LogoutButton /> }}
      />
      <Stack.Screen name="TamperAlerts" component={TamperAlertScreen} options={{ title: "Fraud Alerts" }} />
    </Stack.Navigator>
  );
}
