import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SenderDashboardScreen } from "../screens/sender/SenderDashboardScreen";
import { CreateShipmentScreen } from "../screens/sender/CreateShipmentScreen";
import { ShipmentDetailScreen } from "../screens/sender/ShipmentDetailScreen";
import { LogoutButton } from "../components/LogoutButton";

export type SenderStackParamList = {
  SenderDashboard: undefined;
  CreateShipment: undefined;
  ShipmentDetail: { shipmentId: string };
};

const Stack = createNativeStackNavigator<SenderStackParamList>();

export function SenderNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SenderDashboard"
        component={SenderDashboardScreen}
        options={{ title: "My Shipments", headerRight: () => <LogoutButton /> }}
      />
      <Stack.Screen name="CreateShipment" component={CreateShipmentScreen} options={{ title: "New Shipment" }} />
      <Stack.Screen name="ShipmentDetail" component={ShipmentDetailScreen} options={{ title: "Shipment" }} />
    </Stack.Navigator>
  );
}
