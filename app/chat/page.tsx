import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { formatTimestamp } from "@/hooks/generalFunctions";

import CustomAudioPlayer from "@/components/CustomPlayer";
import {
  clearVoice,
  removeImage,
  setActiveConversation,
  setImages,
  setMessages,
  setOtherUser,
  setVoice,
} from "@/store/chatSlice";
import { RootState } from "@/store/store";
import { Audio } from "expo-av";
import { useDispatch, useSelector } from "react-redux";

export default function ChatScreen() {
  const { conversationId, userId } = useLocalSearchParams();
  const { user } = useAuth();
  const dispatch = useDispatch();

  const messages = useSelector((state: RootState) => state.chat.messages);
  const otherUser = useSelector((state: RootState) => state.chat.otherUser);
  const images = useSelector((state: RootState) => state.chat.images);

  const [input, setInput] = useState("");
  const [imageOpen, setImageOpen] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!conversationId) return;

    dispatch(setActiveConversation(String(conversationId)));

    const q = query(
      collection(db, "conversations", String(conversationId), "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any;

      dispatch(setMessages(msgs));
    });

    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    if (!userId) return;

    const fetchOtherUser = async () => {
      const ref = doc(db, "users", String(userId));
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        dispatch(setOtherUser(snapshot.data()));
      }
    };

    fetchOtherUser();
  }, [userId]);

  useEffect(() => {
    if (!conversationId || !user?.uid) return;

    const q = query(
      collection(db, "conversations", String(conversationId), "messages"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const batch = snapshot.docs.slice(0, 10);

      for (const docSnap of batch) {
        const data = docSnap.data();
        const seenBy: string[] = data.seenBy ?? [];

        if (data.senderId !== user.uid && !seenBy.includes(user.uid)) {
          const messageRef = doc(
            db,
            "conversations",
            String(conversationId),
            "messages",
            docSnap.id
          );
          await updateDoc(messageRef, {
            seenBy: [...seenBy, user.uid],
          });
        }
      }
    });

    return unsubscribe;
  }, [conversationId, user?.uid]);

  const voiceUri = useSelector((state: RootState) => state.chat.voices);

  const sendMessage = async () => {
    if (!user?.uid) return;

    const trimmedText = input.trim();
    const hasText = trimmedText.length > 0;
    const hasImages = images.length > 0;
    const hasVoice = !!voiceUri;

    if (!hasText && !hasImages && !hasVoice) return;

    const messagePayload: any = {
      senderId: user.uid,
      id: user.uid,
      createdAt: serverTimestamp(),
      seenBy: [user.uid],
    };

    if (hasText) messagePayload.text = trimmedText;
    if (hasImages) messagePayload.imageUrl = images;
    if (hasVoice) messagePayload.voiceUrl = voiceUri;

    await addDoc(
      collection(db, "conversations", String(conversationId), "messages"),
      messagePayload
    );

    setInput("");
    dispatch(setImages([]));
    dispatch(clearVoice());

    if (Platform.OS !== "web" && recording) {
      try {
        await recording.stopAndUnloadAsync();
        setRecording(null);
        setIsRecording(false);
      } catch (err) {
        console.warn("Kayıt durdurulurken hata:", err);
      }
    }

    if (Platform.OS === "web" && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
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
      dispatch(setImages([...images, ...selectedUris]));
    }
  };

  const cancelImage = (indexToRemove: number) => {
    dispatch(removeImage(indexToRemove));
  };

  const handleImageOpen = (uri: string) => {
    setImageOpen(uri);
  };

  const handleVoiceNote = async () => {
    try {
      if (isRecording) {
        setIsRecording(false);

        if (Platform.OS === "web") {
          mediaRecorderRef.current?.stop();
        } else {
          await recording?.stopAndUnloadAsync();
          const uri = recording?.getURI();
          if (uri) dispatch(setVoice(uri));
        }

        setRecording(null);
        return;
      }

      if (Platform.OS === "web") {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });

        mediaRecorderRef.current = mediaRecorder;
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          dispatch(setVoice(url));
        };

        mediaRecorder.start();
      } else {
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
          Alert.alert("İzin Gerekli", "Ses kaydı için izin gerekli.");
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const newRecording = new Audio.Recording();
        await newRecording.prepareToRecordAsync({
          android: {
            extension: ".m4a",
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: ".caf",
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {},
        });

        await newRecording.startAsync();
        setRecording(newRecording);
      }

      setIsRecording(true);
    } catch (error) {
      console.error("Ses kaydı hatası:", error);
    }
  };

  const deleteMessage = async () => {
    if (!conversationId || !selectedMessageId) return;

    await deleteDoc(
      doc(
        db,
        "conversations",
        String(conversationId),
        "messages",
        selectedMessageId
      )
    );

    setContextMenuVisible(false);
    setSelectedMessageId(null);
  };

  return (
    <View style={{ flex: 1, padding: 10 ,backgroundColor:"white"}}>
      {otherUser && (
        <Text style={styles.header}>
          {otherUser.firstName} {otherUser.lastName} ({otherUser.username})
        </Text>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        renderItem={({ item }) => {
          const isMyMessage = item.senderId === user?.uid;

          const commonContent = (
            <>
              {item.text && <Text style={{ color: "#fff" }}>{item.text}</Text>}

              {item.imageUrl && Array.isArray(item.imageUrl) && (
                <View style={styles.messageImageContainer}>
                  {item.imageUrl.map((uri: string, idx: number) => (
                    <TouchableOpacity onPress={() => handleImageOpen(uri)}>
                      <Image
                        key={idx}
                        source={{ uri }}
                        style={styles.messageImage}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {item.createdAt && (
                <Text style={styles.timestamp}>
                  {formatTimestamp(item.createdAt)}
                </Text>
              )}

              {isMyMessage && item.seenBy?.length > 1 && (
                <Text style={styles.seenLabel}>Görüldü</Text>
              )}

              {item.voiceUrl && (
                <View style={{ marginTop: 8 }}>
                  <CustomAudioPlayer src={item.voiceUrl!} />
                </View>
              )}
            </>
          );

          if (Platform.OS === "web") {
            return (
              <div
                onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  setSelectedMessageId(item.id);
                  setMenuPosition({ x: e.pageX, y: e.pageY });
                  setContextMenuVisible(true);
                }}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  margin: 4,
                  maxWidth: "75%",
                  backgroundColor: isMyMessage ? "#4e4cb8" : "#888",
                  alignSelf: isMyMessage ? "flex-end" : "flex-start",
                  color: "#fff",
                }}
              >
                {commonContent}
              </div>
            );
          }

          return (
            <TouchableOpacity
              onLongPress={() => {
                setSelectedMessageId(item.id);
                setContextMenuVisible(true);

                setMenuPosition({ x: 100, y: 500 });
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.messageBubble,
                  isMyMessage ? styles.myMessage : styles.theirMessage,
                ]}
              >
                {commonContent}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {images.map((uri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <TouchableOpacity onPress={() => handleImageOpen(uri)}>
              <Image source={{ uri }} style={styles.previewImage} />
            </TouchableOpacity>

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
          <TouchableOpacity
            style={{ marginLeft: 10 }}
            onPress={handleVoiceNote}
          >
            <Ionicons name="mic-outline" size={24} color="black" />
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
      {imageOpen && (
        <View style={styles.fullscreenOverlay}>
          <View style={styles.overlayBackground} />
          <TouchableOpacity
            style={styles.fullscreenImageWrapper}
            activeOpacity={1}
            onPress={() => setImageOpen(null)}
          >
            <Image
              source={{ uri: imageOpen }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          {contextMenuVisible && (
            <View
              style={{
                position: "absolute",
                top: menuPosition.y,
                left: menuPosition.x,
                backgroundColor: "#fff",
                borderRadius: 6,
                padding: 10,
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowOffset: { width: 0, height: 2 },
                elevation: 5,
                zIndex: 9999,
              }}
            >
              <TouchableOpacity onPress={deleteMessage}>
                <Text style={{ color: "red", fontWeight: "bold" }}>Sil</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setContextMenuVisible(false)}
                style={{ marginTop: 6 }}
              >
                <Text style={{ color: "gray" }}>İptal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
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
  seenLabel: {
    fontSize: 10,
    color: "lightgreen",
    marginTop: 2,
    alignSelf: "flex-end",
  },
  fullscreenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },

  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 1,
  },

  fullscreenImageWrapper: {
    zIndex: 2,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  fullscreenImage: {
    width: "90%",
    height: "70%",
    borderRadius: 12,
  },
});
