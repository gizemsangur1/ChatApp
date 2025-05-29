import { logout } from "@/authService";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { logout as reduxLogout } from "@/store/authSlice";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Redirect, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import {
	Alert,
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useDispatch } from "react-redux";

type UserInfo = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
};

export default function SettingsScreen() {
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user?.uid) return;

    const fetchUser = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserInfo(docSnap.data());
      }
    };

    fetchUser();
  }, [user]);

  const pickImage = async () => {
    if (!user) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return;

    try {
      setLoading(true);

      const imageUri = result.assets[0].uri;
      const imageBlob = await fetch(imageUri).then((res) => res.blob());

      const storage = getStorage();
      const storageRef = ref(storage, `profilePictures/${user?.uid}.jpg`);

      await uploadBytes(storageRef, imageBlob);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", user?.uid), {
        photoURL: downloadURL,
      });

      setUserInfo((prev: UserInfo | null) => ({
        ...(prev || {}),
        photoURL: downloadURL,
      }));
    } catch (error) {
      console.error("Profil fotoğrafı yükleme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(reduxLogout());
      router.replace("/login");
    } catch (err) {
      Alert.alert("Çıkış Hatası", "Çıkış sırasında bir hata oluştu.");
    }
  };

  if (!user) return <Redirect href="/login" />;
  console.log(userInfo?.photoURL);

  return (
    <View style={styles.container}>
      <View
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {userInfo?.photoURL ? (
          <Image source={{ uri: userInfo.photoURL }} style={styles.avatar} />
        ) : (
          <Ionicons
            name="person-outline"
            size={40}
            color="gray"
            style={styles.avatar}
          />
        )}
      </View>
      <View
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={pickImage}
          disabled={loading}
          style={styles.buttonStyle}
        >
          <Text style={{ textAlign: "center" }}>Fotoğraf Yükle</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.text}>Ad: {userInfo?.firstName}</Text>
      <Text style={styles.text}>Soyad: {userInfo?.lastName}</Text>
      <Text style={styles.text}>Kullanıcı Adı: {userInfo?.username}</Text>
      <Text style={styles.text}>E-Posta: {userInfo?.email}</Text>
      <View
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        <TouchableOpacity onPress={handleLogout} style={styles.buttonLogout}>
          <Text style={{ textAlign: "center", color: "red" }}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "white",
    flex: 1,
  },
  avatar: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
  },
  text: {
    fontSize: 16,
    marginVertical: 4,
  },
  buttonStyle: {
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 60,
    tintColor: "black",
    padding: 15,
    width: "35%",
  },
  buttonLogout: {
    borderColor: "red",
    borderWidth: 1,
    borderRadius: 60,
    tintColor: "red",
    padding: 15,
    width: "35%",
  },
});
