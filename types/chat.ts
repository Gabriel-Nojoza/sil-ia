import type { SilResponse } from "@/components/sil/types";

export type MessageRole = "user" | "assistant";

export type MessageStatus = "idle" | "sending" | "sent" | "error";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  status?: MessageStatus;
  silResponse?: SilResponse;
}

export interface ChatHistoryEntry {
  role: MessageRole;
  content: string;
}

export interface ChatRequestPayload {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  user_role: UserRole;
  chatInput: string;
  company_id: string;
  company_name: string;
  workspace_id?: string;
  dataset_id?: string;
  webhook_url?: string;
  history?: ChatHistoryEntry[];
}

export interface ChatResponse {
  message: ChatMessage;
  raw?: unknown;
}

export interface CompanyContext {
  companyId: string;
  companyName: string;
  workspaceId?: string;
  datasetId?: string;
  webhookUrl?: string;
}

export type UserRole = "user" | "admin";

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  webhookUrl?: string;
  company: CompanyContext;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}
