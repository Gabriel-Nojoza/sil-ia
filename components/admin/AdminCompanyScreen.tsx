"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { CompanyForm } from "@/components/admin/CompanyForm";
import { CompanyTable } from "@/components/admin/CompanyTable";
import {
  createCompany,
  deleteCompany,
  listCompanies,
  updateCompany,
} from "@/lib/company-service";
import type { CompanyRecord, CreateCompanyInput, UpdateCompanyInput } from "@/types/company";

const numberFormatter = new Intl.NumberFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function AdminCompanyScreen() {
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const companiesWithLimit = companies.filter((company) => company.monthlyMessageLimit !== null);
  const companiesWithOveragePrice = companies.filter(
    (company) => company.overagePriceCents !== null,
  );
  const contractedVolume = companiesWithLimit.reduce(
    (total, company) => total + (company.monthlyMessageLimit ?? 0),
    0,
  );
  const averageOveragePriceCents =
    companiesWithOveragePrice.length > 0
      ? Math.round(
          companiesWithOveragePrice.reduce(
            (total, company) => total + (company.overagePriceCents ?? 0),
            0,
          ) / companiesWithOveragePrice.length,
        )
      : 0;

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

  async function handleUpdateCompany(id: string, input: UpdateCompanyInput) {
    const updatedCompany = await updateCompany(id, input);
    setCompanies((current) =>
      current.map((company) => (company.id === id ? updatedCompany : company)),
    );
    setEditingCompany(null);
  }

  async function handleDeleteCompany(id: string) {
    await deleteCompany(id);
    setCompanies((current) => current.filter((c) => c.id !== id));
    setEditingCompany((current) => (current?.id === id ? null : current));
  }

  return (
    <AdminShell
      title="Painel admin de empresas"
      description="Cadastre e gerencie os tenants do seu ambiente analitico. Cada empresa aponta para seu proprio workspace, dataset e configuracao de acesso ao Power BI."
    >
      <div className="grid gap-6 2xl:grid-cols-[460px_minmax(0,1fr)]">
        <CompanyForm
          mode={editingCompany ? "edit" : "create"}
          company={editingCompany}
          onCreate={handleCreateCompany}
          onUpdate={handleUpdateCompany}
          onCancelEdit={() => setEditingCompany(null)}
        />

        <div className="grid gap-5">
          <section className="grid gap-4 xl:grid-cols-4">
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
                Empresas com limite
              </p>
              <p className="mt-4 text-4xl font-semibold text-foreground">
                {numberFormatter.format(companiesWithLimit.length)}
              </p>
              <p className="mt-4 text-sm leading-7 text-muted">
                Contas com regra mensal pronta para acompanhamento de excedente.
              </p>
            </div>

            <div className="rounded-[28px] border border-border/80 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
                Volume contratado
              </p>
              <p className="mt-4 text-4xl font-semibold text-foreground">
                {numberFormatter.format(contractedVolume)}
              </p>
              <p className="mt-4 text-sm leading-7 text-muted">
                Soma dos limites mensais configurados entre as empresas.
              </p>
            </div>

            <div className="rounded-[28px] border border-border/80 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
                Tarifa media
              </p>
              <p className="mt-4 text-4xl font-semibold text-foreground">
                {currencyFormatter.format(averageOveragePriceCents / 100)}
              </p>
              <p className="mt-4 text-sm leading-7 text-muted">
                Referencia media do valor excedente por mensagem ja configurado.
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
            <CompanyTable
              companies={companies}
              onDelete={handleDeleteCompany}
              onEdit={setEditingCompany}
            />
          )}
        </div>
      </div>
    </AdminShell>
  );
}
