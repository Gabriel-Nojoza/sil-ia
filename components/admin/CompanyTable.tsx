"use client";

import { useState } from "react";
import type { CompanyRecord } from "@/types/company";

interface CompanyTableProps {
  companies: CompanyRecord[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (company: CompanyRecord) => void;
}

const numberFormatter = new Intl.NumberFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatLimit(value: number | null) {
  if (value === null) return "Sem limite";
  return `${numberFormatter.format(value)} msg/mes`;
}

function formatOveragePrice(value: number | null) {
  if (value === null) return "Sem tarifa";
  return `${currencyFormatter.format(value / 100)}/msg`;
}

export function CompanyTable({ companies, onDelete, onEdit }: CompanyTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  function DeleteButton({ id }: { id: string }) {
    const isConfirming = confirmId === id;
    const isDeleting = deletingId === id;

    if (isDeleting) {
      return (
        <span className="text-xs text-muted">Excluindo...</span>
      );
    }

    if (isConfirming) {
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDelete(id)}
            className="rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-300 transition hover:bg-red-500/30"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setConfirmId(null)}
            className="rounded-lg px-2 py-1 text-xs text-muted transition hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setConfirmId(id)}
        className="rounded-lg border border-border/80 px-2.5 py-1 text-xs text-muted transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
      >
        Excluir
      </button>
    );
  }

  return (
    <div className="rounded-[28px] border border-border/80 bg-white/[0.03] p-5 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-accent/90">Empresas</p>
          <h2 className="mt-3 text-xl font-semibold text-foreground">Base multiempresa</h2>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card/70 px-4 py-2 text-sm text-muted">
          {companies.length} cadastrada(s)
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-muted">
              <th className="px-4">Empresa</th>
              <th className="px-4">Workspace</th>
              <th className="px-4">Dataset</th>
              <th className="px-4">Limite</th>
              <th className="px-4">Excedente</th>
              <th className="px-4">Modo</th>
              <th className="px-4">Criada em</th>
              <th className="px-4"></th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="bg-card/80 text-sm text-foreground">
                <td className="rounded-l-2xl px-4 py-4">
                  <div className="max-w-[220px] font-medium leading-6">{company.name}</div>
                  <div className="mt-1 break-all text-xs text-muted">{company.id}</div>
                </td>
                <td className="px-4 py-4 font-mono text-xs leading-6 text-slate-300">{company.workspaceId}</td>
                <td className="px-4 py-4 font-mono text-xs leading-6 text-slate-300">{company.datasetId}</td>
                <td className="px-4 py-4 text-slate-200">{formatLimit(company.monthlyMessageLimit)}</td>
                <td className="px-4 py-4 text-slate-200">{formatOveragePrice(company.overagePriceCents)}</td>
                <td className="px-4 py-4 text-slate-200">{company.powerbiIdentityMode}</td>
                <td className="px-4 py-4 text-slate-300">
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(company.createdAt))}
                </td>
                <td className="rounded-r-2xl px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(company)}
                      className="rounded-lg border border-border/80 px-2.5 py-1 text-xs text-muted transition hover:border-accent/50 hover:bg-accent/10 hover:text-accent"
                    >
                      Editar
                    </button>
                    <DeleteButton id={company.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="grid gap-3 lg:hidden">
        {companies.map((company) => (
          <article key={company.id} className="rounded-3xl border border-border/80 bg-card/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">{company.name}</h3>
                <p className="mt-1 break-all text-xs text-muted">{company.id}</p>
              </div>
              <span className="rounded-full border border-border/80 px-3 py-1 text-xs text-slate-200">
                {company.powerbiIdentityMode}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Workspace</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-300">{company.workspaceId}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Dataset</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-300">{company.datasetId}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Limite mensal</p>
                <p className="mt-1 text-slate-300">{formatLimit(company.monthlyMessageLimit)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Excedente</p>
                <p className="mt-1 text-slate-300">{formatOveragePrice(company.overagePriceCents)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Criada em</p>
                <p className="mt-1 text-slate-300">
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(company.createdAt))}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(company)}
                  className="rounded-lg border border-border/80 px-2.5 py-1 text-xs text-muted transition hover:border-accent/50 hover:bg-accent/10 hover:text-accent"
                >
                  Editar
                </button>
                <DeleteButton id={company.id} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
