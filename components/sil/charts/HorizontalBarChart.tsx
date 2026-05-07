"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { ChartData, ChartConfig } from "../types";
import { formatCurrency, formatPercentage, formatNumber, DEFAULT_COLORS } from "@/lib/sil-utils";

interface Props {
  data: ChartData;
  config?: ChartConfig;
}

export function HorizontalBarChart({ data, config }: Props) {
  if (!data?.labels?.length || !data?.datasets?.length) return null;

  const chartData = data.labels.map((label, i) => ({
    name: label,
    value: data.datasets[0]?.values[i] ?? 0,
  }));

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
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal vertical={false} />
        <XAxis
          type="number"
          tickFormatter={formatValue}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }}
        />
        <YAxis
          dataKey="name"
          type="category"
          width={140}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }}
        />
        <Tooltip
          formatter={tooltipFormatter}
          contentStyle={{ backgroundColor: "rgba(17,24,39,0.95)", border: "none", borderRadius: 8, color: "#fff" }}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        {(config?.showLegend ?? true) && (
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="square"
            wrapperStyle={{ paddingTop: 12, fontSize: "12px", color: "#94a3b8" }}
          />
        )}
        {config?.referenceLine && (
          <ReferenceLine
            x={config.referenceLine.value}
            stroke={config.referenceLine.color ?? "#ef4444"}
            strokeDasharray="3 3"
            label={{ value: config.referenceLine.label, position: "top", fontSize: 11, fill: "#9ca3af" }}
          />
        )}
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={data.datasets[0]?.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
