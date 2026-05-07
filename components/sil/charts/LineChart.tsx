"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { ChartData, ChartConfig } from "../types";
import { formatCurrency, formatPercentage, formatNumber, DEFAULT_COLORS } from "@/lib/sil-utils";

interface Props {
  data: ChartData;
  config?: ChartConfig;
}

export function LineChart({ data, config }: Props) {
  if (!data?.labels?.length || !data?.datasets?.length) return null;

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
      <RechartsLineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={formatValue} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={tooltipFormatter}
          contentStyle={{ backgroundColor: "rgba(17,24,39,0.95)", border: "none", borderRadius: 8, color: "#fff" }}
        />
        {(config?.showLegend ?? true) && <Legend />}
        {data.datasets.map((ds, i) => (
          <Line
            key={ds.label}
            type="monotone"
            dataKey={ds.label}
            stroke={ds.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
