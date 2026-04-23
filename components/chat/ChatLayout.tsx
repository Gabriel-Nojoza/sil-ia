interface ChatLayoutProps {
  header: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function ChatLayout({ header, children, footer, sidebar }: ChatLayoutProps) {
  return (
    <main className="relative h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-[length:42px_42px] opacity-30" />

      <div className="relative flex h-full w-full gap-0">
        {sidebar ? (
          <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border/80 bg-card/60 lg:flex">
            {sidebar}
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {header}
          <section className="flex min-h-0 flex-1 flex-col">{children}</section>
          <div className="border-t border-border/80 p-3 sm:p-5">{footer}</div>
        </div>
      </div>
    </main>
  );
}
