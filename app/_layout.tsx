import RootLayout from "@/components/RootLayout";
import { AuthProvider } from "@/context/AuthContext";
import { store } from "@/store/store";
import { Provider } from "react-redux";

export default function LayoutWrapper() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <RootLayout />
      </AuthProvider>
    </Provider>
  );
}
