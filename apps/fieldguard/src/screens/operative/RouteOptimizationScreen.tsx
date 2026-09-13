import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { fetchTodaysRoute, type OptimizedRoute } from "../../api/routeApi";
import { RouteList } from "../../components/RouteList";
import { DeliveryMapView } from "../../components/DeliveryMapView";
import { useAuth } from "../../auth/AuthContext";

export function RouteOptimizationScreen() {
  const { user } = useAuth();
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchTodaysRoute(user.id)
      .then(setOptimizedRoute)
      .catch(() => setError("Route optimization requires a connection. Try again once online."));
  }, [user]);

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
