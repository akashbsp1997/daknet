import { View, StyleSheet } from "react-native";
import SignatureScreen, { type SignatureViewRef } from "react-native-signature-canvas";
import { useRef } from "react";

interface SignaturePadProps {
  onSigned: (base64Png: string) => void;
}

export function SignaturePad({ onSigned }: SignaturePadProps) {
  const ref = useRef<SignatureViewRef>(null);

  return (
    <View style={styles.container}>
      <SignatureScreen
        ref={ref}
        onOK={onSigned}
        webStyle=".m-signature-pad--footer { display: none; margin: 0; }"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 200, borderWidth: 1, borderColor: "#ccc", borderRadius: 8 },
});
