"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { ChatMessage } from "@/types/chat";

interface Session {
  session_id: string;
  first_message: string;
  created_at: string;
}

interface HistorySidebarProps {
  userId: string;
  currentSessionId: string;
  refreshTick?: number;
  onSelectSession: (sessionId: string, messages: ChatMessage[]) => void;
  onNewChat: () => void;
}

export function HistorySidebar({ userId, currentSessionId, refreshTick, onSelectSession, onNewChat }: HistorySidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadSessions(showSpinner = true) {
    if (!userId) return;
    if (showSpinner) setLoading(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { data } = await supabase
        .from("conversation_logs")
        .select("session_id, messages, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!data) { setSessions([]); return; }

      const seen = new Set<string>();
      const grouped: Session[] = [];
      for (const row of data) {
        if (seen.has(row.session_id)) continue;
        seen.add(row.session_id);
        const msgs: ChatMessage[] = Array.isArray(row.messages) ? row.messages : [];
        const first = msgs.find((m) => m.role === "user")?.content ?? "Nova conversa";
        grouped.push({ session_id: row.session_id, first_message: first, created_at: row.created_at });
      }
      setSessions(grouped);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadSessions(true); }, [userId]);
  useEffect(() => { if (refreshTick) void loadSessions(false); }, [refreshTick]);

  async function handleDelete(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const supabase = getSupabaseBrowserClient();
    await supabase.from("conversation_logs").delete().eq("session_id", sessionId).eq("user_id", userId);
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    if (sessionId === currentSessionId) onNewChat();
  }

  async function handleSelect(sessionId: string) {
    if (sessionId === currentSessionId) return;
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("conversation_logs")
      .select("messages")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const msgs: ChatMessage[] = (data ?? []).flatMap((r) =>
      Array.isArray(r.messages) ? r.messages : []
    );
    onSelectSession(sessionId, msgs);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/80 px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent/90">Histórico</p>
        <button
          type="button"
          onClick={onNewChat}
          className="mt-3 flex w-full items-center gap-2 rounded-xl border border-border/80 bg-white/5 px-3 py-2.5 text-sm text-foreground transition hover:border-accent/50 hover:bg-accent/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nova conversa
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <p className="px-4 py-3 text-xs text-muted">Carregando...</p>
        ) : sessions.length === 0 ? (
          <p className="px-4 py-3 text-xs text-muted">Nenhuma conversa ainda.</p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.session_id}
              className={`group relative flex items-center transition hover:bg-white/5 ${
                s.session_id === currentSessionId ? "bg-accent/10 border-l-2 border-accent" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelect(s.session_id)}
                className="min-w-0 flex-1 px-4 py-3 text-left"
              >
                <p className="truncate text-sm text-foreground">{s.first_message}</p>
                <p className="mt-0.5 text-xs text-muted">{formatDate(s.created_at)}</p>
              </button>
              <button
                type="button"
                onClick={(e) => handleDelete(s.session_id, e)}
                className="mr-2 hidden shrink-0 rounded p-1 text-muted transition hover:text-red-400 group-hover:flex"
                title="Apagar conversa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
