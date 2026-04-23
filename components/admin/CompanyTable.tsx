import type { CompanyRecord } from "@/types/company";

interface CompanyTableProps {
  companies: CompanyRecord[];
}

export function CompanyTable({ companies }: CompanyTableProps) {
  return (
    <div className="rounded-[28px] border border-border/80 bg-white/[0.03] p-5 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
            Empresas
          </p>
          <h2 className="mt-3 text-xl font-semibold text-foreground">
            Base multiempresa
          </h2>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card/70 px-4 py-2 text-sm text-muted">
          {companies.length} cadastrada(s)
        </div>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-muted">
              <th className="px-4">Empresa</th>
              <th className="px-4">Workspace</th>
              <th className="px-4">Dataset</th>
              <th className="px-4">Modo</th>
              <th className="px-4">Criada em</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="bg-card/80 text-sm text-foreground">
                <td className="rounded-l-2xl px-4 py-4">
                  <div className="max-w-[220px] font-medium leading-6">
                    {company.name}
                  </div>
                  <div className="mt-1 break-all text-xs text-muted">
                    {company.id}
                  </div>
                </td>
                <td className="px-4 py-4 font-mono text-xs leading-6 text-slate-300">
                  {company.workspaceId}
                </td>
                <td className="px-4 py-4 font-mono text-xs leading-6 text-slate-300">
                  {company.datasetId}
                </td>
                <td className="px-4 py-4 text-slate-200">
                  {company.powerbiIdentityMode}
                </td>
                <td className="rounded-r-2xl px-4 py-4 text-slate-300">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(company.createdAt))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {companies.map((company) => (
          <article
            key={company.id}
            className="rounded-3xl border border-border/80 bg-card/80 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {company.name}
                </h3>
                <p className="mt-1 break-all text-xs text-muted">{company.id}</p>
              </div>
              <span className="rounded-full border border-border/80 px-3 py-1 text-xs text-slate-200">
                {company.powerbiIdentityMode}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                  Workspace
                </p>
                <p className="mt-1 break-all font-mono text-xs text-slate-300">
                  {company.workspaceId}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                  Dataset
                </p>
                <p className="mt-1 break-all font-mono text-xs text-slate-300">
                  {company.datasetId}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                  Criada em
                </p>
                <p className="mt-1 text-slate-300">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(company.createdAt))}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
