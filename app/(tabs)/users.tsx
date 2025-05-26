import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

type UserItem = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
};

export default function UsersScreen() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const fetched = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as UserItem))
        .filter((u) => u.id !== user.uid);
      setUsers(fetched);
    };

    fetchUsers();
  }, [user]);

  const startConversation = async (
    currentUserId: string,
    selectedUserId: string
  ) => {
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUserId)
    );
    const snapshot = await getDocs(q);

    const existing = snapshot.docs.find((doc) => {
      const participants = doc.data().participants;
      return participants.includes(selectedUserId);
    });

    if (existing) {
      return existing.id;
    }

    const newConv = await addDoc(collection(db, "conversations"), {
      participants: [currentUserId, selectedUserId],
      createdAt: Date.now(),
    });

    return newConv.id;
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
        Kullanıcılar
      </Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={async () => {
              if (!user?.uid) return;
              const conversationId = await startConversation(user.uid, item.id);
              router.push({
                pathname: "/chat/page",
                params: {
                  conversationId,
                  userId: item.id,
                },
              });
            }}
            style={{
              padding: 12,
              borderBottomWidth: 1,
              borderColor: "#ccc",
            }}
          >
            <Text>{item.firstName + " " + item.lastName}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
