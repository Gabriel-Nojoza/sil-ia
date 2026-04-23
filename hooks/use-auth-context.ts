"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/auth/AuthProvider";
import type { AuthContextValue } from "@/types/chat";

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext precisa ser usado dentro de AuthProvider");
  }

  return context;
}
