// Envia o load-catalog.json para a tabela company_catalog do Supabase
// Uso: node scripts/push-catalog.mjs
// Requer: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Carrega .env.local manualmente
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length > 0 && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COMPANY_ID  = process.env.POWERBI_COMPANY_ID || "72d26a5f-7bb9-4513-b7b2-165e0dd89aa9";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar no .env.local");
  process.exit(1);
}

const catalogFile = path.join(process.cwd(), "generated", "ja-diretoria-automacao.load-catalog.json");
if (!fs.existsSync(catalogFile)) {
  console.error("❌ Catálogo não encontrado. Rode primeiro: npm run generate-catalog");
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogFile, "utf8"));
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log(`📤 Enviando catálogo para Supabase (company_id: ${COMPANY_ID})...`);
console.log(`   Medidas: ${catalog.allowed_metrics?.length || 0}`);
console.log(`   Dimensões: ${catalog.allowed_dimensions?.length || 0}`);

const { error } = await supabase
  .from("company_catalog")
  .upsert(
    {
      company_id: COMPANY_ID,
      catalog_data: catalog,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" }
  );

if (error) {
  console.error("❌ Erro ao salvar no Supabase:", error.message);
  process.exit(1);
}

console.log("✅ Catálogo atualizado com sucesso!");
console.log("   Próxima pergunta no chat já usa as novas medidas/tabelas.");
