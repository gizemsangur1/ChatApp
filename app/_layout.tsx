import RootLayout from "@/components/RootLayout";
import { AuthProvider } from "@/context/AuthContext";

export default function LayoutWrapper() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}
