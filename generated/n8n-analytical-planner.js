const question = ($json.normalizedQuestion || $json.question || "").toLowerCase();

const dimKeywords = {
  supervisor: ["supervisor", "supervisores"],
  gerente: ["gerente", "gerentes"],
  vendedor: ["vendedor", "vendedores", "representante"],
  filial: ["filial", "filiais", "loja", "lojas", "unidade"],
  cliente: ["cliente", "clientes"],
  produto: ["produto", "produtos", "item", "itens"],
  regional: ["regional"],
};

let dimension = "supervisor";
for (const [dim, words] of Object.entries(dimKeywords)) {
  if (words.some(w => question.includes(w))) { dimension = dim; break; }
}

const metricKeywords = {
  "venda":           ["venda", "vendas", "faturou", "vendido"],
  "pedidos enviados":["pedidos enviados", "pedido enviado", "qtde pedidos enviados", "quantidade de pedidos enviados"],
  "meta":            ["meta", "objetivo"],
  "% meta":          ["% meta", "atingimento", "percentual meta", "bateu meta"],
  "tendencia":       ["tendencia", "tendência", "projeção", "projecao"],
  "faturamento":     ["faturamento", "faturado", "nota fiscal"],
  "lucro":           ["lucro"],
  "margem":          ["margem", "% margem"],
  "ticket":          ["ticket", "tiquet", "ticket medio", "tiquet medio"],
  "desconto":        ["desconto"],
  "evolucao":        ["evolucao", "evolução", "crescimento"],
  "qtde clientes":   ["qtde clientes", "quantidade de clientes", "clientes ativos"],
  "qtde produtos":   ["qtde produtos", "mix", "quantidade de produtos"],
  "novos clientes":  ["novos clientes", "cliente novo"],
  "venda aa":        ["ano anterior", "aa"],
  "bonificacao":     ["bonificacao", "bonificação", "bonif"],
  "devolucao":       ["devolucao", "devolução", "devolvido"],
};

const metrics = [];
for (const [metric, words] of Object.entries(metricKeywords)) {
  if (words.some(w => question.includes(w))) metrics.push(metric);
}
if (metrics.length === 0) metrics.push("venda");

const filters = [];

const filialMatch = question.match(/filial\s+(\d{1,3})/);
if (filialMatch) filters.push({ field: "filial", value: filialMatch[1].padStart(2, "0") });

const regionalMatch = question.match(/regional\s+(\d+)/);
if (regionalMatch) filters.push({ field: "regional", value: regionalMatch[1] });

const mesMap = {
  janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4, maio: 5,
  junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12
};
for (const [mes, num] of Object.entries(mesMap)) {
  if (question.includes(mes)) { filters.push({ field: "mes", value: num }); break; }
}

const plan = { dimension, metrics, filters, queryNeeded: true };

return [{ json: { ...$json, plan } }];
