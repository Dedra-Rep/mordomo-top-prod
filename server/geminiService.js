import { GoogleGenAI, Type } from "@google/genai";

/**
 * Mordomo.top - Backend Gemini Service (Cloud Run)
 * - Usa process.env.API_KEY (setado no Cloud Run)
 * - Retorna JSON consistente (responseSchema)
 * - Monta link de afiliado Amazon automaticamente com tag
 * - Robusto contra respostas inválidas
 */

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("Missing API_KEY env var. Configure API_KEY in Cloud Run.");
  }
  return new GoogleGenAI({ apiKey: key });
};

const SYSTEM_INSTRUCTION_BASE = `
Você é o Mordomo.AI (mascote do Mordomo.top).
OBJETIVO: Maximizar decisão de compra rápida e links corretos.
MARKETPLACE PRIORITÁRIO: Amazon.com.br.

CONHECIMENTO DE PRODUTOS PRÓPRIOS (MORDOMO.TOP):
1. Plano Grátis: Assistente de compras para consumidores finais. Encontra o melhor preço com precisão.
2. Plano Profissional (Upgrade): Focado em Afiliados Iniciantes/Intermediários. Permite configurar tags/IDs. Transforma o Mordomo em máquina de links.
3. Plano Executivo (Elite): Mentoria avançada com IA de alta performance. Focado em carreira, estratégias e gestão.

REGRAS CRÍTICAS:
1. ESPELHO DO PEDIDO: comece o campo "speech" com "Você pediu: {resumo curto}."
2. BUSCA CIRÚRGICA: recomende apenas itens dentro do pedido.
3. FORMATO FIXO: sempre 1 "Mais barato" + 3 "Opções" (total 4 itens em results).
4. JSON LIMPO: responda SOMENTE com JSON válido conforme o schema.
5. QUERY: para cada item em results, preencha "query" (termo curto de busca, ex: "cafeteira elétrica inox 110v").
6. LINKS: você pode deixar "link_afiliado" vazio, pois o servidor irá montar automaticamente.
7. FALA: máximo 2 frases curtas no campo "speech".
`;

/**
 * Schema do JSON que o frontend consome (cards estilo AI Studio).
 * IMPORTANTE: incluímos "query" para gerar link de busca com tag.
 */
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    mode: { type: Type.STRING }, // ex: "shopping"
    pedido_do_cliente: { type: Type.STRING },
    entendimento: { type: Type.STRING },
    perguntas: { type: Type.ARRAY, items: { type: Type.STRING } },
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          rank: { type: Type.NUMBER },
          rotulo: { type: Type.STRING }, // "MAIS BARATO", "OPÇÃO 1", ...
          nome: { type: Type.STRING },
          porque: { type: Type.STRING },
          observacoes: { type: Type.STRING },
          query: { type: Type.STRING }, // termo de busca (usado p/ montar link)
          link_afiliado: { type: Type.STRING }, // preenchido pelo servidor
          link_tipo: { type: Type.STRING }, // "amazon_search"
          link_confidence: { type: Type.STRING } // "high"
        },
        required: ["rank", "rotulo", "nome", "query", "link_afiliado"]
      }
    },
    speech: { type: Type.STRING },
    emotion: { type: Type.STRING },
    ui_hints: {
      type: Type.OBJECT,
      properties: {
        avatar_state: { type: Type.STRING },
        allow_interrupt: { type: Type.BOOLEAN },
        show_bell: { type: Type.BOOLEAN },
        show_dismiss: { type: Type.BOOLEAN }
      }
    }
  },
  required: ["mode", "pedido_do_cliente", "speech", "results"]
};

// Roles simples (string)
const ROLE = {
  FREE: "FREE",
  AFFILIATE_PRO: "AFFILIATE_PRO",
  AFFILIATE_EXEC: "AFFILIATE_EXEC"
};

/**
 * Normaliza query para URL.
 */
function toQueryParam(input = "") {
  return encodeURIComponent(
    String(input)
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, " ")
  );
}

