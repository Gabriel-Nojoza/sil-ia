export interface UsageTrendPoint {
  dayKey: string;
  label: string;
  sessions: number;
  messages: number;
}

export interface RecentSession {
  sessionId: string;
  companyId: string;
  companyName: string;
  firstPrompt: string;
  lastActivity: string | null;
  totalMessages: number;
  promptCount: number;
}

export interface CompanyUsageMetric {
  companyId: string;
  companyName: string;
  sessions: number;
  totalMessages: number;
  promptCount: number;
  assistantMessages: number;
  averageMessagesPerSession: number;
  usageShare: number;
  lastActivity: string | null;
  currentMonthMessages: number;
  monthlyMessageLimit: number | null;
  overagePriceCents: number | null;
  overageMessages: number;
  projectedOverageCents: number;
  billingStatus: "no_limit" | "within_limit" | "over_limit" | "limit_without_price";
}

export interface DashboardUsageSummary {
  totalCompanies: number;
  companiesWithUsage: number;
  inactiveCompanies: number;
  totalSessions: number;
  totalMessages: number;
  totalPrompts: number;
  totalAssistantMessages: number;
  sessionsLast7Days: number;
  messagesLast7Days: number;
  lastActivity: string | null;
  currentMonthLabel: string;
  currentMonthMessages: number;
  companiesWithLimit: number;
  companiesOverLimit: number;
  totalOverageMessages: number;
  totalProjectedOverageCents: number;
}

export interface DashboardUsageData {
  summary: DashboardUsageSummary;
  companyUsage: CompanyUsageMetric[];
  recentSessions: RecentSession[];
  trend: UsageTrendPoint[];
}
