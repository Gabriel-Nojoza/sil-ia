"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { listCompanies } from "@/lib/company-service";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useAdminSurface } from "@/hooks/use-admin-surface";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { createUuid } from "@/lib/uuid";
import type { CompanyRecord } from "@/types/company";
import type { AuthUser, UserRole } from "@/types/chat";

const ADMIN_LOGIN_STORAGE_KEY = "sil-admin-login-draft";

export function LoginScreen() {
  const { login } = useAuthContext();
  const router = useRouter();
  const { canAccessAdminSurface, isReady, isStandalone } = useAdminSurface();
  const autoFilledNameRef = useRef("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [userFound, setUserFound] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedAdminLogin = window.localStorage.getItem(ADMIN_LOGIN_STORAGE_KEY);

    if (!storedAdminLogin) {
      return;
    }

    try {
      const parsed = JSON.parse(storedAdminLogin) as {
        name?: string;
        email?: string;
      };

      if (parsed.name) {
        setName(parsed.name);
      }

      if (parsed.email) {
        setEmail(parsed.email);
      }

      if (parsed.name || parsed.email) {
        setRole("admin");
      }
    } catch {
      window.localStorage.removeItem(ADMIN_LOGIN_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    listCompanies().then((data) => {
      setCompanies(data);
      if (data.length > 0) setCompanyId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (role !== "admin") {
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName && !trimmedEmail) {
      return;
    }

    window.localStorage.setItem(
      ADMIN_LOGIN_STORAGE_KEY,
      JSON.stringify({
        name: trimmedName,
        email: trimmedEmail,
      }),
    );
  }, [email, name, role]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setIsLookingUp(false);
      setWebhookUrl("");
      setUserFound(false);
      setEmailChecked(false);
      autoFilledNameRef.current = "";
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .ilike("email", normalizedEmail)
          .maybeSingle();

        if (!active) {
          return;
        }

        if (error) {
          throw error;
        }

        if (data) {
          setUserFound(true);
          setDbUserId(String(data.id));
          setName(data.name ?? "");
          autoFilledNameRef.current = data.name ?? "";
          setWebhookUrl(data.webhook_url ?? "");
          if (data.company_id) {
            setCompanyId(data.company_id);
          }
          if (data.status === "admin" || data.status === "user") {
            setRole(data.status as UserRole);
          }
        } else {
          setUserFound(false);
          setDbUserId(null);
          setName("");
          setWebhookUrl("");
          autoFilledNameRef.current = "";
        }
        setEmailChecked(true);
      } catch {
        if (!active) return;
        setUserFound(false);
        setEmailChecked(true);
        setWebhookUrl("");
      } finally {
        if (active) setIsLookingUp(false);
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [email]);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === companyId),
    [companies, companyId],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isReady) return;
    if (!email.trim() || !userFound) return;
    if (!name.trim()) return;
    if (role !== "admin" && !selectedCompany) return;

    const nextUser: AuthUser = {
      userId: dbUserId ?? createUuid(),
      name: name.trim(),
      email: email.trim(),
      role,
      webhookUrl: webhookUrl || undefined,
      company: selectedCompany
        ? {
            companyId: selectedCompany.id,
            companyName: selectedCompany.name,
            workspaceId: selectedCompany.workspaceId,
            datasetId: selectedCompany.datasetId,
            webhookUrl: selectedCompany.webhookUrl,
          }
        : { companyId: "", companyName: "" },
    };

    login(nextUser);

    if (role === "admin" && canAccessAdminSurface) {
      router.replace("/admin/dashboard");
      return;
    }

    router.replace("/");
  }

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden flex">

      {/* ── LADO ESQUERDO: gráficos animados ── */}
      <div className="hidden lg:flex relative flex-1 flex-col justify-between overflow-hidden bg-[#0a0d14] p-12">
        {/* Grade de fundo */}
        <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-[length:40px_40px] opacity-20" />
        {/* Brilho central */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />

        {/* Logo + título */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sil-logo.png" alt="SIL" className="h-11 w-auto" />
            <span className="text-[11px] uppercase tracking-[0.32em] text-accent/80 font-medium">Inteligencia Analitica</span>
          </div>
          <h1 className="mt-8 text-4xl font-semibold leading-[1.2] text-foreground xl:text-5xl">
            Dados em tempo real,<br />
            <span className="text-accent">respostas em segundos.</span>
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted max-w-sm">
            Converse com a IA sobre os dados do seu Power BI em linguagem natural. Sem código, sem espera.
          </p>
        </div>

        {/* Gráficos animados */}
        <div className="relative z-10 space-y-4">
          {/* Card: barras verticais */}
          <div className="rounded-2xl border border-border/60 bg-white/[0.03] p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted uppercase tracking-widest">Vendas por Filial</span>
              <span className="text-xs text-accent font-medium">+12,4%</span>
            </div>
            <div className="flex items-end gap-2 h-24">
              {[
                { h: 55, color: "#6366f1", delay: "0s" },
                { h: 80, color: "#22d3ee", delay: "0.1s" },
                { h: 65, color: "#a78bfa", delay: "0.2s" },
                { h: 90, color: "#6366f1", delay: "0.3s" },
                { h: 45, color: "#34d399", delay: "0.4s" },
                { h: 75, color: "#22d3ee", delay: "0.5s" },
                { h: 60, color: "#a78bfa", delay: "0.6s" },
                { h: 95, color: "#6366f1", delay: "0.7s" },
              ].map((bar, i) => (
                <div key={i} className="flex-1 rounded-t-lg relative overflow-hidden" style={{ height: "100%" }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-lg"
                    style={{
                      height: `${bar.h}%`,
                      backgroundColor: bar.color,
                      opacity: 0.85,
                      animation: `growUp 1.2s cubic-bezier(.22,1,.36,1) ${bar.delay} both`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Card: barras horizontais + linha */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/60 bg-white/[0.03] p-4 backdrop-blur-sm">
              <span className="text-xs text-muted uppercase tracking-widest block mb-3">Meta %</span>
              <div className="space-y-2">
                {[
                  { label: "Norte", pct: 88, color: "#6366f1", delay: "0.1s" },
                  { label: "Sul", pct: 72, color: "#22d3ee", delay: "0.25s" },
                  { label: "Leste", pct: 95, color: "#34d399", delay: "0.4s" },
                  { label: "Oeste", pct: 61, color: "#a78bfa", delay: "0.55s" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted w-8 shrink-0">{b.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${b.pct}%`, backgroundColor: b.color, animation: `growBar 1s cubic-bezier(.22,1,.36,1) ${b.delay} both` }} />
                    </div>
                    <span className="text-[10px] text-muted w-6 shrink-0 text-right">{b.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-white/[0.03] p-4 backdrop-blur-sm">
              <span className="text-xs text-muted uppercase tracking-widest block mb-3">Tendência</span>
              <svg viewBox="0 0 120 60" className="w-full" fill="none">
                <defs>
                  <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0 50 L20 40 L40 30 L60 35 L80 15 L100 20 L120 8" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"
                  style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: "drawLine 1.8s ease 0.3s forwards" }} />
                <path d="M0 50 L20 40 L40 30 L60 35 L80 15 L100 20 L120 8 L120 60 L0 60Z" fill="url(#lg1)" />
                {[[0,50],[20,40],[40,30],[60,35],[80,15],[100,20],[120,8]].map(([x,y],i) => (
                  <circle key={i} cx={x} cy={y} r="2.5" fill="#6366f1"
                    style={{ animation: `dotPop 0.3s ${0.4 + i * 0.12}s both` }} />
                ))}
              </svg>
              <div className="mt-1 flex justify-between text-[10px] text-muted">
                <span>Jan</span><span>Abr</span><span>Jul</span>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes growUp { from { height: 0% } }
          @keyframes growBar { from { width: 0% } }
          @keyframes drawLine { to { stroke-dashoffset: 0 } }
          @keyframes dotPop {
            from { opacity: 0; r: 0 }
            to   { opacity: 1; r: 2.5px }
          }
        `}</style>
      </div>

      {/* ── LADO DIREITO: formulário ── */}
      <div className="relative flex w-full flex-col items-center justify-center lg:w-[440px] lg:shrink-0 bg-[#0a0d14] overflow-y-auto">

        {/* Fundo sutil mobile */}
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute inset-0 bg-hero-grid bg-[length:40px_40px] opacity-15" />
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 h-64 w-64 rounded-full bg-accent/10 blur-[80px]" />
        </div>

        <div className="relative z-10 w-full max-w-sm px-6 py-10 sm:px-8">

          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sil-logo.png" alt="SIL" className="h-8 w-auto" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-accent/80">Inteligencia Analitica</span>
          </div>

          <p className="text-[11px] uppercase tracking-[0.28em] text-accent/90 font-medium">Acesso</p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">Bem-vindo de volta</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Identifique-se para acessar o chat analítico.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm text-foreground">
              <span>Nome</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={isLookingUp ? "Buscando..." : "Ex.: Paulo Silva"}
                disabled={isLookingUp}
                className="rounded-2xl border border-border/80 bg-white/[0.04] px-4 py-3.5 outline-none transition placeholder:text-muted/50 focus:border-accent/60 focus:bg-white/[0.06] disabled:opacity-50"
              />
            </label>

            <label className="grid gap-2 text-sm text-foreground">
              <span>E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="paulo@empresa.com"
                className="rounded-2xl border border-border/80 bg-white/[0.04] px-4 py-3.5 outline-none transition placeholder:text-muted/50 focus:border-accent/60 focus:bg-white/[0.06]"
              />
            </label>

            {/* Buscando */}
            {isLookingUp && (
              <div className="rounded-2xl border border-border/60 bg-white/[0.03] px-4 py-3.5 text-sm text-muted animate-pulse">
                Verificando e-mail...
              </div>
            )}

            {/* E-mail não encontrado */}
            {!isLookingUp && emailChecked && !userFound && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm text-red-400">
                E-mail não cadastrado. Solicite acesso ao administrador.
              </div>
            )}

            {/* Empresa — só aparece se usuário encontrado */}
            {!isLookingUp && userFound && role !== "admin" && selectedCompany && (
              <div className="grid gap-2 text-sm text-foreground">
                <span>Empresa</span>
                <div className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                  <span className="font-medium text-foreground">{selectedCompany.name}</span>
                </div>
              </div>
            )}

            {role === "admin" && isReady && !canAccessAdminSurface ? (
              <div className="rounded-2xl border border-border/60 bg-white/[0.03] p-4 text-xs text-muted leading-6">
                <p className="font-medium text-foreground text-sm mb-1">Admin somente no computador</p>
                {isStandalone
                  ? "No app instalado, o acesso continua pelo chat. O painel admin fica disponivel apenas no navegador do computador."
                  : "Em celular ou tablet, o login continua pelo chat. O painel admin fica disponivel apenas no navegador do computador."}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLookingUp || (emailChecked && !userFound)}
              className="mt-2 rounded-2xl bg-accent px-5 py-4 text-sm font-semibold text-white transition hover:bg-accent/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Entrar no sistema
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
