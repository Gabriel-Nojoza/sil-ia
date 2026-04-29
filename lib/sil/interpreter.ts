export interface Intent {
  metric: string;
  metricLabel: string;
  daxMeasure: string;
  dimension:
    | "geral"
    | "mes"
    | "filial"
    | "fornecedor"
    | "pedido"
    | "vendedor"
    | "supervisor"
    | "gerente"
    | "cliente"
    | "regional"
    | "produto";
  dimensionColumn: string | null;
  period: number;
  topN: number | null;
}

interface MetricCatalogEntry {
  id: string;
  label: string;
  measure: string;
  keys: string[];
}

interface DimensionCatalogEntry {
  dim: Intent["dimension"];
  column: string | null;
  keys: string[];
}

interface GroqIntentPayload {
  metric?: string;
  dimension?: Intent["dimension"];
  period?: number | null;
  topN?: number | null;
}

const METRIC_MAP: MetricCatalogEntry[] = [
  { id: "venda_bruta", keys: ["venda bruta", "vb"], label: "Venda Bruta", measure: "[Vl Faturados']" },
  { id: "percentual_meta", keys: ["% meta", "percentual da meta", "percentual meta", "pct meta", "percent meta"], label: "% Meta", measure: "[% Meta']" },
  { id: "pedidos_enviados", keys: ["pedidos enviados", "pedido enviado", "enviados"], label: "Pedidos Env", measure: "[Pedidos Enviados - Dev.']" },
  { id: "qtde_pedidos", keys: ["quantidade de pedidos", "qtde pedidos", "qtd pedidos", "num pedidos", "numero de pedidos", "qtde de pedidos"], label: "Qtde Pedidos", measure: "[Qtde de Pedidos']" },
  { id: "ticket_medio", keys: ["ticket medio", "ticket medios", "tiquete medio", "tiquete", "ticket"], label: "Tiquete Medio", measure: "[Tiquet Medio']" },
  { id: "percentual_margem", keys: ["% margem", "margem"], label: "% Margem", measure: "[% Margem']" },
  { id: "meta", keys: ["meta"], label: "Meta", measure: "[Meta]" },
  { id: "lucro", keys: ["lucro"], label: "Lucro", measure: "[Lucro]" },
  { id: "devolucao", keys: ["devolucao", "devolucoes", "dev"], label: "Devolucao", measure: "[Vl Devolução']" },
  { id: "desconto", keys: ["desconto"], label: "Desconto", measure: "[Desconto]" },
  { id: "novos_clientes", keys: ["novos clientes"], label: "Novos Clientes", measure: "[Novos Clientes']" },
  { id: "clientes_recorrentes", keys: ["clientes recorrentes"], label: "Clientes Recorrentes", measure: "[Clientes Recorrentes']" },
  { id: "qtde_clientes", keys: ["quantidade de clientes", "qtde clientes", "qtd clientes"], label: "Qtde Clientes", measure: "[Qtde Clientes']" },
  { id: "qtde_produtos", keys: ["quantidade de produtos", "qtde produtos", "qtd produtos"], label: "Qtde Produtos", measure: "[Qtde Produtos']" },
  { id: "mix_medio", keys: ["mix medio", "mix médio", "mix"], label: "Mix Medio", measure: "[Mix Medio']" },
  { id: "faturamento", keys: ["faturamento"], label: "Faturamento", measure: "[Vl Faturados']" },
  { id: "vendas", keys: ["vendas", "venda"], label: "Venda", measure: "[Venda]" },
];

const DIMENSION_MAP: DimensionCatalogEntry[] = [
  { keys: ["por mes", "mensal", "mes a mes", "mensalmente", "por meses", "mes"], dim: "mes", column: "Calendariod[MesAbre]" },
  { keys: ["por vendedor", "por vendedores", "vendedor", "vendedores", "por rca", "rca", "representante", "consultor"], dim: "vendedor", column: "Vendedores[NOME]" },
  { keys: ["por supervisor", "por supervisores", "supervisor", "supervisores"], dim: "supervisor", column: "Supervisor[NOME]" },
  { keys: ["por gerente", "por gerentes", "gerente", "gerentes"], dim: "gerente", column: "Gerente[NOMEGERENTE]" },
  { keys: ["por cliente", "por clientes", "cliente", "clientes"], dim: "cliente", column: "PCCLIENTE[CLIENTE]" },
  { keys: ["por produto", "por produtos", "produto", "produtos", "sku", "skus"], dim: "produto", column: "PCPRODUTOS[DESCRICAO]" },
  { keys: ["por filial", "por loja", "filial", "loja", "filiais", "lojas"], dim: "filial", column: "'Nome Filial'[Filial]" },
  { keys: ["por fornecedor", "fornecedor", "fornecedores"], dim: "fornecedor", column: "'PCFORNEC'[Cod/Forn.]" },
  { keys: ["por regional", "regional", "regionais"], dim: "regional", column: "Supervisor[REGIONAL]" },
  { keys: ["por pedido", "por pedidos", "pedido", "pedidos"], dim: "pedido", column: "PEDIDOS[NUMPED]" },
];

