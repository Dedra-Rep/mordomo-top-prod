import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_BASE = `
Você é o Mordomo.AI (mascote do Mordomo.top).
OBJETIVO: Maximizar decisão de compra rápida e links corretos.
MARKETPLACE PRIORITÁRIO: Amazon.com.br (tag=mordomoai-20).

CONHECIMENTO DE PRODUTOS PRÓPRIOS (MORDOMO.TOP):
1. Plano Grátis: Assistente de compras para consumidores finais. Encontra o melhor preço com precisão.
2. Plano Profissional (Upgrade): Focado em Afiliados Iniciantes/Intermediários. Permite configurar tags da Amazon, Mercado Livre e Shopee. Transforma o Mordomo em uma máquina de gerar links comissionados.
3. Plano Executivo (Elite): Mentoria avançada com IA de alta performance (Gemini Pro). Focado em carreira, estratégias de marketing digital e gestão de grandes operações de afiliados.

REGRAS CRÍTICAS:
1. ESPELHO DO PEDIDO: Comece sempre com "Você pediu: {resumo}".
2. BUSCA CIRÚRGICA: Apenas itens exatamente dentro do escopo.
3. VENDAS: Se o usuário perguntar sobre os planos ou como ganhar dinheiro, explique os benefícios do Profissional e Executivo com entusiasmo e educação.
4. FORMATO FIXO: 1 Mais barato + 3 Opções.
5. LINKS: Sempre com tag=mordomoai-20 (ou a tag configurada).
6. FALA: Máximo 2 frases curtas.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    mode: { type: Type.STRING },
    pedido_do_cliente: { type: Type.STRING },
    entendimento: { type: Type.STRING },
    perguntas: { type: Type.ARRAY, items: { type: Type.STRING } },
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          rank: { type: Type.NUMBER },
          rotulo: { type: Type.STRING },
          nome: { type: Type.STRING },
          porque: { type: Type.STRING },
          observacoes: { type: Type.STRING },
          link_afiliado: { type: Type.STRING },
          link_tipo: { type: Type.STRING },
          link_confidence: { type: Type.STRING }
        },
        required: ["rank", "rotulo", "nome", "link_afiliado"]
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

// roles simples (string) para não depender de types TS no backend
const ROLE = {
  FREE: "FREE",
  AFFILIATE_PRO: "AFFILIATE_PRO",
  AFFILIATE_EXEC: "AFFILIATE_EXEC",
};

export async function processUserRequest(prompt, role = ROLE.FREE, affiliateIds = {}) {
  const ai = getAI();

  // IDs de modelo confirmados na doc oficial
  // Gemini 3 Pro Preview: gemini-3-pro-preview
  // Gemini 3 Flash Preview: gemini-3-flash-preview
  const modelName = role === ROLE.AFFILIATE_EXEC ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

  const amazonTag = affiliateIds.amazon || "mordomoai-20";

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION_BASE}\nTAG ATIVA: ${amazonTag}. USUÁRIO ATUAL: ${role}.`,
      responseMimeType: "application/json",
      responseSchema
    }
  });

  return JSON.parse(response.text || "{}");
}
