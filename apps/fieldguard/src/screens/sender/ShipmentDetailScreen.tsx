import { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SenderStackParamList } from "../../navigation/SenderNavigator";
import { fetchShipmentDetail } from "../../api/senderApi";

type Props = NativeStackScreenProps<SenderStackParamList, "ShipmentDetail">;

export function ShipmentDetailScreen({ route }: Props) {
  const { shipmentId } = route.params;
  const [shipment, setShipment] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShipmentDetail(shipmentId)
      .then(setShipment)
      .catch(() => setError("Could not load this shipment. Check your connection."));
  }, [shipmentId]);

  if (error) return <Text style={styles.message}>{error}</Text>;
  if (!shipment) return <Text style={styles.message}>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.barcode}>{String(shipment.barcode_id)}</Text>
      <Text>Status: {String(shipment.status)}</Text>
      {shipment.tamper_flag ? <Text style={styles.flagText}>Flagged for review</Text> : null}
      {shipment.photo_recipient_url ? (
        <>
          <Text style={styles.label}>Proof of delivery</Text>
          <Image source={{ uri: String(shipment.photo_recipient_url) }} style={styles.photo} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  barcode: { fontSize: 20, fontWeight: "700" },
  label: { fontWeight: "600", marginTop: 12 },
  photo: { width: 200, height: 200, borderRadius: 8 },
  flagText: { color: "#e74c3c", fontWeight: "600" },
  message: { textAlign: "center", marginTop: 40, color: "#666" },
});
