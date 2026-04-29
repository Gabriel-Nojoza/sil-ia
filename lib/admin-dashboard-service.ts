import { listCompanies } from "@/lib/company-service";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  CompanyUsageMetric,
  DashboardUsageData,
  RecentSession,
  UsageTrendPoint,
} from "@/types/admin-dashboard";
import type { ChatMessage } from "@/types/chat";
import type { CompanyRecord } from "@/types/company";

interface ConversationLogRow {
  session_id: string;
  user_id: string | null;
  company_id: string | null;
  messages: unknown;
  created_at: string | null;
}

const DASHBOARD_BATCH_SIZE = 1000;
const DASHBOARD_MAX_ROWS = 10000;

function formatCurrentMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function normalizeTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function normalizeMessages(value: unknown): ChatMessage[] {
  let source = value;

  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(source)) return [];

  return source.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];

    const candidate = item as Partial<ChatMessage>;
    if (candidate.role !== "user" && candidate.role !== "assistant") return [];
    if (typeof candidate.content !== "string") return [];

    return [
      {
        id: typeof candidate.id === "string" ? candidate.id : `message-${index}`,
        role: candidate.role,
        content: candidate.content,
        createdAt: normalizeTimestamp(candidate.createdAt) ?? new Date(0).toISOString(),
      },
    ];
  });
}

function createCompanyMetric(
  companyId: string,
  companyName: string,
  settings?: Pick<CompanyRecord, "monthlyMessageLimit" | "overagePriceCents">,
): CompanyUsageMetric {
  return {
    companyId,
    companyName,
    sessions: 0,
    totalMessages: 0,
    promptCount: 0,
    assistantMessages: 0,
    averageMessagesPerSession: 0,
    usageShare: 0,
    lastActivity: null,
    currentMonthMessages: 0,
    monthlyMessageLimit: settings?.monthlyMessageLimit ?? null,
    overagePriceCents: settings?.overagePriceCents ?? null,
    overageMessages: 0,
    projectedOverageCents: 0,
    billingStatus: settings?.monthlyMessageLimit == null ? "no_limit" : "within_limit",
  };
}

