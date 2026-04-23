import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const statusLabel =
    message.status === "sending"
      ? "Enviando..."
      : message.status === "error"
        ? "Erro ao enviar"
        : null;

  return (
    <article
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
      aria-live="polite"
    >
      <div
        className={`max-w-[88%] rounded-3xl border px-4 py-3 shadow-lg sm:max-w-[75%] sm:px-5 ${
          isUser
            ? "border-accent/40 bg-accent/15 text-foreground"
            : "border-border/80 bg-card/90 text-foreground"
        }`}
      >
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
          <span>{isUser ? "Você" : "SIL"}</span>
          {statusLabel ? <span className="text-accent">{statusLabel}</span> : null}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-7 sm:text-[15px]">
          {message.content}
        </p>
      </div>
    </article>
  );
}
