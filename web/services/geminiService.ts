// web/services/geminiService.ts
import type { AIResponse, AffiliateIDs, UserRole } from "../types";

type ApiPayload = {
  message: string;
  role: UserRole;
  affiliateIds?: AffiliateIDs;
};

function normalizeToAIResponse(data: any): AIResponse {
  // speech (texto curto para balão + voz)
  const speech =
    data?.speech ??
    data?.text ??
    data?.answer ??
    data?.message ??
    "";

  // results (cards)
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
    // preserva possíveis campos extras do backend (emotion etc.), se existirem
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
  const payload: ApiPayload = { message, role, affiliateIds };

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // Tenta JSON; se falhar, transforma em erro legível
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
