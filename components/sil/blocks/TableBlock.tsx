import type { TableBlock as TableBlockType } from "../types";

const HIGHLIGHT_CLASS = {
  success: "bg-green-500/20 text-green-300",
  warning: "bg-yellow-500/20 text-yellow-300",
  danger: "bg-red-500/20 text-red-300",
};

export function TableBlock({ block }: { block: TableBlockType }) {
  function cellClass(rowIdx: number, colIdx: number) {
    const h = block.highlights?.find((x) => x.rowIndex === rowIdx && x.colIndex === colIdx);
    return h ? HIGHLIGHT_CLASS[h.style] : "";
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 overflow-hidden">
      {block.title && (
        <div className="border-b border-border/80 px-4 py-2">
          <h4 className="text-sm font-semibold text-foreground">{block.title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              {block.headers.map((h, i) => (
                <th key={i} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-t border-border/40">
                {row.map((cell, colIdx) => (
                  <td key={colIdx} className={`px-4 py-2 text-sm text-foreground ${cellClass(rowIdx, colIdx)}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
