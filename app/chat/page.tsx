import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
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
	FlatList,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

type Message = {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
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
	if (!input.trim() || !user?.uid) return;

	await addDoc(collection(db, "conversations", String(conversationId), "messages"), {
	  text: input,
	  senderId: user.uid,
	  createdAt: serverTimestamp(),
	});

	setInput("");
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
			<Text style={{ color: "#fff" }}>{item.text}</Text>
		  </View>
		)}
		keyExtractor={(item) => item.id}
	  />

	  <View style={styles.inputContainer}>
		<TextInput
		  placeholder="Mesaj..."
		  value={input}
		  onChangeText={setInput}
		  style={styles.textInput}
		/>
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
  textInput: {
	flex: 1,
	borderWidth: 1,
	borderColor: "#ccc",
	borderRadius: 20,
	paddingHorizontal: 12,
	marginRight: 8,
	color: "black",
  },
  sendButton: {
	backgroundColor: "black",
	borderRadius: 20,
	paddingVertical: 10,
	paddingHorizontal: 16,
	justifyContent: "center",
	alignItems: "center",
  },
});
