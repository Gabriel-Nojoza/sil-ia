import fs from "node:fs";
import path from "node:path";

const sourceDir =
  process.argv[2] ||
  "D:\\Users\\supor\\Downloads\\JA DIRETORIA AUTOMACAO.SemanticModel";

const tablesDir = path.join(sourceDir, "definition", "tables");

function stripQuotes(value) {
  return value.replace(/^'+|'+$/g, "").trim();
}

function parseObjectName(line, keyword) {
  const trimmed = line.trim();
  if (!trimmed.startsWith(keyword + " ")) return null;
  const afterKeyword = trimmed.slice(keyword.length + 1);
  const eqIndex = afterKeyword.indexOf("=");
  const rawName = eqIndex >= 0 ? afterKeyword.slice(0, eqIndex) : afterKeyword;
  return stripQuotes(rawName);
}

function shouldIgnoreTable(name) {
  return /^LocalDateTable_/i.test(name) || /^DateTableTemplate_/i.test(name) || /^🎨/u.test(name);
}

function candidateDimension(tableName, columnName) {
  const raw = `${tableName} ${columnName}`.toLowerCase();
  return /(vendedor|supervisor|gerente|cliente|produto|fornecedor|filial|regi[aã]o|regiao|cidade|municip|segmento|marca|roteiro|data|date|period|periodo|calend)/i.test(
    raw,
  );
}

if (!fs.existsSync(tablesDir)) {
  console.error(`Diretório não encontrado: ${tablesDir}`);
  process.exit(1);
}

const files = fs
  .readdirSync(tablesDir)
  .filter((file) => file.toLowerCase().endsWith(".tmdl"))
  .sort((a, b) => a.localeCompare(b, "pt-BR"));

const tables = [];

for (const file of files) {
  const fullPath = path.join(tablesDir, file);
  const content = fs.readFileSync(fullPath, "utf8");
  const lines = content.split(/\r?\n/);

  let tableName = null;
  const columns = [];
  const measures = [];
  let currentMeasure = null;
  let currentColumn = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!tableName && trimmed.startsWith("table ")) {
      tableName = stripQuotes(trimmed.slice("table ".length));
      continue;
    }

    const measureName = parseObjectName(line, "measure");
    if (measureName) {
      currentMeasure = {
        name: measureName,
        displayFolder: null,
        formatString: null,
      };
      currentColumn = null;
      measures.push(currentMeasure);
      continue;
    }

    const columnName = parseObjectName(line, "column");
    if (columnName) {
      currentColumn = {
        name: columnName,
        dataType: null,
        sourceColumn: null,
      };
      currentMeasure = null;
      columns.push(currentColumn);
      continue;
    }

    if (currentMeasure && trimmed.startsWith("displayFolder:")) {
      currentMeasure.displayFolder = trimmed.replace("displayFolder:", "").trim();
      continue;
    }

    if (currentMeasure && trimmed.startsWith("formatString:")) {
      currentMeasure.formatString = trimmed.replace("formatString:", "").trim();
      continue;
    }

    if (currentColumn && trimmed.startsWith("dataType:")) {
      currentColumn.dataType = trimmed.replace("dataType:", "").trim();
      continue;
    }

    if (currentColumn && trimmed.startsWith("sourceColumn:")) {
      currentColumn.sourceColumn = trimmed.replace("sourceColumn:", "").trim();
      continue;
    }
  }

  if (!tableName) {
    tableName = file.replace(/\.tmdl$/i, "");
  }

  tables.push({
    file,
    name: tableName,
    columns,
    measures,
  });
}

const usefulTables = tables.filter((table) => !shouldIgnoreTable(table.name));
const measuresFlat = usefulTables.flatMap((table) =>
  table.measures.map((measure) => ({
    table: table.name,
    name: measure.name,
    displayFolder: measure.displayFolder,
    formatString: measure.formatString,
  })),
);

const dimensionCandidates = usefulTables.flatMap((table) =>
  table.columns
    .filter((column) => candidateDimension(table.name, column.name))
    .map((column) => ({
      table: table.name,
      column: column.name,
      dataType: column.dataType,
      sourceColumn: column.sourceColumn,
      key: `${table.name}[${column.name}]`,
    })),
);

const uniqueMetrics = [...new Set(measuresFlat.map((item) => item.name))];
const uniqueDimensions = [...new Set(dimensionCandidates.map((item) => item.key))];

const catalog = {
  sourcePath: sourceDir,
  generatedAt: new Date().toISOString(),
  summary: {
    totalTables: usefulTables.length,
    totalMeasures: measuresFlat.length,
    totalDimensionCandidates: dimensionCandidates.length,
  },
  tables: usefulTables,
  measuresFlat,
  dimensionCandidates,
  loadCatalog: {
    default_period: "mes_atual",
    allowed_metrics: uniqueMetrics,
    allowed_dimensions: uniqueDimensions,
    catalog_loaded: true,
  },
};

const outputDir = path.join(process.cwd(), "generated");
fs.mkdirSync(outputDir, { recursive: true });

const outputPath = path.join(outputDir, "ja-diretoria-automacao.catalog.json");
fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2), "utf8");

console.log(`Catálogo gerado em: ${outputPath}`);
console.log(
  JSON.stringify(
    {
      totalTables: catalog.summary.totalTables,
      totalMeasures: catalog.summary.totalMeasures,
      totalDimensionCandidates: catalog.summary.totalDimensionCandidates,
      sampleMetrics: catalog.loadCatalog.allowed_metrics.slice(0, 10),
      sampleDimensions: catalog.loadCatalog.allowed_dimensions.slice(0, 10),
    },
    null,
    2,
  ),
);
