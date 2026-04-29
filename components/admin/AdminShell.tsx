"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  PanelLeftDashed,
  ShieldCheck,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { useAuthContext } from "@/hooks/use-auth-context";

interface AdminShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const navItems = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/companies",
    label: "Empresas",
    icon: Building2,
  },
  {
    href: "/admin/users",
    label: "Usuarios",
    icon: Users,
  },
];

export function AdminShell({ title, description, children }: AdminShellProps) {
  const { user, logout } = useAuthContext();
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#05080d] text-foreground">
      <div className="min-h-screen border-border/80 bg-[#080c13] lg:grid lg:grid-cols-[254px_minmax(0,1fr)]">
        <aside className="border-b border-border/80 bg-[#060a12] lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <div className="border-b border-border/80 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">
                    SIL Inteligencia
                  </p>
                  <p className="truncate text-sm text-muted">
                    Painel Administrativo
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-5">
              <p className="text-sm font-medium text-slate-300">Administracao</p>

              <nav className="mt-4 grid gap-1.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        isActive
                          ? "flex items-center gap-3 rounded-xl border border-border/80 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-foreground"
                          : "flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted transition hover:bg-white/[0.03] hover:text-foreground"
                      }
                    >
                      <span
                        className={
                          isActive
                            ? "flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent"
                            : "flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03] text-muted"
                        }
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto border-t border-border/80 p-4">
              <div className="rounded-2xl border border-border/80 bg-[#0b1018] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                    {(user?.name?.slice(0, 2) || "AD").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user?.name || "Admin"}
                    </p>
                    <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#0d1623] px-2.5 py-1 text-[11px] text-muted">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                      {user?.company.companyName || "Painel"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-xl border border-border/80 bg-white/[0.02] px-4 py-3 text-sm text-foreground transition hover:border-accent/40 hover:bg-accent/10"
                >
                  <MessageSquareText className="h-4 w-4 text-accent" />
                  <span>Ir para o chat</span>
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-3 rounded-xl border border-border/80 bg-white/[0.02] px-4 py-3 text-left text-sm text-foreground transition hover:border-accent/40 hover:bg-accent/10"
                >
                  <LogOut className="h-4 w-4 text-accent" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 bg-[#080c13]">
          <header className="border-b border-border/80 px-5 py-4 sm:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="hidden h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-[#0c1118] text-slate-300 sm:flex">
                  <PanelLeftDashed className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-[2rem]">
                    {title}
                  </h1>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    {description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/admin/dashboard"
                  className="rounded-xl border border-border/80 bg-white/[0.02] px-4 py-2 text-sm text-foreground transition hover:border-accent/40 hover:bg-accent/10"
                >
                  Relatorios
                </Link>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
                >
                  <UserRoundPlus className="h-4 w-4" />
                  Novo Usuario
                </Link>
              </div>
            </div>
          </header>

          <section className="px-5 py-5 sm:px-7">{children}</section>
        </div>
      </div>
    </main>
  );
}
