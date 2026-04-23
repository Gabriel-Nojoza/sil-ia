import { AuthGate } from "@/components/auth/AuthGate";
import { HomeRedirect } from "@/components/auth/HomeRedirect";
import { ChatScreen } from "@/components/chat/ChatScreen";

export default function HomePage() {
  return (
    <AuthGate>
      <HomeRedirect />
      <ChatScreen />
    </AuthGate>
  );
}
