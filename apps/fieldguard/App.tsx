import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/auth/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { flushSyncQueue } from "./src/utils/offlineSync";

// Best-effort sync attempt on cold start; the operative dashboard's
// pull-to-refresh (and future connectivity-change listener) cover the rest.
flushSyncQueue().catch(() => undefined);

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}
