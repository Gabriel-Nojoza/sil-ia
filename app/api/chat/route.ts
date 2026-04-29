import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ChatHistoryEntry } from "@/types/chat";
import { buildSilResponse } from "@/lib/sil/formatter";
import { generateDax } from "@/lib/sil/dax-generator";
import { getPowerBiToken, executePowerBiDax } from "@/lib/powerbi/execute-query";
import { resolveIntent, isChartRequest, normalizeText } from "@/lib/sil/interpreter";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

async function getCompanyCredentials(companyId: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("companies")
      .select("tenant_id, client_id, client_secret, workspace_id, dataset_id, webhook_url")
      .eq("id", companyId)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

function getPayloadMessage(payload: Record<string, unknown>) {
  return String(payload.chatInput ?? payload.message ?? "");
}

function getPayloadHistory(payload: Record<string, unknown>): ChatHistoryEntry[] {
  if (!Array.isArray(payload.history)) {
    return [];
  }

  return payload.history.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const candidate = entry as Partial<ChatHistoryEntry>;

    if (
      (candidate.role === "user" || candidate.role === "assistant") &&
      typeof candidate.content === "string"
    ) {
      return [{ role: candidate.role, content: candidate.content }];
    }

    return [];
  });
}

function isGenericChartPrompt(message: string) {
  const cleaned = normalizeText(message)
    .replace(
      /\b(gera|gerar|mostra|mostrar|mostre|abre|abrir|quero|me|o|a|um|uma|isso|esse|esta|pra|para|em|de|do|da|grafico|chart|visual)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length < 8;
}

function getLastUserMessage(history: ChatHistoryEntry[]) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entry = history[index];
    if (
      entry.role === "user" &&
      entry.content.trim() &&
      !isGenericChartPrompt(entry.content)
    ) {
      return entry.content.trim();
    }
  }

  return null;
}

function buildChartContextErrorResponse() {
  return NextResponse.json({
    blocks: [
      {
        type: "insight",
        severity: "warning",
        icon: "!",
        content:
          "Eu consigo gerar o grafico, mas preciso de uma consulta anterior no contexto. Primeiro pergunte algo como vendas por vendedor ou faturamento por mes.",
      },
    ],
    message: "Preciso de uma consulta anterior para gerar o grafico.",
  });
}

async function runSilEngine(payload: Record<string, unknown>): Promise<NextResponse> {
  const message = getPayloadMessage(payload);
  const history = getPayloadHistory(payload);
  const chartRequested = isChartRequest(message);
  const previousUserMessage = getLastUserMessage(history);
  const baseMessage =
    chartRequested && isGenericChartPrompt(message) ? previousUserMessage : message;
  const companyId = String(payload.company_id ?? "");
  const workspaceId = String(payload.workspace_id ?? "");
  const datasetId = String(payload.dataset_id ?? "");

  if (chartRequested && isGenericChartPrompt(message) && !baseMessage) {
    return buildChartContextErrorResponse();
  }

  const resolvedMessage = baseMessage ?? message;
  const intent = await resolveIntent(resolvedMessage);
  const dax = generateDax(intent);
  const credentials = await getCompanyCredentials(companyId);

  const tenantId = credentials?.tenant_id || process.env.POWERBI_TENANT_ID || "";
  const clientId = credentials?.client_id || process.env.POWERBI_CLIENT_ID || "";
  const clientSecret =
    credentials?.client_secret || process.env.POWERBI_CLIENT_SECRET || "";
  const resolvedWorkspaceId = credentials?.workspace_id || workspaceId;
  const resolvedDatasetId = credentials?.dataset_id || datasetId;

  if (
    !tenantId ||
    !clientId ||
    !clientSecret ||
    !resolvedWorkspaceId ||
    !resolvedDatasetId
  ) {
    return NextResponse.json(
      {
        message: "Credenciais do Power BI nao configuradas para esta empresa.",
        intent,
        dax,
        rows: [],
      },
      { status: 500 },
    );
  }

  const token = await getPowerBiToken(tenantId, clientId, clientSecret);
  const rows = await executePowerBiDax(
    resolvedWorkspaceId,
    resolvedDatasetId,
    token,
    dax,
  );
  const { message: answer, response } = buildSilResponse(rows, intent, {
    chartRequested,
  });

  return NextResponse.json({
    ...response,
    message: answer,
    intent,
    dax,
    rows,
    sourceQuery: resolvedMessage,
  });
}

async function runN8n(payload: unknown, webhookUrl?: string): Promise<NextResponse> {
  if (!webhookUrl) {
    throw new Error("Webhook do n8n nao configurado para este usuario ou empresa.");
  }

  const url = webhookUrl;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await response.text();
  let body: unknown = text;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (body && typeof body === "object" && "blocks" in body) {
    if (!response.ok) {
      return NextResponse.json(body, { status: response.status });
    }

    return NextResponse.json(body);
  }

  const candidate = body as Record<string, unknown> | null;
  const rawText =
    (typeof candidate?.message === "string" && candidate.message) ||
    (typeof candidate?.output === "string" && candidate.output) ||
    (typeof candidate?.content === "string" && candidate.content) ||
    (typeof body === "string" && body) ||
    "Webhook respondeu sem campo de mensagem reconhecido.";

  let structured: unknown = null;

  try {
    structured = JSON.parse(rawText);
  } catch {
    structured = null;
  }

  if (structured && typeof structured === "object" && "blocks" in structured) {
    if (!response.ok) {
      return NextResponse.json(structured, { status: response.status });
    }

    return NextResponse.json(structured);
  }

  const silResponse = { blocks: [{ type: "text", content: rawText }] };

  if (!response.ok) {
    return NextResponse.json(
      { ...silResponse, message: rawText },
      { status: response.status },
    );
  }

  return NextResponse.json({ ...silResponse, message: rawText });
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  // Webhook do payload (usuário ou empresa) tem prioridade absoluta — vai direto pro n8n
  const payloadWebhook = (payload.webhook_url as string | undefined)?.trim() || "";

  // Se não veio no payload, busca webhook da empresa no banco
  let effectiveWebhook = payloadWebhook;
  if (!effectiveWebhook) {
    const companyId = String(payload.company_id ?? "");
    if (companyId) {
      const creds = await getCompanyCredentials(companyId);
      effectiveWebhook = creds?.webhook_url?.trim() || "";
    }
  }

  // Fallback: variável de ambiente global
  if (!effectiveWebhook) {
    effectiveWebhook = process.env.N8N_WEBHOOK_URL?.trim() || "";
  }

  if (effectiveWebhook) {
    try {
      return await runN8n(payload, effectiveWebhook);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Erro de rede.";
      return NextResponse.json({ message: reason }, { status: 502 });
    }
  }

  // Sem webhook → tenta engine SIL (Power BI direto)
  try {
    return await runSilEngine(payload);
  } catch (silError) {
    console.error(
      "[/api/chat] SIL engine falhou:",
      silError instanceof Error ? silError.message : silError,
    );
    const reason = silError instanceof Error ? silError.message : "Erro interno.";
    return NextResponse.json({ message: reason }, { status: 500 });
  }
}
