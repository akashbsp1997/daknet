import MapView, { Marker } from "react-native-maps";
import { StyleSheet } from "react-native";
import type { GeoPoint } from "../utils/locationUtils";

export interface DeliveryMarker {
  id: string;
  location: GeoPoint;
  status: "pending" | "completed" | "disputed";
}

const STATUS_COLOR: Record<DeliveryMarker["status"], string> = {
  pending: "#f5a623",
  completed: "#2ecc71",
  disputed: "#e74c3c",
};

interface DeliveryMapViewProps {
  markers: DeliveryMarker[];
  onMarkerPress?: (id: string) => void;
}

export function DeliveryMapView({ markers, onMarkerPress }: DeliveryMapViewProps) {
  const initial = markers[0]?.location ?? { latitude: 28.6139, longitude: 77.209 };

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        ...initial,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={marker.location}
          pinColor={STATUS_COLOR[marker.status]}
          onPress={() => onMarkerPress?.(marker.id)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
