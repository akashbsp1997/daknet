import { useEffect, useState } from "react";
import { View, FlatList, Text, Button, StyleSheet, Alert } from "react-native";
import { fetchFlaggedDeliveries, reviewFlaggedDelivery } from "../../api/tamperApi";

interface FlaggedDelivery {
  id: string;
  barcodeId: string;
  tamperScore: number;
  reasons: string[];
}

export function TamperAlertScreen() {
  const [alerts, setAlerts] = useState<FlaggedDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlaggedDeliveries()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleReview(id: string, action: "verified_safe" | "fraudulent") {
    try {
      await reviewFlaggedDelivery(id, action);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      Alert.alert("Error", "Could not save the review. Check your connection.");
    }
  }

  if (loading) return <Text style={styles.empty}>Loading alerts...</Text>;

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={alerts}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>No flagged deliveries.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.barcode}>{item.barcodeId}</Text>
          <Text style={styles.score}>Fraud score: {item.tamperScore}/100</Text>
          {item.reasons.map((reason) => (
            <Text key={reason} style={styles.reason}>
              • {reason}
            </Text>
          ))}
          <View style={styles.actions}>
            <Button title="Verified safe" onPress={() => handleReview(item.id, "verified_safe")} />
            <Button title="Fraudulent" color="#e74c3c" onPress={() => handleReview(item.id, "fraudulent")} />
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 12, gap: 4 },
  barcode: { fontWeight: "700", fontSize: 16 },
  score: { color: "#e74c3c", fontWeight: "600" },
  reason: { color: "#555" },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
