// web/services/geminiService.ts
import type { AIResponse, AffiliateIDs, UserRole } from "../types";

type ApiPayload = {
  prompt: string;
  message: string;
  text: string;
  role: UserRole;
  affiliateIds?: AffiliateIDs;
};

/**
 * Normaliza QUALQUER resposta do backend para o contrato ÚNICO do frontend.
 * 🔒 Nunca retorna links
 * 🔒 Sempre retorna items[]
 */
function normalizeToAIResponse(data: any): AIResponse {
  const speech =
    data?.speech ??
    data?.text ??
    data?.answer ??
    data?.message ??
    "";

  // Aceita múltiplos formatos, converte para items[]
  const rawItems =
    (Array.isArray(data?.items) && data.items) ||
    (Array.isArray(data?.results) && data.results) ||
    (Array.isArray(data?.cards) && data.cards) ||
    (Array.isArray(data?.products) && data.products) ||
    [];

  const items = rawItems.map((x: any, idx: number) => ({
    rank: x?.rank ?? idx + 1,
    rotulo: x?.rotulo ?? x?.badge ?? x?.label ?? "OPÇÃO",
    title: x?.title ?? x?.nome ?? x?.name ?? "Recomendação",
    query: x?.query ?? x?.search ?? x?.termo ?? x?.title ?? "",
    why: x?.why ?? x?.porque ?? x?.reason ?? "",
    priceHint: x?.priceHint ?? x?.observacoes ?? null,
  }));

  return {
    speech,
    items,
    emotion: data?.emotion ?? "neutral",
  } as AIResponse;
}

export async function processUserRequest(
  message: string,
  role: UserRole,
  affiliateIds: AffiliateIDs
): Promise<AIResponse> {
  const payload: ApiPayload = {
    prompt: message,
    message,
    text: message,
    role,
    affiliateIds,
  };

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: any = null;

  try {
    data = await res.json();
  } catch {
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(text || `Erro HTTP ${res.status} em /api/chat`);
    }
    data = { speech: text };
  }

  if (!res.ok) {
    const msg =
      data?.error ||
      data?.message ||
      `Erro HTTP ${res.status} em /api/chat`;
    throw new Error(msg);
  }

  return normalizeToAIResponse(data);
}
