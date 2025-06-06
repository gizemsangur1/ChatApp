import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type User = {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoURL?: string;
};

type AuthState = {
  user: User | null;
};

const initialState: AuthState = {
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    logout(state) {
      state.user = null;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
