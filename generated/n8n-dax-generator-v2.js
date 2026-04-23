// ============================================================
// DAX Generator v2 — usa catálogo dinâmico do Load Catalog
// Dataset: JA DIRETORIA AUTOMACAO
// ============================================================

// ---------- MAPA DE DIMENSOES (NLP → tabela real) ----------
const DIM = {
  supervisor:   { table: "Supervisor",     col: "NOME",        filterCol: "CODSUPERVISOR" },
  supervisores: { table: "Supervisor",     col: "NOME",        filterCol: "CODSUPERVISOR" },
  gerente:      { table: "Gerente",        col: "NOMEGERENTE", filterCol: "CODGERENTE"    },
  gerentes:     { table: "Gerente",        col: "NOMEGERENTE", filterCol: "CODGERENTE"    },
  vendedor:     { table: "Vendedores",     col: "NOME",        filterCol: "CODUSUR"        },
  vendedores:   { table: "Vendedores",     col: "NOME",        filterCol: "CODUSUR"        },
  cliente:      { table: "PCCLIENTE",      col: "CLIENTE",     filterCol: "CODCLI"        },
  clientes:     { table: "PCCLIENTE",      col: "CLIENTE",     filterCol: "CODCLI"        },
  produto:      { table: "PCPRODUTOS",     col: "DESCRICAO",   filterCol: "CODPROD"       },
  produtos:     { table: "PCPRODUTOS",     col: "DESCRICAO",   filterCol: "CODPROD"       },
  filial:       { table: "Nome Filial",    col: "Filial",      filterCol: "Cod"           },
  filiais:      { table: "Nome Filial",    col: "Filial",      filterCol: "Cod"           },
  regional:     { table: "Supervisor",     col: "REGIONAL",    filterCol: "REGIONAL"      },
};

// ---------- MAPA DE MEDIDAS (NLP → nome exato no Power BI) ----------
const MED = {
  "venda":               "Venda",
  "vendas":              "Venda",
  "pedidos enviados":    "Pedidos Enviados'",
  "pedido enviado":      "Pedidos Enviados'",
  "pedidos":             "Pedidos Enviados'",
  "faturamento":         "Vl Faturados'",
  "faturado":            "Vl Faturados'",
  "meta":                "Meta",
  "% meta":              "% Meta'",
  "atingimento":         "% Meta'",
  "lucro":               "Lucro",
  "margem":              "% Margem'",
  "% margem":            "% Margem'",
  "ticket":              "Tiquet Medio'",
  "tiquet":              "Tiquet Medio'",
  "ticket medio":        "Tiquet Medio'",
  "tiquet medio":        "Tiquet Medio'",
  "qtde clientes":       "Qtde Clientes'",
  "qtde produtos":       "Qtde Produtos'",
  "desconto":            "Desconto",
  "tendencia":           "% Tendencia Ped.'",
  "tendência":           "% Tendencia Ped.'",
  "% tendencia":         "% Tendencia Ped.'",
  "$ tendencia":         "$ Tendencia Ped.'",
  "evolucao":            "Evolução",
  "evolução":            "Evolução",
  "venda aa":            "Venda AA'",
  "venda ano anterior":  "Venda AA'",
  "venda mes anterior":  "Venda Mês ant'",
  "bonificacao":         "Bonificação",
  "bonificação":         "Bonificação",
  "novos clientes":      "Novos Clientes'",
  "clientes recorrentes":"Clientes Recorrentes'",
  "mix medio":           "Mix Medio'",
  "devolucao":           "Vl Devolução'",
  "devolução":           "Vl Devolução'",
};

// ---------- MAPA DE FILTROS (campo → tabela/coluna real) ----------
const FILTER_MAP = {
  filial:     { table: "Nome Filial", col: "Cod"           },
  gerente:    { table: "Gerente",     col: "CODGERENTE"    },
  supervisor: { table: "Supervisor",  col: "CODSUPERVISOR" },
  regional:   { table: "Supervisor",  col: "REGIONAL"      },
  produto:    { table: "PCPRODUTOS",  col: "CODPROD"       },
  cliente:    { table: "PCCLIENTE",   col: "CODCLI"        },
};

