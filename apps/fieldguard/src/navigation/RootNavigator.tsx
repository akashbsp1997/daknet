import { NavigationContainer } from "@react-navigation/native";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { AuthStack } from "./AuthStack";
import { OperativeNavigator } from "./OperativeNavigator";
import { AdminNavigator } from "./AdminNavigator";
import { SenderNavigator } from "./SenderNavigator";
import { AddresseeNavigator } from "./AddresseeNavigator";

/** Picks the entire navigation stack by role — one app, four layouts. */
export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : user.role === "operative" ? (
        <OperativeNavigator />
      ) : user.role === "admin" ? (
        <AdminNavigator />
      ) : user.role === "sender" ? (
        <SenderNavigator />
      ) : (
        <AddresseeNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
