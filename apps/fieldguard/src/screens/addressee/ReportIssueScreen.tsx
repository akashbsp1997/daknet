import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AddresseeStackParamList } from "../../navigation/AddresseeNavigator";
import { reportIssue } from "../../api/addresseeApi";

type Props = NativeStackScreenProps<AddresseeStackParamList, "ReportIssue">;

const REASONS = ["Not delivered", "Wrong item", "Damaged package", "Suspected tampering"] as const;

export function ReportIssueScreen({ route, navigation }: Props) {
  const { parcelId } = route.params;
  const [reason, setReason] = useState<(typeof REASONS)[number]>(REASONS[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await reportIssue(parcelId, reason, notes || undefined);
      Alert.alert("Reported", "Thanks — an admin will review this.");
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Could not submit the report. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>What went wrong?</Text>
      {REASONS.map((option) => (
        <Button
          key={option}
          title={option}
          color={reason === option ? "#2ecc71" : undefined}
          onPress={() => setReason(option)}
        />
      ))}

      <Text style={styles.label}>Additional details (optional)</Text>
      <TextInput
        style={styles.input}
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Anything else the admin should know"
      />

      <Button title={submitting ? "Submitting..." : "Submit report"} onPress={handleSubmit} disabled={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  label: { fontWeight: "600", marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, minHeight: 80 },
});
