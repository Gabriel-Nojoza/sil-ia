"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listCompanies } from "@/lib/company-service";
import { useAuthContext } from "@/hooks/use-auth-context";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { CompanyRecord } from "@/types/company";
import type { AuthUser, UserRole } from "@/types/chat";

export function LoginScreen() {
  const { login } = useAuthContext();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [role, setRole] = useState<UserRole>("user");

  useEffect(() => {
    listCompanies().then((data) => {
      setCompanies(data);
      if (data.length > 0) setCompanyId(data[0].id);
    });
  }, []);

  async function handleEmailBlur() {
    if (!email.trim() || !isSupabaseConfigured()) return;
    setIsLookingUp(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("users")
        .select("name, company_id")
        .eq("email", email.trim())
        .maybeSingle();
      if (data?.name && !name.trim()) {
        setName(data.name);
      }
      if (data?.company_id) {
        setCompanyId(data.company_id);
      }
    } finally {
      setIsLookingUp(false);
    }
  }

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === companyId),
    [companies, companyId],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !selectedCompany) {
      return;
    }

    const nextUser: AuthUser = {
      userId: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      role,
      company: {
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        workspaceId: selectedCompany.workspaceId,
        datasetId: selectedCompany.datasetId,
      },
    };

    login(nextUser);

    if (role === "admin") {
      router.replace("/admin/companies");
      return;
    }

    router.replace("/");
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-[length:42px_42px] opacity-30" />

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[32px] border border-border/80 bg-white/[0.03] p-8 sm:p-10">
            <p className="text-xs uppercase tracking-[0.28em] text-accent/90">
              SIL Inteligencia Analitica
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              Entre para conversar com a IA sobre os dados da sua empresa
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-8 text-muted">
              Identifique o usuario autenticado, vincule a empresa correta e
              deixe o chat enviar `company_id`, `workspace_id` e `dataset_id`
              certos para o backend.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-border/80 bg-card/70 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
                  Multiempresa
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Cada login carrega o contexto analitico do tenant correto.
                </p>
              </div>
              <div className="rounded-3xl border border-border/80 bg-card/70 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
                  Chat IA
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  O usuario autenticado ja entra pronto para perguntar sobre o
                  Power BI.
                </p>
              </div>
              <div className="rounded-3xl border border-border/80 bg-card/70 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
                  Painel admin
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Perfis admin conseguem acessar o cadastro de empresas.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-border/80 bg-white/[0.03] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
              Login
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">
              Identificar usuario
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              Use este login inicial para definir quem esta usando o sistema e
              qual empresa deve ser consultada.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              <label className="grid gap-3 text-sm text-foreground">
                <span>Nome</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={isLookingUp ? "Buscando..." : "Ex.: Paulo Silva"}
                  disabled={isLookingUp}
                  className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60 disabled:opacity-50"
                />
              </label>

              <label className="grid gap-3 text-sm text-foreground">
                <span>E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="paulo@empresa.com"
                  className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
                />
              </label>

              <label className="grid gap-3 text-sm text-foreground">
                <span>Empresa</span>
                <select
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
                  className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-3 text-sm text-foreground">
                <span>Perfil</span>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              {selectedCompany ? (
                <div className="rounded-3xl border border-border/80 bg-card/60 p-4 text-sm text-muted">
                  <p className="font-medium text-foreground">
                    Contexto carregado no login
                  </p>
                  <div className="mt-3 grid gap-2 text-xs">
                    <span>company_id: {selectedCompany.id}</span>
                    <span>workspace_id: {selectedCompany.workspaceId}</span>
                    <span>dataset_id: {selectedCompany.datasetId}</span>
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                className="rounded-2xl bg-accent px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Entrar no sistema
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
