import { Button } from "react-native";
import { useAuth } from "../auth/AuthContext";

export function LogoutButton() {
  const { logout } = useAuth();
  return <Button title="Log out" onPress={logout} />;
}
