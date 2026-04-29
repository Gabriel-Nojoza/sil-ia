import type { Intent } from "./interpreter";

export function generateDax(intent: Intent): string {
  const { daxMeasure, metricLabel, dimension, dimensionColumn, period, topN } = intent;

  if (dimension === "geral") {
    return [
      "EVALUATE",
      "ROW(",
      `  "${metricLabel}", ROUND(${daxMeasure}, 0)`,
      ")",
    ].join("\n");
  }

  const summarizeBody = [
    `  SUMMARIZECOLUMNS(`,
    `    ${dimensionColumn},`,
    `    "${metricLabel}", ROUND(${daxMeasure}, 0)`,
    `  )`,
  ].join("\n");

  const calculateTable = [
    "CALCULATETABLE(",
    summarizeBody + ",",
    `  Calendariod[Ano] = ${period}`,
    ")",
  ].join("\n");

  if (topN) {
    return [
      "EVALUATE",
      `TOPN(`,
      `  ${topN},`,
      `  ${calculateTable},`,
      `  [${metricLabel}], DESC`,
      ")",
    ].join("\n");
  }

  return ["EVALUATE", calculateTable].join("\n");
}
