// web/services/geminiService.ts

export type Mode = "FREE" | "PRO" | "EXEC";

export type AffiliateIds = Partial<{
  amazon: string;
  mercadoLivre: string;
  shopee: string;
  ebay: string;
  aliexpress: string;
}>;

export type ProductCard = {
  title: string;
  price?: string;
  url?: string;
  badge?: "MAIS_BARATO" | "CUSTO_BENEFICIO" | "PREMIUM" | "OPCAO";
  reason?: string;
  source?: string;
};

export type AIResponse = {
  title?: string;
  subtitle?: string;
  query?: string;
  cards: ProductCard[];
  raw?: any;
};

type ChatPayload = {
  message: string;
  mode: Mode;
  role?: string;
  affiliateIds?: AffiliateIds;
};

function withTimeout(ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { controller, cancel: () => clearTimeout(id) };
}

export async function sendToApi(payload: ChatPayload): Promise<AIResponse> {
  const { controller, cancel } = withTimeout(45_000);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json: any = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // se o backend responder texto puro
      json = { text };
    }

    if (!res.ok) {
      const msg =
        json?.error ||
        json?.message ||
        `Erro HTTP ${res.status} em /api/chat`;
      throw new Error(msg);
    }

    // Normalização: aceitamos vários formatos e convertemos para { cards: [] }
    const cards: ProductCard[] =
      json?.cards ||
      json?.items ||
      json?.products ||
      json?.result?.cards ||
      [];

    return {
      title: json?.title || json?.headline || "Resultado",
      subtitle: json?.subtitle || json?.summary || "",
      query: json?.query || json?.search || "",
      cards,
      raw: json,
    };
  } finally {
    cancel();
  }
}
