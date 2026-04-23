"use client";

import Link from "next/link";
import { useAuthContext } from "@/hooks/use-auth-context";

interface AdminShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AdminShell({ title, description, children }: AdminShellProps) {
  const { user, logout } = useAuthContext();

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-[length:42px_42px] opacity-30" />

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col rounded-[28px] glass-panel shadow-soft">
        <header className="border-b border-border/80 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-accent/90">
                SIL Inteligencia Analitica
              </p>
              <div>
                <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-8 text-muted">
                  {description}
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-3 xl:max-w-[440px] xl:justify-end">
              <div className="rounded-2xl border border-border/80 bg-white/5 px-4 py-2 text-sm text-muted">
                {user?.name} · {user?.company.companyName}
              </div>
              <Link
                href="/"
                className="rounded-2xl border border-border/80 bg-white/5 px-4 py-2 text-sm text-foreground transition hover:border-accent/50 hover:bg-accent/10"
              >
                Ir para o chat
              </Link>
              <Link
                href="/admin/companies"
                className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Empresas
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-2xl border border-border/80 bg-white/5 px-4 py-2 text-sm text-foreground transition hover:border-accent/50 hover:bg-accent/10"
              >
                Sair
              </button>
            </nav>
          </div>
        </header>

        <section className="flex-1 px-4 py-6 sm:px-6">{children}</section>
      </div>
    </main>
  );
}
