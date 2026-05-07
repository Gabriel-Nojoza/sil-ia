"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartData, ChartConfig } from "../types";
import { formatCurrency, formatPercentage, formatNumber, DEFAULT_COLORS } from "@/lib/sil-utils";

interface Props {
  data: ChartData;
  config?: ChartConfig;
}

export function PieChart({ data, config }: Props) {
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
      <RechartsPieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={tooltipFormatter}
          contentStyle={{ backgroundColor: "rgba(17,24,39,0.95)", border: "none", borderRadius: 8, color: "#fff" }}
        />
        {(config?.showLegend ?? true) && <Legend />}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
