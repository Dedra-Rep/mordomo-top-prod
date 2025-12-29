// server/geminiService.js
import { GoogleGenAI, Type } from "@google/genai";

/**
 * IMPORTANTE:
 * - NÃO pode quebrar o container no startup.
 * - Se API_KEY estiver ausente, devolve erro APENAS no /api/chat.
 */

const SYSTEM_INSTRUCTION_BASE = `
Você é o Mordomo.AI (mascote do Mordomo.top).
OBJETIVO: Maximizar decisão de compra rápida através de buscas cirúrgicas na Amazon Brasil.

REGRAS DE OURO:
1. PROIBIÇÃO DE LINKS: Você JAMAIS deve inventar ou retornar URLs, domínios ou links.
2. TERMO DE BUSCA (query): Para cada produto, forneça um termo de busca curto, específico e otimizado para a Amazon.com.br.
3. ESPELHO DO PEDIDO: Comece sempre com "Você pediu: {resumo}".
4. FORMATO FIXO: 1 Mais barato + 3 Opções.
5. FALA: Máximo 2 frases curtas. Resuma as opções na fala.

CONHECIMENTO DE PRODUTOS PRÓPRIOS (MORDOMO.TOP):
1. Plano Grátis: Assistente de compras.
2. Plano Profissional (Upgrade): US$ 20/mês. IDs customizados.
3. Plano Executivo (Elite): US$ 50/mês. Mentoria Gemini Pro e estratégias avançadas.
`.trim();

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    mode: { type: Type.STRING },
    pedido_do_cliente: { type: Type.STRING },
    entendimento: { type: Type.STRING },
    perguntas: { type: Type.ARRAY, items: { type: Type.STRING } },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          rank: { type: Type.NUMBER },
          rotulo: { type: Type.STRING },
          title: { type: Type.STRING },
          query: { type: Type.STRING, description: "Termo de busca curto e preciso para Amazon.com.br" },
          why: { type: Type.STRING },
          priceHint: { type: Type.STRING, nullable: true }
        },
        required: ["rank", "rotulo", "title", "query", "why"]
      }
    },
    speech: { type: Type.STRING },
    emotion: { type: Type.STRING }
  },
  required: ["mode", "pedido_do_cliente", "speech", "items"]
};

function getModelName(role) {
  // Mantém compatível com seus enums do frontend:
  // CUSTOMER / AFFILIATE_PRO / AFFILIATE_EXEC
  if (String(role).includes("EXEC")) return "gemini-3-pro-preview";
  return "gemini-3-flash-preview";
}

export async function runGemini({ message, role }) {
  const apiKey = process.env.API_KEY;

  // ✅ não derruba o servidor; apenas retorna erro controlado
  if (!apiKey) {
    throw new Error("API_KEY ausente no Cloud Run. Configure a variável de ambiente API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = getModelName(role);

  const response = await ai.models.generateContent({
    model,
    contents: message,
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION_BASE}\nUSUÁRIO ATUAL: ${role}.`,
      responseMimeType: "application/json",
      responseSchema
    }
  });

  const text = response?.text || "{}";
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { speech: "Falha ao interpretar resposta da IA.", items: [], mode: "fallback", pedido_do_cliente: "" };
  }

  // ✅ garante o formato mínimo para o frontend
  if (!parsed.speech) parsed.speech = "Ok. Diga o produto com marca, modelo e detalhes.";
  if (!Array.isArray(parsed.items)) parsed.items = [];

  return parsed;
}
