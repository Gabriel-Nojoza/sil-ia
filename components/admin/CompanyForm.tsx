"use client";

import { useEffect, useState } from "react";
import type {
  CompanyRecord,
  CreateCompanyInput,
  UpdateCompanyInput,
} from "@/types/company";

interface CompanyFormProps {
  mode?: "create" | "edit";
  company?: CompanyRecord | null;
  onCreate: (input: CreateCompanyInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateCompanyInput) => Promise<void>;
  onCancelEdit?: () => void;
}

const initialForm: CreateCompanyInput = {
  name: "",
  workspaceId: "",
  datasetId: "",
  tenantId: "",
  clientId: "",
  clientSecret: "",
  webhookUrl: "",
  timezone: "America/Sao_Paulo",
  language: "pt-BR",
  powerbiIdentityMode: "service_principal",
  monthlyMessageLimit: null,
  overagePriceCents: null,
  accessUserName: "",
  accessUserEmail: "",
  accessUserRole: "admin",
};

function parseOptionalInteger(value: string) {
  if (!value.trim()) return null;

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return null;

  return parsed;
}

function parseCurrencyToCents(value: string) {
  if (!value.trim()) return null;

  const parsed = Number.parseFloat(value.replace(",", "."));
  if (Number.isNaN(parsed) || parsed < 0) return null;

  return Math.round(parsed * 100);
}

function formatCurrencyInput(value: number | null) {
  if (value === null) return "";
  return (value / 100).toFixed(2);
}

