"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { CompanyForm } from "@/components/admin/CompanyForm";
import { CompanyTable } from "@/components/admin/CompanyTable";
import { createCompany, listCompanies } from "@/lib/company-service";
import type { CompanyRecord, CreateCompanyInput } from "@/types/company";

export function AdminCompanyScreen() {
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const response = await listCompanies();
        setCompanies(response);
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar as empresas.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadCompanies();
  }, []);

  async function handleCreateCompany(input: CreateCompanyInput) {
    const createdCompany = await createCompany(input);
    setCompanies((current) => [createdCompany, ...current]);
  }

  return (
    <AdminShell
      title="Painel admin de empresas"
      description="Cadastre e gerencie os tenants do seu ambiente analitico. Cada empresa aponta para seu proprio workspace, dataset e configuracao de acesso ao Power BI."
    >
      <div className="grid gap-6 2xl:grid-cols-[460px_minmax(0,1fr)]">
        <CompanyForm onSubmit={handleCreateCompany} />

        <div className="grid gap-5">
          <section className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-[28px] border border-border/80 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
                Total de empresas
              </p>
              <p className="mt-4 text-4xl font-semibold text-foreground">
                {companies.length}
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Quantidade total de tenants ativos cadastrados no painel.
              </p>
            </div>

            <div className="rounded-[28px] border border-border/80 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
                Workflow
              </p>
              <p className="mt-4 text-sm leading-7 text-muted">
                Depois do cadastro, use `company_id`, `workspace_id` e
                `dataset_id` no fluxo do n8n para consultas reais.
              </p>
            </div>

            <div className="rounded-[28px] border border-border/80 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
                Persistencia
              </p>
              <p className="mt-4 text-sm leading-7 text-muted">
                A UI esta pronta para trocar o mock atual por insert e select no
                Supabase.
              </p>
            </div>
          </section>

          {isLoading ? (
            <div className="rounded-[28px] border border-border/80 bg-white/[0.03] p-6 text-sm text-muted">
              Carregando empresas...
            </div>
          ) : loadError ? (
            <div className="rounded-[28px] border border-danger/40 bg-danger/10 p-6 text-sm text-red-200">
              {loadError}
            </div>
          ) : (
            <CompanyTable companies={companies} />
          )}
        </div>
      </div>
    </AdminShell>
  );
}
