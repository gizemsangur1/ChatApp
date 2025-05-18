import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/utils/firebaseConfig";
import { useAuth } from "@/context/AuthContext";

type UserItem = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

export default function UsersScreen({ navigation }: any) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const { user } = useAuth();

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
            onPress={() => navigation.navigate("chat", { user: item })}
            style={{
              padding: 12,
              borderBottomWidth: 1,
              borderColor: "#ccc",
            }}
          >
            <Text>{item?.firstName+" "+ item?.lastName}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
