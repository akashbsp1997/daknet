import { FlatList, View, Text, StyleSheet } from "react-native";
import type { RouteStop } from "../api/routeApi";

interface RouteListProps {
  stops: RouteStop[];
  onSelect?: (deliveryId: string) => void;
}

export function RouteList({ stops }: RouteListProps) {
  return (
    <FlatList
      data={stops}
      keyExtractor={(item) => item.deliveryId}
      renderItem={({ item, index }) => (
        <View style={styles.row}>
          <Text style={styles.index}>{index + 1}</Text>
          <View>
            <Text style={styles.deliveryId}>{item.deliveryId}</Text>
            {item.digipin ? <Text style={styles.digipin}>{item.digipin}</Text> : null}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  index: { fontWeight: "700", width: 24, textAlign: "center" },
  deliveryId: { fontWeight: "600" },
  digipin: { color: "#666", fontSize: 12 },
});
