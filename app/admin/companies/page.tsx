import { AuthGate } from "@/components/auth/AuthGate";
import { AdminCompanyScreen } from "@/components/admin/AdminCompanyScreen";

export default function AdminCompaniesPage() {
  return (
    <AuthGate requiredRole="admin">
      <AdminCompanyScreen />
    </AuthGate>
  );
}
