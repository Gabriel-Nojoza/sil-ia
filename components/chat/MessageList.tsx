import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import type { ChatMessage } from "@/types/chat";

interface MessageListProps {
  messages: ChatMessage[];
  isSending: boolean;
  error: string | null;
}

export function MessageList({ messages, isSending, error }: MessageListProps) {
  const isEmpty = messages.length === 0;

  return (
    <div className="chat-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6">
      {isEmpty ? (
        <div className="flex h-full min-h-[420px] items-center justify-center">
          <div className="max-w-xl rounded-[32px] border border-border/80 bg-white/[0.03] p-8 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-accent/90">
              Conversa inteligente
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-foreground">
              Pergunte sobre seus dados com contexto multiempresa
            </h2>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isSending ? <TypingIndicator /> : null}

          {error ? (
            <div className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
