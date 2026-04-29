"use client";

import Link from "next/link";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useAdminSurface } from "@/hooks/use-admin-surface";
import type { UserRole } from "@/types/chat";

interface AuthGateProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function AuthGate({ children, requiredRole }: AuthGateProps) {
  const { user, isAuthenticated, isHydrated } = useAuthContext();
  const { isReady, canAccessAdminSurface, isStandalone } = useAdminSurface();

  if (!isHydrated || (requiredRole === "admin" && !isReady)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="rounded-3xl border border-border/80 bg-card/80 px-6 py-4 text-sm text-muted">
          Carregando sessao...
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-border/80 bg-white/[0.03] p-8 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
              Acesso restrito
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-foreground">
              Esta area e exclusiva para administradores
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted">
              O usuario autenticado agora pertence ao perfil `{user.role}`.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Voltar para o chat
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (requiredRole === "admin" && !canAccessAdminSurface) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-border/80 bg-white/[0.03] p-8 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
              Admin no computador
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-foreground">
              O painel admin fica disponivel apenas no navegador do computador
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted">
              {isStandalone
                ? "No app instalado, somente o chat fica disponivel para uso."
                : "Em celular ou tablet, somente o chat fica disponivel."}
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Ir para o chat
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