export function CompanyForm({
  mode = "create",
  company,
  onCreate,
  onUpdate,
  onCancelEdit,
}: CompanyFormProps) {
  const [form, setForm] = useState<CreateCompanyInput>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !company) {
      setForm(initialForm);
      return;
    }

    setForm({
      name: company.name,
      workspaceId: company.workspaceId,
      datasetId: company.datasetId,
      tenantId: company.tenantId,
      clientId: company.clientId,
      clientSecret: company.clientSecret,
      webhookUrl: company.webhookUrl,
      timezone: company.timezone,
      language: company.language,
      powerbiIdentityMode: company.powerbiIdentityMode,
      monthlyMessageLimit: company.monthlyMessageLimit,
      overagePriceCents: company.overagePriceCents,
      accessUserName: "",
      accessUserEmail: "",
      accessUserRole: "admin",
    });
  }, [company, mode]);

  function updateField<K extends keyof CreateCompanyInput>(
    key: K,
    value: CreateCompanyInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Preencha o nome da empresa.");
      return;
    }

    if (mode === "create" && (!form.accessUserName.trim() || !form.accessUserEmail.trim())) {
      setError("Preencha os dados do usuario de acesso.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: UpdateCompanyInput = {
        name: form.name.trim(),
        workspaceId: form.workspaceId.trim(),
        datasetId: form.datasetId.trim(),
        tenantId: form.tenantId.trim(),
        clientId: form.clientId.trim(),
        clientSecret: form.clientSecret.trim(),
        webhookUrl: form.webhookUrl.trim(),
        timezone: form.timezone.trim(),
        language: form.language.trim(),
        powerbiIdentityMode: form.powerbiIdentityMode,
        monthlyMessageLimit: form.monthlyMessageLimit,
        overagePriceCents: form.overagePriceCents,
      };

      if (mode === "edit" && company) {
        await onUpdate(company.id, payload);
      } else {
        await onCreate({
          ...payload,
          accessUserName: form.accessUserName.trim(),
          accessUserEmail: form.accessUserEmail.trim(),
          accessUserRole: form.accessUserRole,
        });
        setForm(initialForm);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : mode === "edit"
            ? "Nao foi possivel atualizar a empresa."
            : "Nao foi possivel cadastrar a empresa.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] border border-border/80 bg-white/[0.03] p-6 sm:p-7"
    >
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
          {mode === "edit" ? "Edicao" : "Cadastro"}
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-foreground">
          {mode === "edit" ? "Editar empresa" : "Nova empresa"}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-8 text-muted">
          {mode === "edit"
            ? "Atualize os dados da empresa e mantenha o acesso ao Power BI alinhado."
            : "Cadastre a empresa e vincule o semantic model correto do Power BI."}
        </p>
      </div>

      <div className="grid gap-x-5 gap-y-6 2xl:grid-cols-2">
        <label className="grid gap-3 text-sm text-foreground 2xl:col-span-2">
          <span>Nome da empresa</span>
          <input
            value={form.name ?? ""}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Ex.: Grupo Atlas"
            className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
          />
        </label>

        <label className="grid gap-3 text-sm text-foreground 2xl:col-span-2">
          <span>Webhook URL (n8n)</span>
          <input
            value={form.webhookUrl ?? ""}
            onChange={(event) => updateField("webhookUrl", event.target.value)}
            placeholder="https://...n8n.../webhook/.../chat"
            className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
          />
        </label>
      </div>

      <div className="mt-10 border-t border-border/80 pt-8">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
            Limites e cobranca
          </p>
          <h3 className="mt-3 text-xl font-semibold text-foreground">
            Regra comercial da empresa
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-8 text-muted">
            Defina um teto mensal de mensagens e o valor excedente por mensagem para
            o admin acompanhar a cobranca estimada no dashboard.
          </p>
        </div>

        <div className="grid gap-x-5 gap-y-6 2xl:grid-cols-2">
          <label className="grid gap-3 text-sm text-foreground">
            <span>Limite mensal de mensagens</span>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={form.monthlyMessageLimit ?? ""}
              onChange={(event) =>
                updateField("monthlyMessageLimit", parseOptionalInteger(event.target.value))
              }
              placeholder="Ex.: 1200"
              className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
            />
          </label>

          <label className="grid gap-3 text-sm text-foreground">
            <span>Valor excedente por mensagem (R$)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={formatCurrencyInput(form.overagePriceCents)}
              onChange={(event) =>
                updateField("overagePriceCents", parseCurrencyToCents(event.target.value))
              }
              placeholder="Ex.: 0,35"
              className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
            />
          </label>
        </div>

        <p className="mt-4 max-w-xl text-xs leading-7 text-muted">
          Se deixar em branco, a empresa fica sem limite configurado ou sem cobranca
          automatica de excedente.
        </p>
      </div>

      {mode === "create" ? (
        <div className="mt-10 border-t border-border/80 pt-8">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
              Acesso inicial
            </p>
            <h3 className="mt-3 text-xl font-semibold text-foreground">
              Usuario responsavel
            </h3>
            <p className="mt-3 max-w-md text-sm leading-8 text-muted">
              Defina o usuario que tera acesso inicial a empresa cadastrada.
            </p>
          </div>

          <div className="grid gap-x-5 gap-y-6 2xl:grid-cols-2">
            <label className="grid gap-3 text-sm text-foreground">
              <span>Nome do usuario</span>
              <input
                value={form.accessUserName ?? ""}
                onChange={(event) => updateField("accessUserName", event.target.value)}
                placeholder="Ex.: Maria Souza"
                className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
              />
            </label>

            <label className="grid gap-3 text-sm text-foreground">
              <span>E-mail de acesso</span>
              <input
                type="email"
                value={form.accessUserEmail ?? ""}
                onChange={(event) => updateField("accessUserEmail", event.target.value)}
                placeholder="maria@empresa.com"
                className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
              />
            </label>

            <label className="grid gap-3 text-sm text-foreground">
              <span>Perfil de acesso</span>
              <select
                value={form.accessUserRole ?? "admin"}
                onChange={(event) =>
                  updateField("accessUserRole", event.target.value as "admin" | "user")
                }
                className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
              >
                <option value="admin">admin</option>
                <option value="user">user</option>
              </select>
            </label>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[180px] rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? mode === "edit"
                ? "Salvando..."
                : "Cadastrando..."
              : mode === "edit"
                ? "Salvar alteracoes"
                : "Cadastrar empresa"}
          </button>

          {mode === "edit" ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-2xl border border-border/80 px-5 py-3 text-sm font-semibold text-muted transition hover:border-border hover:text-foreground"
            >
              Cancelar edicao
            </button>
          ) : null}
        </div>

        <p className="max-w-sm text-xs leading-7 text-muted">
          {mode === "edit"
            ? "As alteracoes sao aplicadas na empresa selecionada sem criar um novo usuario."
            : "Troque o mock por um insert no Supabase para persistir esse formulario."}
        </p>
      </div>
    </form>
  );
}
