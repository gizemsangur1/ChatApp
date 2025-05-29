import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { formatTimestamp } from "@/hooks/generalFunctions";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
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

type Conversation = {
  id: string;
  participants: string[];
  otherUser: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  lastMessageText?: string;
  lastMessageTime?: Date | null;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filteredConversations = conversations.filter((item) => {
    const fullName = `${item.otherUser?.firstName || ""} ${
      item.otherUser?.lastName || ""
    }`.toLowerCase();
    const username = item.otherUser?.username?.toLowerCase() || "";
    const search = searchText.toLowerCase();

    return fullName.includes(search) || username.includes(search);
  });

  if (!user) return <Redirect href="/login" />;

  useEffect(() => {
    const fetchConversations = async () => {
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.uid)
      );

      const snapshot = await getDocs(q);
      const fetched: Conversation[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const otherUserId = data.participants.find(
          (uid: string) => uid !== user.uid
        );
        if (!otherUserId) continue;

        const userDoc = await getDoc(doc(db, "users", otherUserId));
        const otherUser = userDoc.exists()
          ? { id: userDoc.id, ...userDoc.data() }
          : { id: otherUserId };

        const messagesRef = collection(
          db,
          "conversations",
          docSnap.id,
          "messages"
        );
        const lastMsgQuery = query(
          messagesRef,
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const lastMsgSnapshot = await getDocs(lastMsgQuery);

        let lastMessageText = "";
        let lastMessageTime = null;

        if (!lastMsgSnapshot.empty) {
          const lastMessage = lastMsgSnapshot.docs[0].data();
          lastMessageText =
            lastMessage.text || (lastMessage.imageUrl ? "📷 Resim" : "");
          lastMessageTime =
            lastMessage.createdAt instanceof Timestamp
              ? lastMessage.createdAt.toDate()
              : null;
        }

        fetched.push({
          id: docSnap.id,
          participants: data.participants,
          otherUser,
          lastMessageText,
          lastMessageTime,
        });
      }

      setConversations(fetched);
    };

    fetchConversations();
  }, [user]);

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "white" }}>
      <Text style={styles.header}>Sohbetlerim</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          paddingHorizontal: 8,
          marginBottom: 16,
        }}
      >
        <TextInput
          placeholder="Kullanıcı ara..."
          value={searchText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChangeText={setSearchText}
          style={{ flex: 1, paddingVertical: 8,  borderColor: isFocused ? "#000" : "#ccc",borderWidth: 0 }}
        />
        <Ionicons name="search-outline" size={24} color="black" />
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              router.push({
                pathname: "/chat/page",
                params: {
                  conversationId: item.id,
                  userId: item.otherUser?.id,
                },
              })
            }
          >
            <View>
              <Text style={styles.nameText}>
                {item.otherUser?.firstName} {item.otherUser?.lastName}
              </Text>
              <Text style={styles.usernameText}>
                @{item.otherUser?.username}
              </Text>
            </View>

            {item?.lastMessageText && item?.lastMessageTime ? (
              <View>
                <Text style={styles.lastMessageText} numberOfLines={1}>
                  {item.lastMessageText}
                </Text>
                <Text style={styles.lastMessageText} numberOfLines={1}>
                  {formatTimestamp(item.lastMessageTime)}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  item: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "500",
  },
  usernameText: {
    fontSize: 14,
    color: "gray",
  },
  lastMessageText: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
});
