import { useCallback, useState } from "react";
import { View, FlatList, Text, Button, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperativeStackParamList } from "../../navigation/OperativeNavigator";
import { useAuth } from "../../auth/AuthContext";
import { listDeliveries, flushSyncQueue } from "../../utils/offlineSync";

type Props = NativeStackScreenProps<OperativeStackParamList, "Dashboard">;

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  completed: "Delivered",
  disputed: "Flagged for review",
};

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Record<string, unknown>[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const rows = await listDeliveries(user.id);
    setDeliveries(rows);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await flushSyncQueue();
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Button title="New Delivery" onPress={() => navigation.navigate("DeliveryForm", {})} />
        <Button title="Optimize Route" onPress={() => navigation.navigate("RouteOptimization")} />
      </View>
      <FlatList
        data={deliveries}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.row, item.tamper_flag ? styles.flagged : undefined]}>
            <Text style={styles.barcode}>{String(item.barcode_id)}</Text>
            <Text>{STATUS_LABEL[String(item.status)] ?? String(item.status)}</Text>
            {item.tamper_flag ? <Text style={styles.flagText}>Tamper suspected</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No deliveries yet today.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  flagged: { backgroundColor: "#fdecea" },
  barcode: { fontWeight: "700" },
  flagText: { color: "#e74c3c", fontWeight: "600" },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
