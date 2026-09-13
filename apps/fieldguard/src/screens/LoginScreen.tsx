import { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet } from "react-native";
import { requestOtp, verifyOtp } from "../api/authApi";
import { useAuth } from "../auth/AuthContext";

export function LoginScreen() {
  const { setSession } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp() {
    setError(null);
    try {
      await requestOtp(phone);
      setOtpSent(true);
    } catch {
      setError("Could not send OTP. Check your connection and try again.");
    }
  }

  async function handleVerify() {
    setError(null);
    try {
      const result = await verifyOtp(phone, otp);
      // The root navigator swaps to the right layout as soon as the session
      // is set — role decides addressee/sender/operative/admin, not this screen.
      await setSession(result.token, result.user);
    } catch {
      setError("Invalid OTP.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FieldGuard</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        editable={!otpSent}
      />
      {otpSent ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />
          <Button title="Verify & Log In" onPress={handleVerify} />
        </>
      ) : (
        <Button title="Send OTP" onPress={handleSendOtp} disabled={phone.length < 10} />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
  error: { color: "#e74c3c", textAlign: "center" },
});
