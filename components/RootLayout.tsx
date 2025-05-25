import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function RootLayout() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerRight: () =>
          user ? (
            <TouchableOpacity
              onPress={() => router.push("/settings/page")}
              style={{ marginRight: 12 }}
            >
              <Ionicons name="settings-outline" size={24} color="black" />
            </TouchableOpacity>
          ) : null,
      }}
    />
  );
}
