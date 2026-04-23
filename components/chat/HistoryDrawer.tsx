"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { ChatMessage } from "@/types/chat";

interface Session {
  session_id: string;
  first_message: string;
  created_at: string;
}

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSelectSession: (sessionId: string, messages: ChatMessage[]) => void;
}

export function HistoryDrawer({ open, onClose, userId, onSelectSession }: HistoryDrawerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("conversation_logs")
      .select("session_id, messages, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) {
          const seen = new Set<string>();
          const grouped: Session[] = [];
          for (const row of data) {
            if (seen.has(row.session_id)) continue;
            seen.add(row.session_id);
            const msgs: ChatMessage[] = Array.isArray(row.messages) ? row.messages : [];
            const first = msgs.find((m) => m.role === "user")?.content ?? "Conversa";
            grouped.push({ session_id: row.session_id, first_message: first, created_at: row.created_at });
          }
          setSessions(grouped);
        }
        setLoading(false);
      });
  }, [open, userId]);

  async function handleSelect(sessionId: string) {
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
    onClose();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-80 flex-col border-r border-border/80 bg-card shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
          <h2 className="font-semibold text-foreground">Histórico</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {loading ? (
            <p className="px-5 text-sm text-muted">Carregando...</p>
          ) : sessions.length === 0 ? (
            <p className="px-5 text-sm text-muted">Nenhuma conversa salva ainda.</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.session_id}
                type="button"
                onClick={() => handleSelect(s.session_id)}
                className="w-full px-5 py-3 text-left transition hover:bg-white/5"
              >
                <p className="truncate text-sm font-medium text-foreground">{s.first_message}</p>
                <p className="mt-0.5 text-xs text-muted">{formatDate(s.created_at)}</p>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
