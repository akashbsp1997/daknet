import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AddresseeHomeScreen } from "../screens/addressee/AddresseeHomeScreen";
import { ParcelDetailScreen } from "../screens/addressee/ParcelDetailScreen";
import { ReportIssueScreen } from "../screens/addressee/ReportIssueScreen";
import { LogoutButton } from "../components/LogoutButton";

export type AddresseeStackParamList = {
  AddresseeHome: undefined;
  ParcelDetail: { parcelId: string };
  ReportIssue: { parcelId: string };
};

const Stack = createNativeStackNavigator<AddresseeStackParamList>();

export function AddresseeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AddresseeHome"
        component={AddresseeHomeScreen}
        options={{ title: "My Parcels", headerRight: () => <LogoutButton /> }}
      />
      <Stack.Screen name="ParcelDetail" component={ParcelDetailScreen} options={{ title: "Parcel" }} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} options={{ title: "Report a Problem" }} />
    </Stack.Navigator>
  );
}
