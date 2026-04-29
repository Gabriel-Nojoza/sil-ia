import { Target } from "lucide-react";
import type { ActionBlock as ActionBlockType } from "../types";

export function ActionBlock({ block }: { block: ActionBlockType }) {
  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Target className="h-4 w-4 shrink-0 text-accent" />
        <h4 className="text-sm font-semibold text-foreground">{block.title}</h4>
      </div>
      <ul className="space-y-2">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted">
            <span className="shrink-0 text-accent">{i + 1}.</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
