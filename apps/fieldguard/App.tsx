import { StatusBar } from "expo-status-bar";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { flushSyncQueue } from "./src/utils/offlineSync";

// Best-effort sync attempt on cold start; the dashboard's pull-to-refresh
// (and future connectivity-change listener) cover the rest.
flushSyncQueue().catch(() => undefined);

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}
