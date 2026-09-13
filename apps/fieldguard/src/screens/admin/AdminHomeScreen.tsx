import { View, Text, Button, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AdminStackParamList } from "../../navigation/AdminNavigator";

type Props = NativeStackScreenProps<AdminStackParamList, "AdminHome">;

export function AdminHomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin</Text>
      <Button title="Review flagged deliveries" onPress={() => navigation.navigate("TamperAlerts")} />
      {/* Analytics + CSV export land once the backend's /admin/analytics
          and /admin/export-csv endpoints exist (Week 4 of the build plan). */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
});
