import { useCallback, useState } from "react";
import { View, FlatList, Text, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AddresseeStackParamList } from "../../navigation/AddresseeNavigator";
import { useAuth } from "../../auth/AuthContext";
import { fetchIncomingParcels, type IncomingParcel } from "../../api/addresseeApi";

type Props = NativeStackScreenProps<AddresseeStackParamList, "AddresseeHome">;

const STATUS_LABEL: Record<string, string> = {
  pending: "On the way",
  completed: "Delivered",
  disputed: "Under review",
};

export function AddresseeHomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [parcels, setParcels] = useState<IncomingParcel[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setParcels(await fetchIncomingParcels(user.phone));
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
    <FlatList
      contentContainerStyle={styles.container}
      data={parcels}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.row, item.tamperFlag ? styles.flagged : undefined]}
          onPress={() => navigation.navigate("ParcelDetail", { parcelId: item.id })}
        >
          <Text style={styles.barcode}>{item.barcodeId}</Text>
          <Text>From {item.senderName}</Text>
          <Text>{STATUS_LABEL[item.status] ?? item.status}</Text>
          {item.tamperFlag ? <Text style={styles.flagText}>Under review</Text> : null}
        </Pressable>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No parcels coming your way.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  flagged: { backgroundColor: "#fdecea" },
  barcode: { fontWeight: "700" },
  flagText: { color: "#e74c3c", fontWeight: "600" },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
