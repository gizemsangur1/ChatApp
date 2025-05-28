import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Message = {
  id: string;
  text?: string;
  senderId: string;
  createdAt: any;
  imageUrl?: string[];
  voiceUrl?: string;
  seenBy: [];
};

type OtherUser = {
  firstName?: string;
  lastName?: string;
  username?: string;
};

interface ChatState {
  messages: Message[];
  otherUser: OtherUser | null;
  images: string[];
  voices: string;
  activeConversationId: string | null;
}

const initialState: ChatState = {
  messages: [],
  otherUser: null,
  images: [],
  voices: "",
  activeConversationId: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setMessages(state, action: PayloadAction<Message[]>) {
      state.messages = action.payload;
    },
    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload);
    },
    setOtherUser(state, action: PayloadAction<OtherUser>) {
      state.otherUser = action.payload;
    },
    setImages(state, action: PayloadAction<string[]>) {
      state.images = action.payload;
    },

    removeImage(state, action: PayloadAction<number>) {
      state.images.splice(action.payload, 1);
    },
    setVoice(state, action: PayloadAction<string>) {
      state.voices = action.payload;
    },
    clearVoice(state) {
      state.voices = "";
    },
    setActiveConversation(state, action: PayloadAction<string>) {
      state.activeConversationId = action.payload;
    },
    resetChat(state) {
      state.messages = [];
      state.images = [];
      state.otherUser = null;
      state.activeConversationId = null;
    },
  },
});

export const {
  setMessages,
  addMessage,
  setOtherUser,
  setImages,
  removeImage,
  setVoice,
  clearVoice,
  setActiveConversation,
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;