/**
 * Monta link de afiliado Amazon usando busca (funciona hoje).
 * (Depois você pode evoluir para PA-API e link direto de produto.)
 */
function buildAmazonSearchLink(query, tag) {
  const q = toQueryParam(query);
  const safeTag = (tag || "mordomoai-20").trim();
  return `https://www.amazon.com.br/s?k=${q}&tag=${safeTag}`;
}

/**
 * Fallback caso o modelo retorne algo inválido.
 */
function fallbackResponse(prompt, amazonTag) {
  const baseQuery = String(prompt || "").slice(0, 80);
  const q = baseQuery || "produto";
  const link = buildAmazonSearchLink(q, amazonTag);

  return {
    mode: "fallback",
    pedido_do_cliente: String(prompt || ""),
    entendimento: "Não consegui gerar a resposta completa. Vou te dar opções de busca na Amazon.",
    perguntas: [],
    results: [
      { rank: 1, rotulo: "MAIS BARATO", nome: `Sugestão (busca): ${q}`, query: q, link_afiliado: link, link_tipo: "amazon_search", link_confidence: "medium" },
      { rank: 2, rotulo: "OPÇÃO 1", nome: `Opção 1 (busca): ${q}`, query: q, link_afiliado: link, link_tipo: "amazon_search", link_confidence: "medium" },
      { rank: 3, rotulo: "OPÇÃO 2", nome: `Opção 2 (busca): ${q}`, query: q, link_afiliado: link, link_tipo: "amazon_search", link_confidence: "medium" },
      { rank: 4, rotulo: "OPÇÃO 3", nome: `Opção 3 (busca): ${q}`, query: q, link_afiliado: link, link_tipo: "amazon_search", link_confidence: "medium" }
    ],
    speech: `Você pediu: ${q}. Selecionei opções de busca na Amazon com seu link.`,
    emotion: "neutral",
    ui_hints: { avatar_state: "idle", allow_interrupt: true, show_bell: false, show_dismiss: true }
  };
}

/**
 * Endpoint principal
 */
export async function processUserRequest(prompt, role = ROLE.FREE, affiliateIds = {}) {
  const ai = getAI();

  const modelName =
    role === ROLE.AFFILIATE_EXEC ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

  // Tag do afiliado (Amazon Associates)
  const amazonTag = (affiliateIds && affiliateIds.amazon) ? affiliateIds.amazon : "mordomoai-20";

  let rawText = "";
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION_BASE}\nTAG ATIVA (AMAZON): ${amazonTag}\nUSUÁRIO ATUAL: ${role}`,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    rawText = response?.text || "";
    const data = JSON.parse(rawText || "{}");

    // Garante results array
    if (!Array.isArray(data.results)) data.results = [];

    // Completa/normaliza results e monta link afiliado
    data.results = data.results.slice(0, 4).map((item, idx) => {
      const query = item?.query || item?.nome || prompt || "produto";
      const link = buildAmazonSearchLink(query, amazonTag);

      return {
        rank: typeof item?.rank === "number" ? item.rank : idx + 1,
        rotulo: item?.rotulo || (idx === 0 ? "MAIS BARATO" : `OPÇÃO ${idx}`),
        nome: item?.nome || String(query),
        porque: item?.porque || "",
        observacoes: item?.observacoes || "",
        query: String(query),
        link_afiliado: link,
        link_tipo: "amazon_search",
        link_confidence: "high"
      };
    });

    // Campos obrigatórios
    if (!data.mode) data.mode = "shopping";
    if (!data.pedido_do_cliente) data.pedido_do_cliente = String(prompt || "");
    if (!data.speech) data.speech = `Você pediu: ${String(prompt || "").slice(0, 60)}. Aqui estão as melhores opções.`;

    return data;
  } catch (err) {
    console.error("processUserRequest error:", err);
    // Se deu erro por JSON inválido / modelo / etc, devolve fallback útil.
    return fallbackResponse(prompt, amazonTag);
  }
}
