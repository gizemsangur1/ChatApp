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
import { register } from "../../authService";

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");

  const handleRegister = async () => {
    if (!firstName || !lastName || !username) {
      Alert.alert("Eksik Bilgi", "Lütfen tüm alanları doldurun.");
      return;
    }

    try {
      await register(email, password, firstName, lastName, username);
      Alert.alert("Başarılı", "Kayıt tamamlandı, şimdi giriş yapabilirsin.");
      router.replace("/login");
    } catch (err: unknown) {
      console.log("REGISTER ERROR", err);
      if (err instanceof Error) {
        Alert.alert("Kayıt Hatası", err.message);
      } else {
        Alert.alert("Kayıt Hatası", "Bilinmeyen bir hata oluştu.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="İsim" onChangeText={setFirstName} style={styles.input} />
      <TextInput placeholder="Soyisim" onChangeText={setLastName} style={styles.input} />
      <TextInput placeholder="Kullanıcı Adı" onChangeText={setUsername} autoCapitalize="none" style={styles.input} />
      <TextInput placeholder="Email" onChangeText={setEmail} autoCapitalize="none" style={styles.input} />
      <TextInput placeholder="Şifre" secureTextEntry onChangeText={setPassword} style={styles.input} />

      <TouchableOpacity onPress={handleRegister} style={styles.button}>
        <Text style={styles.buttonText}>Kayıt</Text>
      </TouchableOpacity>

      <Text onPress={() => router.push("/login")} style={{ color: "black" }}>
        Zaten bir hesabın var mı?
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 8,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    width: "85%",
    marginVertical: 10,
    color: "black",
    height: 35,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  button: {
    backgroundColor: "black",
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginVertical: 8,
    alignItems: "center",
    width: "85%",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
