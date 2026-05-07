"use client";

import type { ChartBlock as ChartBlockType } from "../types";
import { BarChart } from "../charts/BarChart";
import { HorizontalBarChart } from "../charts/HorizontalBarChart";
import { PieChart } from "../charts/PieChart";
import { LineChart } from "../charts/LineChart";

export function ChartBlock({ block }: { block: ChartBlockType }) {
  const labels = block.data?.labels;
  const datasets = block.data?.datasets;

  if (!Array.isArray(labels) || labels.length === 0 || !Array.isArray(datasets) || datasets.length === 0) {
    return (
      <div className="rounded-xl border border-border/80 bg-card/60 p-4">
        <p className="text-sm text-muted">Dados do gráfico indisponíveis.</p>
      </div>
    );
  }

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
