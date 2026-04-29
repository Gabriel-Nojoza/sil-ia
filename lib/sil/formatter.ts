import type { SilResponse } from "@/components/sil/types";
import { formatCurrencyFull, formatNumber, formatPercentage } from "@/lib/sil-utils";
import type { Intent } from "./interpreter";
import { normalizeText } from "./interpreter";

export type PowerBiRow = Record<string, unknown>;

interface BuildSilResponseOptions {
  chartRequested?: boolean;
}

const DIMENSION_LABEL: Record<Exclude<Intent["dimension"], "geral">, string> = {
  mes: "por mes",
  filial: "por filial",
  fornecedor: "por fornecedor",
  pedido: "por pedido",
  vendedor: "por vendedor",
  supervisor: "por supervisor",
  gerente: "por gerente",
  cliente: "por cliente",
  regional: "por regional",
  produto: "por produto",
};

const PERSON_DIMENSIONS = new Set<Intent["dimension"]>([
  "vendedor",
  "supervisor",
  "gerente",
]);

function numericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = Number(value.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

function isPercentageMetric(intent: Intent) {
  return intent.metricLabel.includes("%");
}

function isCurrencyMetric(intent: Intent) {
  return !isPercentageMetric(intent) && !intent.metricLabel.toLowerCase().includes("qtde");
}

function formatMetricValue(value: number, intent: Intent) {
  if (isPercentageMetric(intent)) {
    return formatPercentage(value);
  }

  if (isCurrencyMetric(intent)) {
    return formatCurrencyFull(value);
  }

  return formatNumber(value);
}

function findMetricKey(row: PowerBiRow, intent: Intent): string {
  const keys = Object.keys(row);
  const exactMatch = keys.find(
    (key) => normalizeText(key) === normalizeText(intent.metricLabel),
  );

  if (exactMatch) {
    return exactMatch;
  }

  const firstNumericKey = keys.find((key) => numericValue(row[key]) !== null);
  return firstNumericKey ?? keys[0] ?? intent.metricLabel;
}

function findDimensionKey(row: PowerBiRow, metricKey: string): string | null {
  const keys = Object.keys(row).filter((key) => key !== metricKey);
  return keys[0] ?? null;
}

function truncateLabel(value: string) {
  return value.length > 42 ? `${value.slice(0, 39)}...` : value;
}

function buildNoDataResponse(intent: Intent): { message: string; response: SilResponse } {
  const message = "Nao encontrei dados para essa consulta.";

  return {
    message,
    response: {
      blocks: [
        { type: "text", content: `**Sem dados**\n\n${message}` },
        {
          type: "insight",
          severity: "warning",
          icon: "!",
          content: `Tente refinar a pergunta com uma dimensao, por exemplo ${intent.metricLabel.toLowerCase()} por vendedor ou por mes.`,
        },
      ],
      metadata: {
        queryType: `${intent.metric}:${intent.dimension}`,
        dataPoints: 0,
      },
    },
  };
}

export function buildSilResponse(
  rows: PowerBiRow[],
  intent: Intent,
  options: BuildSilResponseOptions = {},
): { message: string; response: SilResponse } {
  if (!rows || rows.length === 0) {
    return buildNoDataResponse(intent);
  }

  const metricKey = findMetricKey(rows[0], intent);
  const metricLabel = metricKey || intent.metricLabel;

  if (intent.dimension === "geral") {
    const row = rows[0];
    const value = numericValue(row[metricKey]) ?? 0;
    const message = `${intent.metricLabel}: ${formatMetricValue(value, intent)}`;
    const blocks: SilResponse["blocks"] = [
      { type: "text", content: `**${intent.metricLabel}**\n\n${formatMetricValue(value, intent)}` },
    ];

    if (options.chartRequested) {
      blocks.push({
        type: "insight",
        severity: "info",
        icon: "i",
        content:
          "Para montar um grafico, eu preciso de uma consulta com comparacao, por exemplo vendas por vendedor, por mes ou por filial.",
      });
    }

    return {
      message,
      response: {
        blocks,
        metadata: {
          queryType: `${intent.metric}:${intent.dimension}`,
          dataPoints: 1,
        },
      },
    };
  }

  const dimensionKey = findDimensionKey(rows[0], metricKey);
  if (!dimensionKey) {
    return buildNoDataResponse(intent);
  }

  const normalizedRows = rows
    .map((row) => ({
      label: truncateLabel(String(row[dimensionKey] ?? "-")),
      value: numericValue(row[metricKey]) ?? 0,
    }))
    .filter((row) => row.label && Number.isFinite(row.value));

  if (normalizedRows.length === 0) {
    return buildNoDataResponse(intent);
  }

  const visibleRows = normalizedRows.slice(0, intent.topN ?? 8);
  const sortedRows = [...visibleRows].sort((left, right) => right.value - left.value);
  const topRow = sortedRows[0];
  const bottomRow = sortedRows[sortedRows.length - 1];
  const chartType = intent.dimension === "mes" ? "line" : "horizontal-bar";
  const summaryPrefix = options.chartRequested ? "Aqui esta o grafico" : "Montei uma leitura visual";
  const message = `${summaryPrefix} de ${intent.metricLabel.toLowerCase()} ${DIMENSION_LABEL[intent.dimension]}.`;

  const blocks: SilResponse["blocks"] = [
    {
      type: "text",
      content: `**${intent.metricLabel} ${DIMENSION_LABEL[intent.dimension]}**\n\n${message}`,
    },
    {
      type: "chart",
      chartType,
      title: `${intent.metricLabel} ${DIMENSION_LABEL[intent.dimension]}`,
      data: {
        labels: visibleRows.map((row) => row.label),
        datasets: [
          {
            label: intent.metricLabel,
            values: visibleRows.map((row) => row.value),
          },
        ],
      },
      config: {
        currency: isCurrencyMetric(intent),
        percentage: isPercentageMetric(intent),
        showLegend: false,
        height: intent.dimension === "mes" ? 320 : Math.max(320, visibleRows.length * 46),
      },
    },
    {
      type: "table",
      title: "Detalhamento",
      headers: [dimensionKey, metricLabel],
      rows: visibleRows.map((row) => [row.label, formatMetricValue(row.value, intent)]),
    },
  ];

  if (topRow) {
    let insight = `${topRow.label} lidera com ${formatMetricValue(topRow.value, intent)}.`;

    if (bottomRow && bottomRow.label !== topRow.label) {
      const gap = topRow.value - bottomRow.value;
      insight += ` O menor valor visivel e ${bottomRow.label}, com uma diferenca de ${formatMetricValue(gap, intent)} para o lider.`;
    }

    blocks.push({
      type: "insight",
      severity: PERSON_DIMENSIONS.has(intent.dimension) ? "success" : "info",
      icon: PERSON_DIMENSIONS.has(intent.dimension) ? "*" : "i",
      content: insight,
    });
  }

  return {
    message,
    response: {
      blocks,
      metadata: {
        queryType: `${intent.metric}:${intent.dimension}`,
        dataPoints: visibleRows.length,
      },
    },
  };
}
