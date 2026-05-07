import { KeyboardEvent } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
}: ChatInputProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-[26px] border border-border/80 bg-white/[0.03] p-3 sm:flex-row sm:items-end">
        <label className="sr-only" htmlFor="chat-input">
          Digite sua pergunta
        </label>

        <textarea
          id="chat-input"
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte sobre seus dados..."
          className="min-h-[52px] flex-1 resize-none rounded-2xl border border-transparent bg-transparent px-4 py-3 text-base text-foreground outline-none placeholder:text-muted sm:min-h-[64px] sm:text-sm"
          disabled={disabled}
        />

        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-auto sm:min-w-[132px]"
        >
          {disabled ? "Enviando..." : "Enviar"}
        </button>
      </div>

      <p className="hidden px-1 text-xs text-muted sm:block">
        Enter envia a mensagem. Shift + Enter cria uma nova linha.
      </p>
    </div>
  );
}