// ============================================================
// BUSCA MEDIDA NO CATÁLOGO (fuzzy match)
// Quando uma nova medida é adicionada ao Power BI e o catálogo
// for atualizado, ela é automaticamente encontrada aqui.
// ============================================================
function findMeasureInCatalog(keyword, allowedMetrics) {
  if (!allowedMetrics || allowedMetrics.length === 0) return null;
  const k = keyword.toLowerCase().trim();
  // Busca exata (sem case)
  const exact = allowedMetrics.find(m => m.toLowerCase() === k);
  if (exact) return exact;
  // Busca parcial: keyword contida no nome da medida
  const partial = allowedMetrics.find(m => m.toLowerCase().replace(/['\s]/g, "").includes(k.replace(/\s/g, "")));
  if (partial) return partial;
  return null;
}

function escapeTable(name) {
  return name.includes(" ") ? `'${name}'` : name;
}

function resolveMeasure(keyword, allowedMetrics) {
  const k = (keyword || "").toLowerCase().trim();
  // 1. Tenta no mapa fixo primeiro (mais confiável)
  if (MED[k]) return MED[k];
  // 2. Tenta no catálogo dinâmico
  const fromCatalog = findMeasureInCatalog(k, allowedMetrics);
  if (fromCatalog) return fromCatalog;
  // 3. Usa o keyword direto como nome de medida
  return keyword;
}

// ============================================================
// GERA DAX
// ============================================================
function buildDAX(plan, allowedMetrics) {
  const dimInfo = DIM[(plan.dimension || "").toLowerCase().trim()];
  if (!dimInfo) {
    throw new Error(`Dimensão desconhecida: "${plan.dimension}". Válidas: ${Object.keys(DIM).join(", ")}`);
  }

  const dimTable = escapeTable(dimInfo.table);
  const dimCol   = dimInfo.col;

  // Resolver medidas
  const metrics = (plan.metrics || []);
  const resolved = metrics.length > 0 ? metrics : ["venda"];
  const measureLines = resolved.map(m => {
    const name = resolveMeasure(m, allowedMetrics);
    return `    "${m}", [${name}]`;
  }).join(",\n");

  // Resolver filtros
  const filterClauses = (plan.filters || []).map(f => {
    const fi = FILTER_MAP[(f.field || "").toLowerCase().trim()];
    if (!fi || f.value == null) return null;
    const ft = escapeTable(fi.table);
    const isNum = /^\d+$/.test(String(f.value));
    const val = isNum ? String(f.value) : `"${f.value}"`;
    return `    FILTER(ALL(${ft}), ${ft}[${fi.col}] = ${val})`;
  }).filter(Boolean).join(",\n");

  const filterBlock = filterClauses ? filterClauses + ",\n" : "";
  const orderBy = `[${resolveMeasure(resolved[0], allowedMetrics)}]`;

  return `EVALUATE\nTOPN(\n    500,\n    SUMMARIZECOLUMNS(\n        ${dimTable}[${dimCol}],\n${filterBlock}${measureLines}\n    ),\n    ${orderBy}, DESC\n)`;
}

// ============================================================
// ENTRY POINT
// ============================================================
const input = $json;

// Pega o catálogo carregado pelo nó Load Catalog
const allowedMetrics = input.catalog?.allowed_metrics
  || input.allowed_metrics
  || [];

// Pega o plano do Analytical Planner
let plan = input.plan;
if (typeof plan === "string") {
  try { plan = JSON.parse(plan); } catch(e) { plan = null; }
}

if (!plan || !plan.dimension) {
  return [{ json: {
    ...input,
    daxQuery: null,
    daxError: "Plano inválido. Esperado: { dimension, metrics, filters }",
    catalogLoaded: allowedMetrics.length,
    planReceived: JSON.stringify(plan || input).substring(0, 200)
  }}];
}

let daxQuery = null;
let daxError = null;
try {
  daxQuery = buildDAX(plan, allowedMetrics);
} catch(err) {
  daxError = err.message;
}

return [{ json: { ...input, plan, daxQuery, daxError, catalogMeasuresCount: allowedMetrics.length } }];
