"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ChartData, ChartConfig } from "../types";
import { formatCurrency, formatPercentage, formatNumber, DEFAULT_COLORS } from "@/lib/sil-utils";

interface Props {
  data: ChartData;
  config?: ChartConfig;
}

export function BarChart({ data, config }: Props) {
  const chartData = data.labels.map((label, i) => {
    const row: Record<string, string | number> = { name: label };
    data.datasets.forEach((ds) => { row[ds.label] = ds.values[i] ?? 0; });
    return row;
  });

  const formatValue = (val: number) => {
    if (config?.currency) return formatCurrency(val);
    if (config?.percentage) return formatPercentage(val);
    return formatNumber(val);
  };

  const tooltipFormatter = (val: unknown) => {
    const numeric = typeof val === "number" ? val : Number(val ?? 0);
    return [formatValue(Number.isFinite(numeric) ? numeric : 0)];
  };

  return (
    <ResponsiveContainer width="100%" height={config?.height ?? 300}>
      <RechartsBarChart data={chartData}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={formatValue} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={tooltipFormatter}
          contentStyle={{ backgroundColor: "rgba(17,24,39,0.95)", border: "none", borderRadius: 8, color: "#fff" }}
        />
        {(config?.showLegend ?? true) && <Legend />}
        {config?.referenceLine && (
          <ReferenceLine
            y={config.referenceLine.value}
            stroke={config.referenceLine.color ?? "#ef4444"}
            strokeDasharray="3 3"
            label={{ value: config.referenceLine.label, fontSize: 11, fill: "#9ca3af" }}
          />
        )}
        {data.datasets.map((ds, i) => (
          <Bar key={ds.label} dataKey={ds.label} fill={ds.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
