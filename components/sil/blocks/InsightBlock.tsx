import type { InsightBlock as InsightBlockType } from "../types";

const STYLES = {
  info: "border-blue-500/40 bg-blue-500/10 text-blue-200",
  success: "border-green-500/40 bg-green-500/10 text-green-200",
  warning: "border-yellow-500/40 bg-yellow-500/10 text-yellow-200",
  danger: "border-red-500/40 bg-red-500/10 text-red-200",
};

export function InsightBlock({ block }: { block: InsightBlockType }) {
  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3 ${STYLES[block.severity]}`}>
      {block.icon && <span className="shrink-0 text-xl">{block.icon}</span>}
      <p className="text-sm leading-6">{block.content}</p>
    </div>
  );
}
