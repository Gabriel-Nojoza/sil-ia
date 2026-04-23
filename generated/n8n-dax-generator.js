// ============================================================
// DAX Generator — n8n Code Node
// Dataset: JA DIRETORIA AUTOMACAO
// Recebe: $json.plan (do AI Query Planner)
// Retorna: { ...tudo anterior, daxQuery: "EVALUATE ..." }
// ============================================================

// ---------- MAPA DE DIMENSOES ----------
// palavra-chave em português → tabela real e coluna de display no Power BI
const DIM = {
  supervisor:  { table: "Supervisor",      col: "NOME",       code: "CODSUPERVISOR" },
  supervisores:{ table: "Supervisor",      col: "NOME",       code: "CODSUPERVISOR" },
  gerente:     { table: "Gerente",         col: "NOMEGERENTE",code: "CODGERENTE"    },
  gerentes:    { table: "Gerente",         col: "NOMEGERENTE",code: "CODGERENTE"    },
  vendedor:    { table: "Dbase vendedor",  col: "Cod Vendedor",code:"Cod Vendedor"  },
  vendedores:  { table: "Dbase vendedor",  col: "Cod Vendedor",code:"Cod Vendedor"  },
  cliente:     { table: "PCCLIENTE",       col: "CLIENTE",    code: "CODCLI"        },
  clientes:    { table: "PCCLIENTE",       col: "CLIENTE",    code: "CODCLI"        },
  produto:     { table: "PCPRODUTOS",      col: "DESCRICAO",  code: "CODPROD"       },
  produtos:    { table: "PCPRODUTOS",      col: "DESCRICAO",  code: "CODPROD"       },
  filial:      { table: "Nome Filial",     col: "Filial",     code: "Cod"           },
  filiais:     { table: "Nome Filial",     col: "Filial",     code: "Cod"           },
  regional:    { table: "Supervisor",      col: "REGIONAL",   code: "REGIONAL"      },
  coordenador: { table: "Supervisor",      col: "NOME",       code: "CODCOORDENADOR"},
};

// ---------- MAPA DE MEDIDAS ----------
// palavra-chave → nome exato da medida na tabela [Medidas] do Power BI
const MED = {
  "venda":                 "Venda",
  "vendas":                "Venda",
  "faturamento":           "Vl Faturados'",
  "faturado":              "Vl Faturados'",
  "vl faturados":          "Vl Faturados'",
  "meta":                  "Meta",
  "% meta":                "% Meta'",
  "percentual meta":       "% Meta'",
  "atingimento":           "% Meta'",
  "lucro":                 "Lucro",
  "vl lucro":              "Vl Lucro'",
  "margem":                "% Margem'",
  "% margem":              "% Margem'",
  "ticket":                "Tiquet Medio'",
  "tiquet":                "Tiquet Medio'",
  "ticket medio":          "Tiquet Medio'",
  "tiquet medio":          "Tiquet Medio'",
  "qtde clientes":         "Qtde Clientes'",
  "qtde produtos":         "Qtde Produtos'",
  "desconto":              "Desconto",
  "tendencia":             "% Tendencia Ped.'",
  "tendência":             "% Tendencia Ped.'",
  "% tendencia":           "% Tendencia Ped.'",
  "$ tendencia":           "$ Tendencia Ped.'",
  "tendencia valor":       "$ Tendencia Ped.'",
  "evolucao":              "Evolução",
  "evolução":              "Evolução",
  "venda aa":              "Venda AA'",
  "venda ano anterior":    "Venda AA'",
  "venda mes anterior":    "Venda Mês ant'",
  "bonificacao":           "Bonificação",
  "bonificação":           "Bonificação",
  "% bonificacao":         "% Bonificacao'",
  "novos clientes":        "Novos Clientes'",
  "clientes recorrentes":  "Clientes Recorrentes'",
  "mix medio":             "Mix Medio'",
  "devolucao":             "Vl Devolução'",
  "devolução":             "Vl Devolução'",
};

// ---------- FILTROS ESPECIAIS ----------
// campo de filtro → tabela e coluna reais no Power BI
const FILTER_MAP = {
  filial:      { table: "Nome Filial", col: "Cod"           },
  filiais:     { table: "Nome Filial", col: "Cod"           },
  gerente:     { table: "Gerente",     col: "CODGERENTE"    },
  supervisor:  { table: "Supervisor",  col: "CODSUPERVISOR" },
  regional:    { table: "Supervisor",  col: "REGIONAL"      },
  produto:     { table: "PCPRODUTOS",  col: "CODPROD"       },
  cliente:     { table: "PCCLIENTE",   col: "CODCLI"        },
};

