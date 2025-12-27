// web/services/geminiService.ts

export type AIResultItem = {
  rotulo?: string;           // "MAIS BARATO" | "OPÇÃO 1" | ...
  nome?: string;             // título do produto
  porque?: string;           // justificativa
  observacoes?: string;      // extra
  link_afiliado?: string;    // link final
};

export type AIResponse = {
  speech?: string;
  results?: AIResultItem[];
};

export async function chat(message: string): Promise<AIResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Erro HTTP ${res.status}`);
  }

  // Normaliza vários formatos possíveis do backend para o que o ChatInterface espera:
  const speech =
    data?.speech ||
    data?.text ||
    data?.answer ||
    data?.message ||
    "";

  const results =
    (Array.isArray(data?.results) && data.results) ||
    (Array.isArray(data?.cards) && data.cards) ||
    (Array.isArray(data?.items) && data.items) ||
    [];

  // Se o backend devolver cards com chaves diferentes, tenta mapear:
  const normalizedResults = results.map((x: any) => ({
    rotulo: x?.rotulo ?? x?.badge ?? x?.label,
    nome: x?.nome ?? x?.title ?? x?.name,
    porque: x?.porque ?? x?.reason ?? x?.why,
    observacoes: x?.observacoes ?? x?.notes ?? x?.obs,
    link_afiliado: x?.link_afiliado ?? x?.url ?? x?.link,
  }));

  return { speech, results: normalizedResults };
}
