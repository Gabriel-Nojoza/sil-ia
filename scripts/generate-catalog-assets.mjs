import fs from "node:fs";
import path from "node:path";

const catalogPath =
  process.argv[2] || path.join(process.cwd(), "generated", "ja-diretoria-automacao.catalog.json");

if (!fs.existsSync(catalogPath)) {
  console.error(`Catálogo não encontrado: ${catalogPath}`);
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function jsonSql(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

const companyIdPlaceholder = "00000000-0000-0000-0000-000000000000";

const measureRows = (catalog.measuresFlat || []).map((measure) => ({
  artifact_type: "measure",
  table_name: measure.table,
  column_name: null,
  measure_name: measure.name,
  dax_expression: null,
  description: measure.displayFolder || null,
  synonyms: [],
  metadata: {
    source: "pbip_tmdl",
    formatString: measure.formatString || null,
    displayFolder: measure.displayFolder || null,
  },
}));

const dimensionRows = (catalog.dimensionCandidates || []).map((dimension) => ({
  artifact_type: "dimension",
  table_name: dimension.table,
  column_name: dimension.column,
  measure_name: null,
  dax_expression: null,
  description: null,
  synonyms: [],
  metadata: {
    source: "pbip_tmdl",
    dataType: dimension.dataType || null,
    sourceColumn: dimension.sourceColumn || null,
    key: dimension.key,
  },
}));

const tableRows = (catalog.tables || []).map((table) => ({
  artifact_type: "table",
  table_name: table.name,
  column_name: null,
  measure_name: null,
  dax_expression: null,
  description: null,
  synonyms: [],
  metadata: {
    source: "pbip_tmdl",
    file: table.file,
    columnCount: table.columns?.length || 0,
    measureCount: table.measures?.length || 0,
  },
}));

const allRows = [...tableRows, ...measureRows, ...dimensionRows];

const valuesSql = allRows
  .map(
    (row) =>
      `  (${sqlString(companyIdPlaceholder)}::uuid, ${sqlString(row.artifact_type)}, ${sqlString(
        row.table_name,
      )}, ${sqlString(row.column_name)}, ${sqlString(row.measure_name)}, ${sqlString(
        row.dax_expression,
      )}, ${sqlString(row.description)}, ${jsonSql(row.synonyms)}, ${jsonSql(row.metadata)})`,
  )
  .join(",\n");

const sql = `-- Catálogo gerado automaticamente a partir do arquivo TMDL/PBIP
-- Arquivo fonte: ${catalog.sourcePath}
-- Gerado em: ${catalog.generatedAt}
--
-- INSTRUÇÕES:
-- 1. Substitua o company_id abaixo pelo ID real da empresa na tabela companies.
-- 2. Opcionalmente, apague o catálogo anterior dessa empresa antes de inserir.

begin;

delete from company_catalog
where company_id = ${sqlString(companyIdPlaceholder)}::uuid;

insert into company_catalog (
  company_id,
  artifact_type,
  table_name,
  column_name,
  measure_name,
  dax_expression,
  description,
  synonyms,
  metadata
)
values
${valuesSql};

commit;
`;

const loadCatalog = {
  default_period: catalog.loadCatalog?.default_period || "mes_atual",
  allowed_metrics: catalog.loadCatalog?.allowed_metrics || [],
  allowed_dimensions: catalog.loadCatalog?.allowed_dimensions || [],
  catalog_loaded: true,
  summary: catalog.summary || {},
};

const outputDir = path.dirname(catalogPath);
const sqlPath = path.join(outputDir, "ja-diretoria-automacao.company_catalog.sql");
const loadCatalogPath = path.join(outputDir, "ja-diretoria-automacao.load-catalog.json");

fs.writeFileSync(sqlPath, sql, "utf8");
fs.writeFileSync(loadCatalogPath, JSON.stringify(loadCatalog, null, 2), "utf8");

console.log(`SQL gerado em: ${sqlPath}`);
console.log(`Payload load-catalog gerado em: ${loadCatalogPath}`);
console.log(
  JSON.stringify(
    {
      totalRows: allRows.length,
      tables: tableRows.length,
      measures: measureRows.length,
      dimensions: dimensionRows.length,
    },
    null,
    2,
  ),
);
