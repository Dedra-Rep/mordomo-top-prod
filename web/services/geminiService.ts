// web/services/geminiService.ts
import type { AIResponse, AffiliateIDs, UserRole } from "../types";

type ApiPayload = {
  // backend pode exigir "prompt"
  prompt: string;
  // seu app já usa "message"
  message: string;
  // alguns backends usam "text" também
  text: string;

  role: UserRole;
  affiliateIds?: AffiliateIDs;
};

function normalizeToAIResponse(data: any): AIResponse {
  const speech =
    data?.speech ??
    data?.text ??
    data?.answer ??
    data?.message ??
    "";

  const raw =
    (Array.isArray(data?.results) && data.results) ||
    (Array.isArray(data?.cards) && data.cards) ||
    (Array.isArray(data?.items) && data.items) ||
    (Array.isArray(data?.products) && data.products) ||
    [];

  const results = raw.map((x: any) => ({
    rotulo: x?.rotulo ?? x?.badge ?? x?.label ?? "OPÇÃO",
    nome: x?.nome ?? x?.title ?? x?.name ?? "Recomendação",
    porque: x?.porque ?? x?.reason ?? x?.why ?? "",
    observacoes: x?.observacoes ?? x?.notes ?? x?.obs ?? "",
    link_afiliado: x?.link_afiliado ?? x?.url ?? x?.link ?? "",
  }));

  return {
    ...data,
    speech,
    results,
  } as AIResponse;
}

export async function processUserRequest(
  message: string,
  role: UserRole,
  affiliateIds: AffiliateIDs
): Promise<AIResponse> {
  // Envia "prompt", "message" e "text" para compatibilidade total com o backend
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
    if (!res.ok) throw new Error(text || `Erro HTTP ${res.status} em /api/chat`);
    data = { speech: text };
  }

  if (!res.ok) {
    const msg =
      data?.error || data?.message || `Erro HTTP ${res.status} em /api/chat`;
    throw new Error(msg);
  }

  return normalizeToAIResponse(data);
}
