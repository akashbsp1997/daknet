import { useCallback, useState } from "react";
import { View, FlatList, Text, Button, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SenderStackParamList } from "../../navigation/SenderNavigator";
import { useAuth } from "../../auth/AuthContext";
import { fetchSentShipments, type ShipmentSummary } from "../../api/senderApi";

type Props = NativeStackScreenProps<SenderStackParamList, "SenderDashboard">;

const STATUS_LABEL: Record<string, string> = {
  pending: "In transit",
  completed: "Delivered",
  disputed: "Under dispute",
};

export function SenderDashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setShipments(await fetchSentShipments(user.id));
    } catch {
      // Backend not reachable yet — keep whatever was last loaded.
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <Button title="New Shipment" onPress={() => navigation.navigate("CreateShipment")} />
      <FlatList
        data={shipments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, item.tamperFlag ? styles.flagged : undefined]}
            onPress={() => navigation.navigate("ShipmentDetail", { shipmentId: item.id })}
          >
            <Text style={styles.barcode}>{item.barcodeId}</Text>
            <Text>{item.recipientName}</Text>
            <Text>{STATUS_LABEL[item.status] ?? item.status}</Text>
            {item.tamperFlag ? <Text style={styles.flagText}>Tamper suspected</Text> : null}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No shipments yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  flagged: { backgroundColor: "#fdecea" },
  barcode: { fontWeight: "700" },
  flagText: { color: "#e74c3c", fontWeight: "600" },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
