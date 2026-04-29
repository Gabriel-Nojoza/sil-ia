import type { ChartBlock as ChartBlockType } from "../types";
import { BarChart } from "../charts/BarChart";
import { HorizontalBarChart } from "../charts/HorizontalBarChart";
import { PieChart } from "../charts/PieChart";
import { LineChart } from "../charts/LineChart";

export function ChartBlock({ block }: { block: ChartBlockType }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/60 p-4">
      <h4 className="mb-3 text-sm font-semibold text-foreground">{block.title}</h4>
      {block.chartType === "bar" && <BarChart data={block.data} config={block.config} />}
      {block.chartType === "horizontal-bar" && <HorizontalBarChart data={block.data} config={block.config} />}
      {block.chartType === "pie" && <PieChart data={block.data} config={block.config} />}
      {block.chartType === "line" && <LineChart data={block.data} config={block.config} />}
    </div>
  );
}