function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function trendLabel(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function resolveLastActivity(messages: ChatMessage[], createdAt: string | null): string | null {
  const timestamps = messages
    .map((message) => normalizeTimestamp(message.createdAt))
    .filter((value): value is string => Boolean(value));

  if (timestamps.length > 0) {
    return timestamps.reduce((latest, current) => (current > latest ? current : latest));
  }

  return normalizeTimestamp(createdAt);
}

async function fetchConversationLogs(): Promise<ConversationLogRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseBrowserClient();
  const rows: ConversationLogRow[] = [];

  // Pagina a leitura para nao depender do limite padrao do Supabase.
  for (let from = 0; from < DASHBOARD_MAX_ROWS; from += DASHBOARD_BATCH_SIZE) {
    const to = from + DASHBOARD_BATCH_SIZE - 1;
    const { data, error } = await supabase
      .from("conversation_logs")
      .select("session_id, user_id, company_id, messages, created_at")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Falha ao carregar uso do chat: ${error.message}`);
    }

    const batch = (data ?? []) as ConversationLogRow[];
    rows.push(...batch);

    if (batch.length < DASHBOARD_BATCH_SIZE) {
      break;
    }
  }

  return rows;
}

function buildUsageData(companies: CompanyRecord[], logs: ConversationLogRow[]): DashboardUsageData {
  const companyNames = new Map(companies.map((company) => [company.id, company.name]));
  const companySettings = new Map(
    companies.map((company) => [
      company.id,
      {
        monthlyMessageLimit: company.monthlyMessageLimit,
        overagePriceCents: company.overagePriceCents,
      },
    ]),
  );
  const registeredCompanyIds = new Set(companies.map((company) => company.id));
  const usageMap = new Map<string, CompanyUsageMetric>();
  const recentSessions: RecentSession[] = [];
  const trendMap = new Map<string, UsageTrendPoint>();
  const sevenDaysAgo = new Date();
  const currentMonthStart = new Date();
  const nextMonthStart = new Date();

  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  nextMonthStart.setFullYear(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 1);
  nextMonthStart.setHours(0, 0, 0, 0);

  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  for (const company of companies) {
    usageMap.set(
      company.id,
      createCompanyMetric(company.id, company.name, {
        monthlyMessageLimit: company.monthlyMessageLimit,
        overagePriceCents: company.overagePriceCents,
      }),
    );
  }

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = dayKey(date);

    trendMap.set(key, {
      dayKey: key,
      label: trendLabel(date),
      sessions: 0,
      messages: 0,
    });
  }

  let totalSessions = 0;
  let totalMessages = 0;
  let totalPrompts = 0;
  let totalAssistantMessages = 0;
  let sessionsLast7Days = 0;
  let messagesLast7Days = 0;
  let lastActivity: string | null = null;

  for (const log of logs) {
    const messages = normalizeMessages(log.messages);
    const promptCount = messages.filter((message) => message.role === "user").length;
    const assistantMessages = messages.filter((message) => message.role === "assistant").length;
    const sessionLastActivity = resolveLastActivity(messages, log.created_at);
    const effectiveCompanyId = log.company_id ?? "__unassigned__";
    const effectiveCompanyName =
      companyNames.get(effectiveCompanyId) ??
      (log.company_id ? "Empresa removida" : "Sem empresa vinculada");
    const effectiveSettings = companySettings.get(effectiveCompanyId);

    const currentMetric =
      usageMap.get(effectiveCompanyId) ??
      createCompanyMetric(effectiveCompanyId, effectiveCompanyName, effectiveSettings);

    currentMetric.sessions += 1;
    currentMetric.totalMessages += messages.length;
    currentMetric.promptCount += promptCount;
    currentMetric.assistantMessages += assistantMessages;

    if (sessionLastActivity && (!currentMetric.lastActivity || sessionLastActivity > currentMetric.lastActivity)) {
      currentMetric.lastActivity = sessionLastActivity;
    }

    usageMap.set(effectiveCompanyId, currentMetric);

    totalSessions += 1;
    totalMessages += messages.length;
    totalPrompts += promptCount;
    totalAssistantMessages += assistantMessages;

    if (sessionLastActivity && (!lastActivity || sessionLastActivity > lastActivity)) {
      lastActivity = sessionLastActivity;
    }

    if (sessionLastActivity) {
      const activityDate = new Date(sessionLastActivity);

      if (activityDate >= sevenDaysAgo) {
        sessionsLast7Days += 1;
        messagesLast7Days += messages.length;
      }

      if (activityDate >= currentMonthStart && activityDate < nextMonthStart) {
        currentMetric.currentMonthMessages += messages.length;
      }

      const point = trendMap.get(dayKey(activityDate));
      if (point) {
        point.sessions += 1;
        point.messages += messages.length;
      }
    }

    recentSessions.push({
      sessionId: log.session_id,
      companyId: effectiveCompanyId,
      companyName: effectiveCompanyName,
      firstPrompt:
        messages.find((message) => message.role === "user")?.content ?? "Conversa sem pergunta registrada",
      lastActivity: sessionLastActivity,
      totalMessages: messages.length,
      promptCount,
    });
  }

  const companyUsage = Array.from(usageMap.values())
    .map((metric) => {
      const hasLimit = metric.monthlyMessageLimit !== null;
      const overageMessages =
        hasLimit && metric.monthlyMessageLimit !== null
          ? Math.max(metric.currentMonthMessages - metric.monthlyMessageLimit, 0)
          : 0;
      const projectedOverageCents =
        overageMessages > 0 && metric.overagePriceCents !== null
          ? overageMessages * metric.overagePriceCents
          : 0;
      const billingStatus: CompanyUsageMetric["billingStatus"] = !hasLimit
        ? "no_limit"
        : overageMessages > 0
          ? metric.overagePriceCents === null
            ? "limit_without_price"
            : "over_limit"
          : "within_limit";

      return {
        ...metric,
        averageMessagesPerSession: metric.sessions > 0 ? metric.totalMessages / metric.sessions : 0,
        usageShare: totalMessages > 0 ? (metric.totalMessages / totalMessages) * 100 : 0,
        overageMessages,
        projectedOverageCents,
        billingStatus,
      };
    })
    .sort((left, right) => {
      if (right.currentMonthMessages !== left.currentMonthMessages) {
        return right.currentMonthMessages - left.currentMonthMessages;
      }
      if (right.totalMessages !== left.totalMessages) {
        return right.totalMessages - left.totalMessages;
      }
      if (right.promptCount !== left.promptCount) {
        return right.promptCount - left.promptCount;
      }
      return left.companyName.localeCompare(right.companyName, "pt-BR");
    });

  recentSessions.sort((left, right) => {
    const leftTime = left.lastActivity ? new Date(left.lastActivity).getTime() : 0;
    const rightTime = right.lastActivity ? new Date(right.lastActivity).getTime() : 0;
    return rightTime - leftTime;
  });

  const registeredCompanyUsage = companyUsage.filter((metric) =>
    registeredCompanyIds.has(metric.companyId),
  );

  return {
    summary: {
      totalCompanies: companies.length,
      companiesWithUsage: registeredCompanyUsage.filter(
        (metric) => registeredCompanyIds.has(metric.companyId) && metric.sessions > 0,
      ).length,
      inactiveCompanies: registeredCompanyUsage.filter(
        (metric) => registeredCompanyIds.has(metric.companyId) && metric.sessions === 0,
      ).length,
      totalSessions,
      totalMessages,
      totalPrompts,
      totalAssistantMessages,
      sessionsLast7Days,
      messagesLast7Days,
      lastActivity,
      currentMonthLabel: formatCurrentMonthLabel(currentMonthStart),
      currentMonthMessages: registeredCompanyUsage.reduce(
        (total, metric) => total + metric.currentMonthMessages,
        0,
      ),
      companiesWithLimit: registeredCompanyUsage.filter(
        (metric) => metric.monthlyMessageLimit !== null,
      ).length,
      companiesOverLimit: registeredCompanyUsage.filter(
        (metric) => metric.overageMessages > 0,
      ).length,
      totalOverageMessages: registeredCompanyUsage.reduce(
        (total, metric) => total + metric.overageMessages,
        0,
      ),
      totalProjectedOverageCents: registeredCompanyUsage.reduce(
        (total, metric) => total + metric.projectedOverageCents,
        0,
      ),
    },
    companyUsage: registeredCompanyUsage,
    recentSessions: recentSessions.slice(0, 8),
    trend: Array.from(trendMap.values()),
  };
}

export async function listDashboardUsage(): Promise<DashboardUsageData> {
  const [companies, logs] = await Promise.all([listCompanies(), fetchConversationLogs()]);
  return buildUsageData(companies, logs);
}
