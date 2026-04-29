"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useAdminSurface } from "@/hooks/use-admin-surface";

export function HomeRedirect() {
  const router = useRouter();
  const { user, isHydrated } = useAuthContext();
  const { isReady, canAccessAdminSurface } = useAdminSurface();

  useEffect(() => {
    if (!isHydrated || !user || !isReady) {
      return;
    }

    if (user.role === "admin" && canAccessAdminSurface) {
      router.replace("/admin/dashboard");
    }
  }, [canAccessAdminSurface, isHydrated, isReady, router, user]);

  return null;
}
