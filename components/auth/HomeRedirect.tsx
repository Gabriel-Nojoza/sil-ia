"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/use-auth-context";

export function HomeRedirect() {
  const router = useRouter();
  const { user, isHydrated } = useAuthContext();

  useEffect(() => {
    if (!isHydrated || !user) {
      return;
    }

    if (user.role === "admin") {
      router.replace("/admin/companies");
    }
  }, [isHydrated, router, user]);

  return null;
}
