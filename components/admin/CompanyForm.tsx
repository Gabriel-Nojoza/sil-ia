"use client";

import { useState } from "react";
import type { CreateCompanyInput, PowerBiIdentityMode } from "@/types/company";

interface CompanyFormProps {
  onSubmit: (input: CreateCompanyInput) => Promise<void>;
}

const initialForm: CreateCompanyInput = {
  name: "",
  workspaceId: "",
  datasetId: "",
  webhookUrl: "",
  timezone: "America/Sao_Paulo",
  language: "pt-BR",
  powerbiIdentityMode: "service_principal",
  accessUserName: "",
  accessUserEmail: "",
  accessUserRole: "admin",
};

export function CompanyForm({ onSubmit }: CompanyFormProps) {
  const [form, setForm] = useState<CreateCompanyInput>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof CreateCompanyInput>(
    key: K,
    value: CreateCompanyInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (
      !form.name.trim() ||
      !form.workspaceId.trim() ||
      !form.datasetId.trim() ||
      !form.accessUserName.trim() ||
      !form.accessUserEmail.trim()
    ) {
      setError(
        "Preencha nome da empresa, workspace_id, dataset_id e os dados do usuario de acesso.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        workspaceId: form.workspaceId.trim(),
        datasetId: form.datasetId.trim(),
        accessUserName: form.accessUserName.trim(),
        accessUserEmail: form.accessUserEmail.trim(),
      });
      setForm(initialForm);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
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
          Cadastro
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-foreground">
          Nova empresa
        </h2>
        <p className="mt-3 max-w-md text-sm leading-8 text-muted">
          Cadastre a empresa e vincule o semantic model correto do Power BI.
        </p>
      </div>

      <div className="grid gap-x-5 gap-y-6 2xl:grid-cols-2">
        <label className="grid gap-3 text-sm text-foreground">
          <span>Nome da empresa</span>
          <input
            value={form.name ?? ""}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Ex.: Grupo Atlas"
            className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
          />
        </label>

        <label className="grid gap-3 text-sm text-foreground">
          <span className="leading-6">Modo de autenticacao Power BI</span>
          <select
            value={form.powerbiIdentityMode ?? "service_principal"}
            onChange={(event) =>
              updateField(
                "powerbiIdentityMode",
                event.target.value as PowerBiIdentityMode,
              )
            }
            className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
          >
            <option value="service_principal">service_principal</option>
            <option value="delegated_user">delegated_user</option>
          </select>
        </label>

        <label className="grid gap-3 text-sm text-foreground">
          <span>workspace_id</span>
          <input
            value={form.workspaceId ?? ""}
            onChange={(event) => updateField("workspaceId", event.target.value)}
            placeholder="UUID do workspace"
            className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
          />
        </label>

        <label className="grid gap-3 text-sm text-foreground">
          <span>dataset_id</span>
          <input
            value={form.datasetId ?? ""}
            onChange={(event) => updateField("datasetId", event.target.value)}
            placeholder="UUID do dataset"
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

        <label className="grid gap-3 text-sm text-foreground">
          <span>Timezone</span>
          <input
            value={form.timezone ?? "America/Sao_Paulo"}
            onChange={(event) => updateField("timezone", event.target.value)}
            className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
          />
        </label>

        <label className="grid gap-3 text-sm text-foreground">
          <span>Idioma</span>
          <input
            value={form.language ?? "pt-BR"}
            onChange={(event) => updateField("language", event.target.value)}
            className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3.5 outline-none transition focus:border-accent/60"
          />
        </label>
      </div>

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

      {error ? (
        <div className="mt-5 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[180px] rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Cadastrando..." : "Cadastrar empresa"}
        </button>
        <p className="max-w-sm text-xs leading-7 text-muted">
          Troque o mock por um insert no Supabase para persistir esse formulario.
        </p>
      </div>
    </form>
  );
}
