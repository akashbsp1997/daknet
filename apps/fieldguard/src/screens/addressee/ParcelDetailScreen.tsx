import { useCallback, useState } from "react";
import { View, Text, Image, Button, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AddresseeStackParamList } from "../../navigation/AddresseeNavigator";
import { fetchParcelDetail, confirmReceipt } from "../../api/addresseeApi";

type Props = NativeStackScreenProps<AddresseeStackParamList, "ParcelDetail">;

export function ParcelDetailScreen({ route, navigation }: Props) {
  const { parcelId } = route.params;
  const [parcel, setParcel] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(() => {
    fetchParcelDetail(parcelId)
      .then(setParcel)
      .catch(() => setError("Could not load this parcel. Check your connection."));
  }, [parcelId]);

  useFocusEffect(load);

  async function handleConfirm() {
    setConfirming(true);
    try {
      await confirmReceipt(parcelId);
      Alert.alert("Thanks!", "Receipt confirmed.");
      load();
    } catch {
      Alert.alert("Error", "Could not confirm receipt. Check your connection.");
    } finally {
      setConfirming(false);
    }
  }

  if (error) return <Text style={styles.message}>{error}</Text>;
  if (!parcel) return <Text style={styles.message}>Loading...</Text>;

  const delivered = parcel.status === "completed";

  return (
    <View style={styles.container}>
      <Text style={styles.barcode}>{String(parcel.barcode_id)}</Text>
      <Text>From {String(parcel.sender_name ?? "sender")}</Text>
      <Text>Status: {String(parcel.status)}</Text>

      {delivered && parcel.photo_recipient_url ? (
        <>
          <Text style={styles.label}>Proof of delivery</Text>
          <Image source={{ uri: String(parcel.photo_recipient_url) }} style={styles.photo} />
        </>
      ) : null}

      {delivered ? (
        <View style={styles.actions}>
          <Button title={confirming ? "Confirming..." : "Confirm receipt"} onPress={handleConfirm} disabled={confirming} />
          <Button
            title="Report a problem"
            color="#e74c3c"
            onPress={() => navigation.navigate("ReportIssue", { parcelId })}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  barcode: { fontSize: 20, fontWeight: "700" },
  label: { fontWeight: "600", marginTop: 12 },
  photo: { width: 200, height: 200, borderRadius: 8 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  message: { textAlign: "center", marginTop: 40, color: "#666" },
});
