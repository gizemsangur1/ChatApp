import { useRouter } from "expo-router";
import { useState } from "react";
import {
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { register } from "../../utils/authService";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await register(email, password);
      Alert.alert("Başarılı", "Kayıt tamamlandı, şimdi giriş yapabilirsin.");
      router.replace("/login");
    } catch (err: unknown) {
      if (err instanceof Error) {
        Alert.alert("Kayıt Hatası", err.message);
      } else {
        Alert.alert("Kayıt Hatası", "Bilinmeyen bir hata oluştu.");
      }
    }
  };

  return (
    <View
      style={{
        backgroundColor:"white",
        padding: 8,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TextInput
        placeholder="Email"
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ width: "85%", marginVertical: 10,color:"black",height:35 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        style={{ width: "85%", marginVertical: 10,color:"black" ,height:35}}
      />
      <TouchableOpacity
        onPress={handleRegister}
        style={[styles.button, { backgroundColor:"black" }]}
      >
        <Text style={[styles.text, { color: "white"}]}>
        Kayıt
        </Text>
      </TouchableOpacity>
      <Text onPress={() => router.push("/login")} style={{ color: "black" }}>
       Hesabın Var
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#9B7EBD",
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginVertical: 8,
    alignItems: "center",
    width: "85%",
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
