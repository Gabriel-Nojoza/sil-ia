import { AuthGate } from "@/components/auth/AuthGate";
import { AdminUsersScreen } from "@/components/admin/AdminUsersScreen";

export default function AdminUsersPage() {
  return (
    <AuthGate requiredRole="admin">
      <AdminUsersScreen />
    </AuthGate>
  );
}
