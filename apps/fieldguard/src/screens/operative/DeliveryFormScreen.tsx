import { useState } from "react";
import { View, TextInput, Button, Text, ScrollView, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OperativeStackParamList } from "../../navigation/OperativeNavigator";
import { PhotoCapture, type CapturedPhoto } from "../../components/PhotoCapture";
import { SignaturePad } from "../../components/SignaturePad";
import { saveDeliveryLocally } from "../../utils/offlineSync";
import { useAuth } from "../../auth/AuthContext";

type Props = NativeStackScreenProps<OperativeStackParamList, "DeliveryForm">;

type Condition = "sealed" | "damaged" | "tampered";

export function DeliveryFormScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const { barcodeId: initialBarcode } = route.params;

  const [barcodeId, setBarcodeId] = useState(initialBarcode ?? "");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [condition, setCondition] = useState<Condition>("sealed");
  const [packagePhoto, setPackagePhoto] = useState<CapturedPhoto | null>(null);
  const [recipientPhoto, setRecipientPhoto] = useState<CapturedPhoto | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!user || !barcodeId || !packagePhoto || !recipientPhoto || !signature) {
      Alert.alert("Incomplete", "Barcode, both photos, and a signature are required.");
      return;
    }

    setSaving(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      const position = permission.granted ? await Location.getCurrentPositionAsync({}) : null;

      await saveDeliveryLocally({
        id: `${barcodeId}-${Date.now()}`,
        barcodeId,
        postmanId: user.id,
        recipientPhone,
        photoPackageUri: packagePhoto.uri,
        photoRecipientUri: recipientPhoto.uri,
        signatureUri: signature,
        gpsLatitude: position?.coords.latitude,
        gpsLongitude: position?.coords.longitude,
        condition,
        // Real tamper scoring needs the dispatch-time photo/GPS baseline for this
        // barcode, fetched from the backend — not available offline, so it runs
        // server-side on sync (see api/tamperApi.ts) rather than here.
        tamperFlag: false,
        status: "completed",
      });

      Alert.alert("Saved", "Delivery saved on-device. It will sync automatically.");
      navigation.replace("Dashboard");
    } catch {
      Alert.alert("Error", "Could not save delivery. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Package barcode</Text>
      <TextInput style={styles.input} value={barcodeId} onChangeText={setBarcodeId} placeholder="Scan or enter barcode" />

      <PhotoCapture label="Photo of package" onCaptured={setPackagePhoto} />
      <PhotoCapture label="Photo of recipient" onCaptured={setRecipientPhoto} />

      <Text style={styles.label}>Recipient phone</Text>
      <TextInput
        style={styles.input}
        value={recipientPhone}
        onChangeText={setRecipientPhone}
        keyboardType="phone-pad"
        placeholder="10-digit mobile number"
      />

      <Text style={styles.label}>Package condition</Text>
      <View style={styles.conditionRow}>
        {(["sealed", "damaged", "tampered"] as Condition[]).map((option) => (
          <Button
            key={option}
            title={option}
            color={condition === option ? "#2ecc71" : undefined}
            onPress={() => setCondition(option)}
          />
        ))}
      </View>

      <Text style={styles.label}>Recipient signature</Text>
      <SignaturePad onSigned={setSignature} />

      <Button title={saving ? "Saving..." : "Complete Delivery"} onPress={handleSubmit} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  label: { fontWeight: "600", marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 },
  conditionRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
});
