"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useAdminSurface } from "@/hooks/use-admin-surface";

interface ChatHeaderProps {
  userName: string;
  userEmail: string;
  companyName: string;
  companyId: string;
  sessionId: string;
  onHistoryClick: () => void;
  onMobileHistoryOpen?: () => void;
}

export function ChatHeader({
  userName,
  companyName,
  onMobileHistoryOpen,
}: ChatHeaderProps) {
  const { user, logout } = useAuthContext();
  const { canAccessAdminSurface } = useAdminSurface();

  return (
    <header className="border-b border-border/80 px-3 py-2 sm:px-6">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {onMobileHistoryOpen ? (
            <button
              type="button"
              onClick={onMobileHistoryOpen}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-white/5 text-muted transition hover:text-foreground lg:hidden"
              aria-label="Histórico"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          ) : null}
          <Image
            src="/sil-logo.png"
            alt="Logo SIL"
            width={160}
            height={160}
            className="rounded-xl object-contain"
            priority
          />
          <div className="hidden sm:block">
            <p className="text-[20px] font-medium uppercase tracking-[0.24em] text-accent/90">
              SIL Inteligência Analítica
            </p>
            <h1 className="text-sm font-semibold text-foreground">
              Chat de IA para análise de dados
            </h1>
          </div>
          <p className="text-sm font-medium uppercase tracking-widest text-accent/90 sm:hidden">
            SIL
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-foreground">{userName}</p>
              <p className="text-xs text-muted">{companyName}</p>
            </div>
          </div>
          {user?.role === "admin" && canAccessAdminSurface ? (
            <Link
              href="/admin/dashboard"
              className="hidden rounded-xl border border-border/80 bg-white/5 px-3 py-1.5 text-sm text-foreground transition hover:border-accent/50 hover:bg-accent/10 sm:inline-flex"
            >
              Admin
            </Link>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-accent/90 sm:px-4"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
