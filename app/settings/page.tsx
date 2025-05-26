import { logout } from "@/authService";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { Redirect, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import { Button, Image, StyleSheet, Text, View } from "react-native";

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
    router.replace("/(auth)/login"); 
  } catch (error) {
    console.error("Çıkış hatası:", error);
  }
};

  if (!user) return <Redirect href="/login" />;

  return (
	<View style={styles.container}>
	  <Image
		source={{ uri: userInfo?.photoURL || "https://via.placeholder.com/150" }}
		style={styles.avatar}
	  />
	  <Button title="Fotoğraf Yükle" onPress={pickImage} disabled={loading} />

	  <Text style={styles.text}>Ad: {userInfo?.firstName}</Text>
	  <Text style={styles.text}>Soyad: {userInfo?.lastName}</Text>
	  <Text style={styles.text}>Kullanıcı Adı: {userInfo?.username}</Text>
	  <Text style={styles.text}>E-Posta: {userInfo?.email}</Text>
	  <button onClick={handleLogout}>Çıkış yap</button>
	</View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  avatar: {
	width: 120,
	height: 120,
	borderRadius: 60,
	alignSelf: "center",
	marginBottom: 16,
  },
  text: {
	fontSize: 16,
	marginVertical: 4,
  },
});
