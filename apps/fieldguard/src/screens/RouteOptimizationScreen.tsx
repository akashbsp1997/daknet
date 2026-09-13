import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { fetchTodaysRoute, type OptimizedRoute } from "../api/routeApi";
import { RouteList } from "../components/RouteList";
import { DeliveryMapView } from "../components/DeliveryMapView";

type Props = NativeStackScreenProps<RootStackParamList, "RouteOptimization">;

export function RouteOptimizationScreen({ route }: Props) {
  const { postmanId } = route.params;
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodaysRoute(postmanId)
      .then(setOptimizedRoute)
      .catch(() => setError("Route optimization requires a connection. Try again once online."));
  }, [postmanId]);

  if (error) return <Text style={styles.message}>{error}</Text>;
  if (!optimizedRoute) return <Text style={styles.message}>Optimizing route...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>
        {optimizedRoute.orderedStops.length} stops · {optimizedRoute.distanceKm.toFixed(1)} km · ~
        {optimizedRoute.estimatedMinutes} min
      </Text>
      <View style={styles.map}>
        <DeliveryMapView
          markers={optimizedRoute.orderedStops.map((stop) => ({
            id: stop.deliveryId,
            location: stop.location,
            status: "pending",
          }))}
        />
      </View>
      <View style={styles.list}>
        <RouteList stops={optimizedRoute.orderedStops} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: { padding: 12, fontWeight: "600", textAlign: "center" },
  map: { flex: 1 },
  list: { flex: 1, padding: 16 },
  message: { textAlign: "center", marginTop: 40, color: "#666" },
});
