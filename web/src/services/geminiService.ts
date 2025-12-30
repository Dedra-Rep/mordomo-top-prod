import type { ChatResponse, PlanId } from "../types";

export async function chatApi(params: {
  message: string;
  plan: PlanId;
  amazonTag?: string;
}): Promise<ChatResponse> {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = (await r.json().catch(() => null)) as ChatResponse | null;

  if (!data) {
    return {
      ok: false,
      plan: params.plan,
      reply: "Falha ao ler resposta do servidor.",
      cards: [],
      error: "invalid_json",
    };
  }

  return data;
}
