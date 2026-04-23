export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-3xl border border-border/80 bg-card/90 px-4 py-3">
        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted">
          SIL
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}
