import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function RootLayout() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <Stack
      screenOptions={({ route }) => {
        const hideBackFor = [
          "(auth)/login",
          "(auth)/register",
          "settings/page",
        ];
        const isAuthScreen = hideBackFor.includes("/" + route.name);
        const hiddenHeaderRoutes = ["(auth)/", "settings"];

        const isHiddenHeader = hiddenHeaderRoutes.some((prefix) =>
          route.name.startsWith(prefix)
        );

        return {
          headerStyle: {
            backgroundColor: "white",
          },
          headerTintColor: "black",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerBackVisible: !isHiddenHeader,
          headerRight: () =>
            !isHiddenHeader && user ? (
              <TouchableOpacity
                onPress={() => router.push("/settings/page")}
                style={{ marginRight: 12 }}
              >
                <Ionicons name="settings-outline" size={24} color="black" />
              </TouchableOpacity>
            ) : null,
        };
      }}
    >
      <Stack.Screen name="(tabs)/index" options={{ title: "Ana Sayfa" }} />
      <Stack.Screen name="chat/page" options={{ title: "Sohbet" }} />
      <Stack.Screen name="settings/page" options={{ title: "Ayarlar" }} />
      <Stack.Screen name="(auth)/login" options={{ title: "Giriş Yap" }} />
      <Stack.Screen name="(auth)/register" options={{ title: "Kayıt Ol" }} />
    </Stack>
  );
}
