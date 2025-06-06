import { login } from "@/authService";
import { db } from "@/firebaseConfig";
import { setUser } from "@/store/authSlice";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const userCredential = await login(email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("Kullanıcı bilgileri bulunamadı.");
      }

      const userData = userDocSnap.data();

      dispatch(
        setUser({
          uid: user.uid,
          email: user.email ?? "",
          displayName: user.displayName ?? "",
          firstName: userData.firstName ?? "",
          lastName: userData.lastName ?? "",
          username: userData.username ?? "",
          photoURL: userData.photoURL ?? "",
        })
      );

      router.replace("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        Alert.alert("Giriş Hatası", err.message);
      } else {
        Alert.alert("Giriş Hatası", "Bilinmeyen bir hata oluştu.");
      }
    }
  };

  return (
    <View
      style={{
        backgroundColor: "white",
        padding: 8,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TextInput
        placeholder="Email"
        onChangeText={setEmail}
        style={{ width: "85%", marginVertical: 10, color: "black", height: 35 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        style={{ width: "85%", marginVertical: 10, color: "black", height: 35 }}
      />
      <TouchableOpacity
        onPress={handleLogin}
        style={[styles.button, { backgroundColor: "black" }]}
      >
        <Text style={[styles.text, { color: "white" }]}>Login</Text>
      </TouchableOpacity>
      <Text onPress={() => router.push("/register")} style={{ color: "black" }}>
        Hesabın yok mu?
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
