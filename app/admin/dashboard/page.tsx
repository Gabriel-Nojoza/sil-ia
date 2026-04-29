import { AuthGate } from "@/components/auth/AuthGate";
import { AdminDashboardScreen } from "@/components/admin/AdminDashboardScreen";

export default function AdminDashboardPage() {
  return (
    <AuthGate requiredRole="admin">
      <AdminDashboardScreen />
    </AuthGate>
  );
}