const METRIC_BY_ID = new Map(METRIC_MAP.map((entry) => [entry.id, entry]));
const DIMENSION_BY_ID = new Map(DIMENSION_MAP.map((entry) => [entry.dim, entry]));

const CHART_KEYWORDS = [
  "grafico",
  "grafico de",
  "gera o grafico",
  "gera grafico",
  "mostra em grafico",
  "mostre em grafico",
  "me mostra",
  "quero ver",
  "deixa eu ver",
  "pode mostrar",
  "visual",
  "chart",
  "barra",
  "pizza",
  "linha",
];

function currentYear() {
  return new Date().getFullYear();
}

function detectMetric(normalized: string): MetricCatalogEntry {
  for (const entry of METRIC_MAP) {
    if (entry.keys.some((key) => normalized.includes(normalizeText(key)))) {
      return entry;
    }
  }

  return METRIC_MAP[METRIC_MAP.length - 1];
}

function detectDimension(
  normalized: string,
  metricEntry: MetricCatalogEntry,
): DimensionCatalogEntry {
  const isPedidoMetric =
    metricEntry.measure === "[Pedidos Enviados - Dev.]" ||
    metricEntry.measure === "[Qtde Pedidos]";

  for (const entry of DIMENSION_MAP) {
    if (entry.dim === "pedido" && isPedidoMetric) {
      continue;
    }

    if (entry.keys.some((key) => normalized.includes(normalizeText(key)))) {
      return entry;
    }
  }

  return { dim: "geral", column: null, keys: [] };
}

function parsePeriod(normalized: string): number {
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  return yearMatch ? Number.parseInt(yearMatch[1], 10) : currentYear();
}

function parseTopN(normalized: string): number | null {
  const topMatch = normalized.match(/\btop\s*(\d+)\b/);
  return topMatch ? Number.parseInt(topMatch[1], 10) : null;
}

function buildIntent(
  metricEntry: MetricCatalogEntry,
  dimensionEntry: DimensionCatalogEntry,
  period: number,
  topN: number | null,
): Intent {
  return {
    metric: metricEntry.id,
    metricLabel: metricEntry.label,
    daxMeasure: metricEntry.measure,
    dimension: dimensionEntry.dim,
    dimensionColumn: dimensionEntry.column,
    period,
    topN,
  };
}

async function interpretWithGroq(message: string): Promise<Intent | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const supportedMetrics = METRIC_MAP.map((entry) => entry.id).join(", ");
  const supportedDimensions = ["geral", ...DIMENSION_MAP.map((entry) => entry.dim)].join(", ");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: [
            "Voce classifica perguntas de BI e responde apenas JSON puro.",
            `metric deve ser uma destas chaves: ${supportedMetrics}.`,
            `dimension deve ser uma destas chaves: ${supportedDimensions}.`,
            "Se nao houver comparacao explicita, use dimension=geral.",
            "period deve ser um ano com 4 digitos quando presente; se ausente, use null.",
            "topN deve ser numero inteiro quando houver pedido top N; se ausente, use null.",
            'Formato exato: {"metric":"vendas","dimension":"vendedor","period":2026,"topN":5}.',
          ].join(" "),
        },
        {
          role: "user",
          content: message,
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Groq respondeu ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return null;
  }

  let parsed: GroqIntentPayload | null = null;

  try {
    parsed = JSON.parse(content) as GroqIntentPayload;
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    try {
      parsed = JSON.parse(jsonMatch[0]) as GroqIntentPayload;
    } catch {
      return null;
    }
  }

  const metricEntry = METRIC_BY_ID.get(parsed?.metric ?? "") ?? detectMetric(normalizeText(message));
  const dimensionEntry =
    DIMENSION_BY_ID.get(parsed?.dimension ?? "geral") ??
    detectDimension(normalizeText(message), metricEntry);
  const period =
    typeof parsed?.period === "number" && Number.isFinite(parsed.period)
      ? parsed.period
      : parsePeriod(normalizeText(message));
  const topN =
    typeof parsed?.topN === "number" && Number.isFinite(parsed.topN)
      ? parsed.topN
      : parseTopN(normalizeText(message));

  return buildIntent(metricEntry, dimensionEntry, period, topN);
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function isChartRequest(message: string): boolean {
  const normalized = normalizeText(message);
  return CHART_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function interpret(message: string): Intent {
  const normalized = normalizeText(message);
  const metricEntry = detectMetric(normalized);
  const dimensionEntry = detectDimension(normalized, metricEntry);
  const period = parsePeriod(normalized);
  const topN = parseTopN(normalized);

  return buildIntent(metricEntry, dimensionEntry, period, topN);
}

export async function resolveIntent(message: string): Promise<Intent> {
  try {
    const groqIntent = await interpretWithGroq(message);
    if (groqIntent) {
      return groqIntent;
    }
  } catch (error) {
    console.error(
      "[sil/interpreter] Groq indisponivel, usando interpretacao local:",
      error instanceof Error ? error.message : error,
    );
  }

  return interpret(message);
}
