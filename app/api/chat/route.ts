import { NextResponse } from "next/server";

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

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
    candidate.data &&
    typeof candidate.data === "object" &&
    typeof (candidate.data as Record<string, unknown>).message === "string"
  ) {
    return (candidate.data as Record<string, unknown>).message as string;
  }

  return null;
}

export async function POST(request: Request) {
  if (!N8N_WEBHOOK_URL) {
    return NextResponse.json(
      {
        message:
          "Webhook do n8n nao configurado. Defina N8N_WEBHOOK_URL no servidor.",
      },
      { status: 500 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Payload invalido enviado para /api/chat." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseText = await response.text();

    let responseBody: unknown = responseText;

    try {
      responseBody = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseBody = responseText;
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            extractResponseText(responseBody) ||
            `Falha ao consultar o n8n. Status ${response.status}.`,
          raw: responseBody,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      message:
        extractResponseText(responseBody) ||
        "O n8n respondeu com sucesso, mas sem um campo de mensagem reconhecido.",
      raw: responseBody,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Erro de rede ao consultar o n8n: ${error.message}`
            : "Erro de rede ao consultar o n8n.",
      },
      { status: 502 },
    );
  }
}
