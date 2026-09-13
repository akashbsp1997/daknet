import { useState } from "react";
import { View, Image, Button, Text, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";

export interface CapturedPhoto {
  uri: string;
  sizeBytes: number;
  capturedAtMs: number;
}

interface PhotoCaptureProps {
  label: string;
  onCaptured: (photo: CapturedPhoto) => void;
}

export function PhotoCapture({ label, onCaptured }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);

  async function capture() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: false,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setPreview(asset.uri);
    onCaptured({
      uri: asset.uri,
      sizeBytes: asset.fileSize ?? 0,
      capturedAtMs: Date.now(),
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {preview ? <Image source={{ uri: preview }} style={styles.preview} /> : null}
      <Button title={preview ? "Retake photo" : "Take photo"} onPress={capture} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  label: { fontWeight: "600", marginBottom: 4 },
  preview: { width: 120, height: 120, borderRadius: 8, marginBottom: 8 },
});