// ============================================================
// UTILITÁRIOS
// ============================================================

function escapeTableName(name) {
  // Tabelas com espaço precisam de apóstrofos: 'Nome Filial'
  return name.includes(" ") ? `'${name}'` : name;
}

function resolveMeasure(keyword) {
  const k = (keyword || "").toLowerCase().trim();
  return MED[k] || null;
}

function resolveDimension(keyword) {
  const k = (keyword || "").toLowerCase().trim();
  return DIM[k] || null;
}

// ============================================================
// GERA DAX
// ============================================================

function buildDAX(plan) {
  // --- 1. Resolver dimensão principal ---
  const dimInfo = resolveDimension(plan.dimension);
  if (!dimInfo) {
    throw new Error(`Dimensão desconhecida: "${plan.dimension}". Dimensões válidas: ${Object.keys(DIM).join(", ")}`);
  }
  const dimTable = escapeTableName(dimInfo.table);
  const dimCol   = dimInfo.col;

  // --- 2. Resolver medidas ---
  const metrics = (plan.metrics || []);
  const resolvedMetrics = [];
  for (const m of metrics) {
    const measureName = resolveMeasure(m);
    if (!measureName) {
      // tenta usar o nome diretamente (usuário pode ter passado o nome exato)
      resolvedMetrics.push({ label: m, dax: `[${m}]` });
    } else {
      resolvedMetrics.push({ label: m, dax: `[${measureName}]` });
    }
  }

  // fallback: se não veio nenhuma métrica, usa Venda
  if (resolvedMetrics.length === 0) {
    resolvedMetrics.push({ label: "venda", dax: "[Venda]" });
  }

  // --- 3. Resolver filtros ---
  const filters = (plan.filters || []);
  const filterClauses = [];
  for (const f of filters) {
    const field = (f.field || "").toLowerCase().trim();
    const value = f.value;
    const fInfo = FILTER_MAP[field];
    if (fInfo && value !== undefined && value !== null) {
      const ft = escapeTableName(fInfo.table);
      const fc = fInfo.col;
      // valor numérico vs. string
      const isNum = /^\d+$/.test(String(value));
      const valStr = isNum ? String(value) : `"${value}"`;
      filterClauses.push(`FILTER(ALL(${ft}), ${ft}[${fc}] = ${valStr})`);
    }
  }

  // --- 4. Montar SUMMARIZECOLUMNS ---
  const measureLines = resolvedMetrics.map(
    m => `    "${m.label}", ${m.dax}`
  ).join(",\n");

  const filterLines = filterClauses.length > 0
    ? filterClauses.map(f => `    ${f}`).join(",\n") + ",\n"
    : "";

  // ordenação opcional
  const orderByMeasure = resolvedMetrics[0].dax;

  const dax = `EVALUATE
TOPN(
    500,
    SUMMARIZECOLUMNS(
        ${dimTable}[${dimCol}],
${filterLines}${measureLines}
    ),
    ${orderByMeasure}, DESC
)`;

  return dax;
}

// ============================================================
// ENTRY POINT — execução do Code node
// ============================================================

const input = $json;
let plan;

// O AI Query Planner pode colocar o plano em diferentes campos
if (input.plan && typeof input.plan === "object") {
  plan = input.plan;
} else if (input.plan && typeof input.plan === "string") {
  try {
    plan = JSON.parse(input.plan);
  } catch (e) {
    plan = null;
  }
} else if (input.output && typeof input.output === "string") {
  // Alguns nós AI retornam em "output"
  try {
    const parsed = JSON.parse(input.output);
    plan = parsed.plan || parsed;
  } catch (e) {
    plan = null;
  }
} else if (input.message && typeof input.message === "object") {
  plan = input.message.plan || input.message;
}

if (!plan || !plan.dimension) {
  // Se não tem plano estruturado, gera erro descritivo
  return [{
    json: {
      ...input,
      daxQuery: null,
      daxError: "Plano não encontrado ou inválido. O AI Planner precisa retornar: { dimension, metrics, filters }",
      planReceived: JSON.stringify(plan || input).substring(0, 300)
    }
  }];
}

let daxQuery;
let daxError = null;

try {
  daxQuery = buildDAX(plan);
} catch (err) {
  daxQuery = null;
  daxError = err.message;
}

return [{
  json: {
    ...input,
    plan,
    daxQuery,
    daxError
  }
}];
