"use client";

import { useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { listCompanies } from "@/lib/company-service";
import type { CompanyRecord } from "@/types/company";

interface UserRow {
  id: number;
  name: string;
  email: string;
  status: string;
  company_id: string | null;
  webhook_url: string | null;
}

const emptyForm = {
  name: "",
  email: "",
  status: "user",
  company_id: "",
  webhook_url: "",
};

export function AdminUsersScreen() {
  const autoFilledNameRef = useRef("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [isLookingUpEmail, setIsLookingUpEmail] = useState(false);
  const [companyAutoDetected, setCompanyAutoDetected] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const [{ data: usersData }, companiesData] = await Promise.all([
        supabase
          .from("users")
          .select("id, name, email, status, company_id, webhook_url")
          .order("name"),
        listCompanies(),
      ]);

      setUsers((usersData as UserRow[]) ?? []);
      setCompanies(companiesData);
      setLoading(false);
    }

    load();
  }, []);

  useEffect(() => {
    const normalizedEmail = form.email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setIsLookingUpEmail(false);
      setCompanyAutoDetected(false);
      autoFilledNameRef.current = "";
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setIsLookingUpEmail(true);
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

        setForm((current) => {
          const next = { ...current };

          if (data?.name) {
            if (!current.name.trim() || current.name === autoFilledNameRef.current) {
              next.name = data.name;
            }
            autoFilledNameRef.current = data.name;
          } else if (current.name === autoFilledNameRef.current) {
            next.name = "";
            autoFilledNameRef.current = "";
          }

          if (data?.company_id) {
            next.company_id = data.company_id;
            setCompanyAutoDetected(true);
          } else {
            setCompanyAutoDetected(false);
          }

          if (data?.webhook_url && !current.webhook_url.trim()) {
            next.webhook_url = data.webhook_url;
          }

          if (
            (data?.role === "admin" || data?.role === "user") &&
            current.status === emptyForm.status
          ) {
            next.status = data.role;
          }

          return next;
        });
      } catch {
        if (!active) {
          return;
        }

        setCompanyAutoDetected(false);
      } finally {
        if (active) {
          setIsLookingUpEmail(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.email]);

  function companyName(id: string | null) {
    return companies.find((company) => company.id === id)?.name ?? "-";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setError("Nome e e-mail sao obrigatorios.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: insertError } = await supabase
        .from("users")
        .insert({
          name: form.name.trim(),
          email: form.email.trim(),
          status: form.status,
          company_id: form.company_id || null,
          webhook_url: form.webhook_url.trim() || null,
        })
        .select("id, name, email, status, company_id, webhook_url")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setUsers((previous) => [data as UserRow, ...previous]);
      setForm(emptyForm);
      setCompanyAutoDetected(false);
      autoFilledNameRef.current = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar usuario.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    const supabase = getSupabaseBrowserClient();
    await supabase.from("users").delete().eq("id", id);
    setUsers((previous) => previous.filter((user) => user.id !== id));
    setDeletingId(null);
    setConfirmId(null);
  }

  return (
    <AdminShell
      title="Gestao de usuarios"
      description="Cadastre usuarios, vincule empresas e configure o webhook do n8n por usuario."
    >
      <div className="grid gap-6 2xl:grid-cols-[400px_minmax(0,1fr)]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-border/80 bg-white/[0.03] p-6"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-accent/90">Cadastro</p>
          <h2 className="mt-3 text-xl font-semibold text-foreground">Novo usuario</h2>

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm text-foreground">
              <span>Nome</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder={isLookingUpEmail ? "Buscando..." : "Ex.: Joao Silva"}
                disabled={isLookingUpEmail}
                className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3 outline-none transition focus:border-accent/60 disabled:opacity-50"
              />
            </label>

            <label className="grid gap-2 text-sm text-foreground">
              <span>E-mail</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="joao@empresa.com"
                className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3 outline-none transition focus:border-accent/60"
              />
            </label>

            <label className="grid gap-2 text-sm text-foreground">
              <span>Perfil</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
                className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3 outline-none transition focus:border-accent/60"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-foreground">
              <span>Empresa</span>
              {isLookingUpEmail ? (
                <div className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3 text-muted">
                  Identificando empresa...
                </div>
              ) : companyAutoDetected && form.company_id ? (
                <div className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-accent"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span className="font-medium text-foreground">
                    {companyName(form.company_id)}
                  </span>
                </div>
              ) : (
                <select
                  value={form.company_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      company_id: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3 outline-none transition focus:border-accent/60"
                >
                  <option value="">- Selecionar -</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label className="grid gap-2 text-sm text-foreground">
              <span>Webhook URL (n8n)</span>
              <input
                value={form.webhook_url}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    webhook_url: event.target.value,
                  }))
                }
                placeholder="https://...n8n.../webhook/..."
                className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3 outline-none transition focus:border-accent/60"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
            >
              {submitting ? "Cadastrando..." : "Cadastrar usuario"}
            </button>
          </div>
        </form>

        <div className="rounded-[28px] border border-border/80 bg-white/[0.03] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-accent/90">Usuarios</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Base de acesso</h2>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/70 px-4 py-2 text-sm text-muted">
              {users.length} cadastrado(s)
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted">Carregando...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted">Nenhum usuario cadastrado.</p>
          ) : (
            <div className="grid gap-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-2xl border border-border/80 bg-card/80 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted">{user.email}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-3 py-0.5 text-xs ${
                        user.status === "admin"
                          ? "border-accent/50 text-accent"
                          : "border-border/80 text-muted"
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1 text-xs text-muted">
                    <span>
                      Empresa:{" "}
                      <span className="text-foreground">{companyName(user.company_id)}</span>
                    </span>
                    {user.webhook_url ? (
                      <span className="truncate">
                        Webhook: <span className="text-slate-300">{user.webhook_url}</span>
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex justify-end">
                    {deletingId === user.id ? (
                      <span className="text-xs text-muted">Excluindo...</span>
                    ) : confirmId === user.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="rounded-lg bg-red-500/20 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/30"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="rounded-lg px-2 py-1 text-xs text-muted hover:text-foreground"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(user.id)}
                        className="rounded-lg border border-border/80 px-2.5 py-1 text-xs text-muted hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
