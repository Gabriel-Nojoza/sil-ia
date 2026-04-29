import type { ChatRequestPayload, ChatResponse } from "@/types/chat";

import type { SilResponse } from "@/components/sil/types";
import { createUuid } from "@/lib/uuid";

function isSilResponse(value: unknown): value is SilResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "blocks" in value &&
    Array.isArray((value as SilResponse).blocks)
  );
}

function createAssistantMessage(content: string, raw?: unknown): ChatResponse {
  const silResponse = isSilResponse(raw) ? raw : undefined;
  return {
    message: {
      id: createUuid(),
      role: "assistant",
      content,
      createdAt: new Date().toISOString(),
      status: "sent",
      silResponse,
    },
    raw,
  };
}

function extractResponseText(responseBody: unknown): string | null {
  if (!responseBody) {
    return null;
  }

  if (typeof responseBody === "string") {
    return responseBody;
  }

  if (typeof responseBody !== "object") {
    return null;
  }

  const candidate = responseBody as Record<string, unknown>;

  if (typeof candidate.message === "string") {
    return candidate.message;
  }

  if (typeof candidate.content === "string") {
    return candidate.content;
  }

  if (typeof candidate.output === "string") {
    return candidate.output;
  }

  if (typeof candidate.text === "string") {
    return candidate.text;
  }

  if (
    candidate.message &&
    typeof candidate.message === "object" &&
    typeof (candidate.message as Record<string, unknown>).content === "string"
  ) {
    return (candidate.message as Record<string, unknown>).content as string;
  }

  if (
    candidate.data &&
    typeof candidate.data === "object" &&
    typeof (candidate.data as Record<string, unknown>).message === "string"
  ) {
    return (candidate.data as Record<string, unknown>).message as string;
  }

  return null;
}

async function sendChatMessageMock(payload: ChatRequestPayload): Promise<ChatResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1400));

  if (payload.chatInput.toLowerCase().includes("erro")) {
    throw new Error("Falha simulada ao consultar a IA. Tente novamente.");
  }

  const content = [
    "Analisei sua solicitacao com o contexto da empresa atual.",
    `company_id: ${payload.company_id}`,
    `workspace_id: ${payload.workspace_id ?? "nao informado"}`,
    `dataset_id: ${payload.dataset_id ?? "nao informado"}`,
    "",
    `Pergunta recebida: "${payload.chatInput}"`,
    "",
    "Proximo passo para producao:",
    "definir NEXT_PUBLIC_N8N_WEBHOOK_URL para enviar a pergunta ao seu webhook real do n8n.",
  ].join("\n");

  return createAssistantMessage(content);
}

export async function sendChatMessage(payload: ChatRequestPayload): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let responseBody: unknown = null;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = await response.text();
  }

  if (!response.ok) {
    const message = extractResponseText(responseBody);

    if (response.status === 500 && message?.includes("Webhook do n8n nao configurado")) {
      return sendChatMessageMock(payload);
    }

    throw new Error(message || `Falha ao consultar o webhook do n8n. Status ${response.status}.`);
  }

  return createAssistantMessage(
    extractResponseText(responseBody) ||
      "O webhook respondeu com sucesso, mas sem um campo de mensagem reconhecido.",
    responseBody,
  );
}
