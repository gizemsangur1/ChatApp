import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { formatTimestamp } from "@/hooks/generalFunctions";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import {
	addDoc,
	collection,
	doc,
	getDoc,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
	Alert,
	FlatList,
	Image,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

type Message = {
  id: string;
  text?: string;
  senderId: string;
  createdAt: any;
  imageUrl?: string[];
};

type OtherUser = {
  firstName?: string;
  lastName?: string;
  username?: string;
};

export default function ChatScreen() {
  const { conversationId, userId } = useLocalSearchParams();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!conversationId) return;

    const q = query(
      collection(db, "conversations", String(conversationId), "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
    });

    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    if (!userId) return;

    const fetchOtherUser = async () => {
      const ref = doc(db, "users", String(userId));
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        setOtherUser(snapshot.data() as OtherUser);
      }
    };

    fetchOtherUser();
  }, [userId]);

  const sendMessage = async () => {
    if (!user?.uid) return;

    const trimmedText = input.trim();
    const hasText = trimmedText.length > 0;
    const hasImages = images.length > 0;

    if (!hasText && !hasImages) return;

    const messagePayload: Message = {
      senderId: user.uid,
      id: user.uid,
      createdAt: serverTimestamp(),
    };

    if (hasText) {
      messagePayload.text = trimmedText;
    }

    if (hasImages) {
      messagePayload.imageUrl = images;
    }

    await addDoc(
      collection(db, "conversations", String(conversationId), "messages"),
      messagePayload
    );

    setInput("");
    setImages([]);
  };

  const handleImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Sorry, we need camera roll permission to upload images."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const selectedUris = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...selectedUris]);
    }
  };

  const cancelImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      {otherUser && (
        <Text style={styles.header}>
          {otherUser.firstName} {otherUser.lastName} ({otherUser.username})
        </Text>
      )}

      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.senderId === user?.uid
                ? styles.myMessage
                : styles.theirMessage,
            ]}
          >
            {item.text ? (
              <Text style={{ color: "#fff" }}>{item.text}</Text>
            ) : null}

            {item.imageUrl && Array.isArray(item.imageUrl) && (
              <View style={styles.messageImageContainer}>
                {item.imageUrl.map((uri: string, idx: number) => (
                  <Image
                    key={idx}
                    source={{ uri }}
                    style={styles.messageImage}
                  />
                ))}
              </View>
            )}
            {item.createdAt && (
              <Text style={styles.timestamp}>
                {formatTimestamp(item.createdAt)}
              </Text>
            )}
          </View>
        )}
        keyExtractor={(item) => item.id}
      />

      <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end" }}>
        {images.map((uri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => cancelImage(index)}
            >
              <Ionicons name="close-circle" size={18} color="red" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.textContainer}>
          <TouchableOpacity style={{ marginLeft: 10 }} onPress={handleImage}>
            <Ionicons name="image-outline" size={24} color="black" />
          </TouchableOpacity>

          <TextInput
            placeholder="Mesaj..."
            value={input}
            onChangeText={setInput}
            style={styles.textInput}
          />
        </View>

        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={{ color: "white" }}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: "75%",
  },
  myMessage: {
    backgroundColor: "#4e4cb8",
    alignSelf: "flex-end",
  },
  theirMessage: {
    backgroundColor: "#888",
    alignSelf: "flex-start",
  },
  inputContainer: {
    flexDirection: "row",
    marginTop: "auto",
    paddingVertical: 8,
  },
  textContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    marginRight: 8,
    color: "black",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  textInput: {
    width: "80%",
    height: "100%",
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  sendButton: {
    backgroundColor: "black",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginLeft: 6,
  },
  previewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 4,
  },

  imageWrapper: {
    position: "relative",
    marginRight: 6,
    marginBottom: 6,
  },

  closeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    zIndex: 1,
    backgroundColor: "#fff",
    borderRadius: 9,
  },
  messageImageContainer: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },

  messageImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 6,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    color: "#ddd",
    marginTop: 4,
    alignSelf: "flex-end",
  },
});
