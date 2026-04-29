"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronRight,
  MessageSquareMore,
  RefreshCw,
  UserCog,
  UsersRound,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminShell } from "@/components/admin/AdminShell";
import { listDashboardUsage } from "@/lib/admin-dashboard-service";
import type { CompanyUsageMetric, DashboardUsageData } from "@/types/admin-dashboard";

const numberFormatter = new Intl.NumberFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatCurrencyFromCents(value: number) {
  return currencyFormatter.format(value / 100);
}

function formatDateTime(value: string | null) {
  if (!value) return "Sem atividade";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMonthlyLimit(value: number | null) {
  if (value === null) return "Sem limite";
  return `${formatNumber(value)} msg`;
}

function truncateChartLabel(value: string, maxLength = 18) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function truncateLabel(value: string, maxLength = 18) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function resolveBillingStatus(metric: CompanyUsageMetric) {
  if (metric.billingStatus === "over_limit") {
    return {
      label: "Acima do limite",
      className: "border-red-500/30 bg-red-500/10 text-red-200",
    };
  }

  if (metric.billingStatus === "limit_without_price") {
    return {
      label: "Acima do limite sem tarifa",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    };
  }

  if (metric.billingStatus === "within_limit") {
    return {
      label: "Dentro do limite",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    };
  }

  return {
    label: "Sem regra comercial",
    className: "border-border/80 bg-white/[0.04] text-slate-300",
  };
}

function ChartTooltip({
  active,
  payload,
  label,
  currency = false,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  currency?: boolean;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border/80 bg-[#111823] px-3 py-2 text-xs text-slate-200 shadow-2xl">
      {label ? <p className="mb-2 font-semibold text-foreground">{label}</p> : null}
      <div className="grid gap-1.5">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color ?? "#94a3b8" }}
              />
              {item.name}
            </span>
            <span className="font-medium text-foreground">
              {currency
                ? formatCurrencyFromCents(Math.round((item.value ?? 0) * 100))
                : formatNumber(item.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendChart({ dashboard }: { dashboard: DashboardUsageData }) {
  const chartData = dashboard.trend.map((point) => ({
    label: point.label,
    Mensagens: point.messages,
    Conversas: point.sessions,
  }));

  const peakDay = dashboard.trend.reduce(
    (highest, point) => (point.messages > highest.messages ? point : highest),
    dashboard.trend[0],
  );
  const averageMessages = Math.round(
    dashboard.trend.reduce((total, point) => total + point.messages, 0) /
      Math.max(dashboard.trend.length, 1),
  );
  const trendTotalMessages = dashboard.trend.reduce(
    (total, point) => total + point.messages,
    0,
  );
  const activeDays = dashboard.trend.filter(
    (point) => point.messages > 0 || point.sessions > 0,
  ).length;

  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-[#0a0f17] px-4 py-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Pico diario
          </p>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {formatNumber(peakDay?.messages ?? 0)} msg
          </p>
          <p className="mt-1 text-sm text-muted">
            Maior volume em {peakDay?.label ?? "sem data"}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-[#0a0f17] px-4 py-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Media diaria
          </p>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {formatNumber(averageMessages)} msg
          </p>
          <p className="mt-1 text-sm text-muted">Ritmo medio do periodo monitorado</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-[#0a0f17] px-4 py-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Dias ativos
          </p>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {formatNumber(activeDays)}
          </p>
          <p className="mt-1 text-sm text-muted">
            Dias com mensagens ou conversas registradas
          </p>
        </div>
      </div>

      <div className="rounded-[18px] border border-border/70 bg-[#0a0f17] px-4 py-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Cadencia operacional
            </p>
            <p className="mt-1 text-sm text-muted">
              Leitura consolidada de mensagens e sessoes salvas no periodo.
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
            {formatNumber(trendTotalMessages)} mensagens no recorte
          </span>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="adminMessagesArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(130,142,170,0.12)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "rgba(130,142,170,0.8)", fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "rgba(130,142,170,0.8)", fontSize: 11 }}
              />
              <Tooltip content={<ChartTooltip />} cursor={false} />
              <Legend
                verticalAlign="top"
                height={30}
                wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
              />
              <Area
                type="monotone"
                dataKey="Mensagens"
                stroke="#10b981"
                fill="url(#adminMessagesArea)"
                strokeWidth={2.5}
                dot={{ r: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Conversas"
                stroke="#f87171"
                strokeWidth={2.2}
                dot={{ r: 3, fill: "#f87171", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function CompanyUsageChart({ companyUsage }: { companyUsage: CompanyUsageMetric[] }) {
  const rankedCompanies = companyUsage
    .filter((company) => company.currentMonthMessages > 0 || company.sessions > 0)
    .sort((left, right) => {
      if (right.currentMonthMessages !== left.currentMonthMessages) {
        return right.currentMonthMessages - left.currentMonthMessages;
      }

      return right.sessions - left.sessions;
    })
    .slice(0, 6);

  const chartData = rankedCompanies
    .map((company) => ({
      name: truncateChartLabel(company.companyName, 18),
      fullName: company.companyName,
      Mensagens: company.currentMonthMessages,
      Conversas: company.sessions,
    }));

  if (chartData.length === 0) {
    return (
      <p className="mt-6 text-sm leading-7 text-muted">
        Nenhuma empresa com movimentacao suficiente para gerar o grafico ainda.
      </p>
    );
  }

  const leader = rankedCompanies[0];
  const totalMessages = rankedCompanies.reduce(
    (total, company) => total + company.currentMonthMessages,
    0,
  );
  const leaderShare = totalMessages > 0 ? Math.round((leader.currentMonthMessages / totalMessages) * 100) : 0;

  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="rounded-[18px] border border-border/70 bg-[#0a0f17] px-4 py-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Ranking mensal
            </p>
            <p className="mt-1 text-sm text-muted">
              Empresas ordenadas por volume de mensagens, com conversas como apoio de leitura.
            </p>
          </div>
          <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            {formatNumber(rankedCompanies.length)} empresas monitoradas
          </span>
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 28, left: 0, bottom: 0 }}
              barCategoryGap={18}
            >
              <CartesianGrid stroke="rgba(130,142,170,0.12)" horizontal vertical={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "rgba(130,142,170,0.8)", fontSize: 11 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={132}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "rgba(226,232,240,0.92)", fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltip />} cursor={false} />
              <Legend
                verticalAlign="top"
                height={30}
                wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
              />
              <Bar
                dataKey="Mensagens"
                fill="#4f7cff"
                radius={[0, 10, 10, 0]}
                barSize={18}
              >
                <LabelList
                  dataKey="Mensagens"
                  position="right"
                  formatter={(value) => formatNumber(Number(value ?? 0))}
                  fill="#dbe7ff"
                  fontSize={11}
                />
              </Bar>
              <Bar
                dataKey="Conversas"
                fill="#8b5cf6"
                radius={[0, 10, 10, 0]}
                barSize={10}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="rounded-2xl border border-border/70 bg-[#0a0f17] px-4 py-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Lider do periodo
          </p>
          <p className="mt-3 text-xl font-semibold text-foreground">{leader.companyName}</p>
          <p className="mt-1 text-sm text-muted">
            {formatNumber(leader.currentMonthMessages)} mensagens no mes e{" "}
            {formatNumber(leader.sessions)} conversas acumuladas
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-[#0a0f17] px-4 py-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Participacao
          </p>
          <p className="mt-3 text-2xl font-semibold text-foreground">{leaderShare}%</p>
          <p className="mt-1 text-sm text-muted">Parcela do lider dentro do volume exibido</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-[#0a0f17] px-4 py-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Volume combinado
          </p>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {formatNumber(totalMessages)} msg
          </p>
          <p className="mt-1 text-sm text-muted">
            Total de mensagens considerado no ranking principal
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon,
  accentClass,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  accentClass: string;
}) {
  return (
    <div className={`rounded-[20px] border border-border/80 bg-[#0c1119] p-6 ${accentClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-300">{title}</p>
          <p className="mt-8 text-5xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-2 text-sm text-muted">{detail}</p>
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-slate-300">
          {icon}
        </span>
      </div>
    </div>
  );
}

async function loadDashboardData() {
  return listDashboardUsage();
}

export function AdminDashboardScreen() {
  const [dashboard, setDashboard] = useState<DashboardUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void loadDashboardData()
      .then((data) => {
        if (!isMounted) return;
        setDashboard(data);
        setLoadError(null);
      })
      .catch((error) => {
        if (!isMounted) return;
        setLoadError(
          error instanceof Error ? error.message : "Nao foi possivel carregar o dashboard.",
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      const data = await loadDashboardData();
      setDashboard(data);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Nao foi possivel atualizar o dashboard.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  const topCompany = useMemo(
    () =>
      dashboard?.companyUsage.find((metric) => metric.currentMonthMessages > 0) ??
      dashboard?.companyUsage.find((metric) => metric.sessions > 0) ??
      null,
    [dashboard],
  );

  return (
    <AdminShell
      title="Painel Administrativo"
      description="Acompanhe o uso do chat, empresas ativas e sinais operacionais do ambiente."
    >
      {isLoading && !dashboard ? (
        <div className="rounded-[20px] border border-border/80 bg-[#0c1119] p-6 text-sm text-muted">
          Carregando dashboard...
        </div>
      ) : loadError && !dashboard ? (
        <div className="rounded-[20px] border border-danger/40 bg-danger/10 p-6 text-sm text-red-200">
          {loadError}
        </div>
      ) : dashboard ? (
        <div className="grid gap-6">
          <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
            <MetricCard
              title="Total de Conversas"
              value={formatNumber(dashboard.summary.totalSessions)}
              detail={`${formatNumber(dashboard.summary.totalMessages)} mensagens no historico`}
              icon={<UsersRound className="h-4 w-4 text-accent" />}
              accentClass="border-l-[3px] border-l-blue-500"
            />
            <MetricCard
              title={`Mensagens em ${dashboard.summary.currentMonthLabel}`}
              value={formatNumber(dashboard.summary.currentMonthMessages)}
              detail={`${formatNumber(dashboard.summary.companiesWithLimit)} empresas com limite configurado`}
              icon={<MessageSquareMore className="h-4 w-4 text-emerald-400" />}
              accentClass="border-l-[3px] border-l-emerald-500"
            />
            <MetricCard
              title="Empresas acima do limite"
              value={formatNumber(dashboard.summary.companiesOverLimit)}
              detail={`${formatNumber(dashboard.summary.totalOverageMessages)} mensagens excedentes no mes`}
              icon={<Building2 className="h-4 w-4 text-amber-400" />}
              accentClass="border-l-[3px] border-l-amber-400"
            />
            <MetricCard
              title="Valor estimado a cobrar"
              value={formatCurrencyFromCents(dashboard.summary.totalProjectedOverageCents)}
              detail={`${formatNumber(dashboard.summary.companiesWithUsage)} empresas com uso e ${formatNumber(dashboard.summary.inactiveCompanies)} sem uso`}
              icon={<UserCog className="h-4 w-4 text-fuchsia-400" />}
              accentClass="border-l-[3px] border-l-fuchsia-500"
            />
          </section>

          {loadError ? (
            <div className="rounded-[20px] border border-danger/40 bg-danger/10 px-5 py-4 text-sm text-red-200">
              {loadError}
            </div>
          ) : null}

          <section className="rounded-[20px] border border-border/80 bg-[#0c1119] p-6">
            <div>
              <h2 className="text-[1.85rem] font-semibold text-foreground">
                Uso nos Ultimos 7 Dias
              </h2>
              <p className="mt-2 text-sm text-muted">
                Volume diario de mensagens e conversas salvas por todas as empresas.
              </p>
            </div>

            <TrendChart dashboard={dashboard} />
          </section>

          <section className="rounded-[20px] border border-border/80 bg-[#0c1119] p-6">
            <div>
              <h2 className="text-[1.85rem] font-semibold text-foreground">
                Empresas com Maior Uso
              </h2>
              <p className="mt-2 text-sm text-muted">
                Comparativo real de mensagens do mes e conversas acumuladas por empresa.
              </p>
            </div>

            <CompanyUsageChart companyUsage={dashboard.companyUsage} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_380px]">
            <div className="rounded-[20px] border border-border/80 bg-[#0c1119] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    Conversas Recentes
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Ultimas sessoes registradas no historico do chat
                  </p>
                </div>
                <div className="text-sm text-muted">
                  {formatNumber(dashboard.recentSessions.length)} itens
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {dashboard.recentSessions.length === 0 ? (
                  <p className="text-sm leading-7 text-muted">
                    Nenhuma conversa salva ainda.
                  </p>
                ) : (
                  dashboard.recentSessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-border/80 bg-[#0a0f17] px-4 py-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                            {session.companyName.slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {session.companyName}
                            </p>
                            <p className="truncate text-sm text-muted">
                              {session.firstPrompt}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-slate-300">
                          {formatNumber(session.totalMessages)} msg
                        </span>
                        <span className="text-xs text-muted">
                          {formatDateTime(session.lastActivity)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[20px] border border-border/80 bg-[#0c1119] p-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  Acoes Rapidas
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Atalhos para as funcoes principais do painel
                </p>
              </div>

              <div className="mt-6 grid gap-2">
                <Link
                  href="/admin/users"
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-[#0a0f17] px-4 py-4 text-sm font-medium text-foreground transition hover:border-accent/40 hover:bg-accent/10"
                >
                  <span className="inline-flex items-center gap-3">
                    <UsersRound className="h-4 w-4 text-accent" />
                    Gerenciar Usuarios
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </Link>

                <Link
                  href="/admin/companies"
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-[#0a0f17] px-4 py-4 text-sm font-medium text-foreground transition hover:border-accent/40 hover:bg-accent/10"
                >
                  <span className="inline-flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-fuchsia-400" />
                    Configurar Empresas
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </Link>

                <Link
                  href="/"
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-[#0a0f17] px-4 py-4 text-sm font-medium text-foreground transition hover:border-accent/40 hover:bg-accent/10"
                >
                  <span className="inline-flex items-center gap-3">
                    <MessageSquareMore className="h-4 w-4 text-emerald-400" />
                    Abrir Chat da SIL
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </Link>
              </div>

              <div className="mt-6 rounded-2xl border border-border/80 bg-[#0a0f17] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    Empresa em destaque
                  </p>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    Atualizar
                  </button>
                </div>

                {topCompany ? (
                  <div className="mt-4 grid gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {topCompany.companyName}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {formatNumber(topCompany.currentMonthMessages)} mensagens em{" "}
                        {dashboard.summary.currentMonthLabel}, com{" "}
                        {formatNumber(topCompany.sessions)} conversas no historico.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                          Limite mensal
                        </p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {formatMonthlyLimit(topCompany.monthlyMessageLimit)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                          Excedente estimado
                        </p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {formatNumber(topCompany.overageMessages)} msg
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                          Valor estimado
                        </p>
                        <p className="mt-2 text-lg font-semibold text-foreground">
                          {formatCurrencyFromCents(topCompany.projectedOverageCents)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                          Ultima atividade
                        </p>
                        <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                          {formatDateTime(topCompany.lastActivity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-muted">
                    Nenhuma empresa usou o chat ainda.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[20px] border border-border/80 bg-[#0c1119] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  Uso por Empresa
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Distribuicao do volume com leitura comercial do mes atual
                </p>
              </div>
              <div className="text-sm text-muted">
                {formatCurrencyFromCents(dashboard.summary.totalProjectedOverageCents)} em cobranca estimada
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {dashboard.companyUsage.map((company) => (
                <article
                  key={company.companyId}
                  className="rounded-2xl border border-border/80 bg-[#0a0f17] px-4 py-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 xl:max-w-[42%]">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            company.sessions > 0 ? "bg-emerald-400" : "bg-slate-500"
                          }`}
                        />
                        <p className="truncate text-base font-semibold text-foreground">
                          {company.companyName}
                        </p>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] ${resolveBillingStatus(company).className}`}
                        >
                          {resolveBillingStatus(company).label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {company.sessions > 0
                          ? `${formatNumber(company.totalMessages)} mensagens distribuidas em ${formatNumber(company.sessions)} conversas`
                          : "Sem movimentacao registrada"}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[620px]">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Conversas</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {formatNumber(company.sessions)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                          Mensagens no mes
                        </p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {formatNumber(company.currentMonthMessages)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                          Limite mensal
                        </p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {formatMonthlyLimit(company.monthlyMessageLimit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                          Excedente
                        </p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {formatNumber(company.overageMessages)} msg
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                          Valor estimado
                        </p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {formatCurrencyFromCents(company.projectedOverageCents)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                          Ultima atividade
                        </p>
                        <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                          {formatDateTime(company.lastActivity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
}
