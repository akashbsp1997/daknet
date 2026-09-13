import { useState } from "react";
import { View, TextInput, Button, Text, ScrollView, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SenderStackParamList } from "../../navigation/SenderNavigator";
import { useAuth } from "../../auth/AuthContext";
import { createShipment } from "../../api/senderApi";

type Props = NativeStackScreenProps<SenderStackParamList, "CreateShipment">;

export function CreateShipmentScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!user || !recipientName || !recipientPhone || !deliveryAddress) {
      Alert.alert("Incomplete", "Recipient name, phone, and delivery address are required.");
      return;
    }

    setSaving(true);
    try {
      const shipment = await createShipment(user.id, {
        recipientName,
        recipientPhone,
        pickupAddress,
        deliveryAddress,
        packageDescription: packageDescription || undefined,
      });
      Alert.alert("Shipment booked", `Tracking ID: ${shipment.barcodeId}`);
      navigation.replace("ShipmentDetail", { shipmentId: shipment.id });
    } catch {
      Alert.alert("Error", "Could not book the shipment. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Recipient name</Text>
      <TextInput style={styles.input} value={recipientName} onChangeText={setRecipientName} />

      <Text style={styles.label}>Recipient phone</Text>
      <TextInput
        style={styles.input}
        value={recipientPhone}
        onChangeText={setRecipientPhone}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Pickup address</Text>
      <TextInput style={styles.input} value={pickupAddress} onChangeText={setPickupAddress} multiline />

      <Text style={styles.label}>Delivery address</Text>
      <TextInput style={styles.input} value={deliveryAddress} onChangeText={setDeliveryAddress} multiline />

      <Text style={styles.label}>Package description (optional)</Text>
      <TextInput style={styles.input} value={packageDescription} onChangeText={setPackageDescription} />

      <Button title={saving ? "Booking..." : "Book Shipment"} onPress={handleSubmit} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  label: { fontWeight: "600", marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 },
});
