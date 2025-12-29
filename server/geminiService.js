// server/geminiService.js
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Você é o Mordomo.AI do Mordomo.top.
NUNCA retorne links/URLs. NUNCA invente link.
Sempre devolva 4 itens:
- 1 "MAIS BARATO"
- 3 opções ("OPÇÃO 1", "OPÇÃO 2", "OPÇÃO 3")
Para cada item, devolva:
- title
- query (termo curto para busca na Amazon.com.br)
- why (por que é bom)
- priceHint (opcional)
Fala (speech): no máximo 2 frases.
`.trim();

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    speech: { type: Type.STRING },
    emotion: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          rank: { type: Type.NUMBER },
          rotulo: { type: Type.STRING },
          title: { type: Type.STRING },
          query: { type: Type.STRING },
          why: { type: Type.STRING },
          priceHint: { type: Type.STRING, nullable: true }
        },
        required: ["rank", "rotulo", "title", "query", "why"]
      }
    }
  },
  required: ["speech", "items"]
};

export async function runGemini({ message, role }) {
  // ✅ NÃO derrubar container no startup
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // erro controlado: backend sobe, mas /api/chat responde com mensagem clara
    throw new Error("API_KEY ausente no Cloud Run. Configure a variável de ambiente API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const model = String(role).includes("EXEC")
    ? "gemini-3-pro-preview"
    : "gemini-3-flash-preview";

  const response = await ai.models.generateContent({
    model,
    contents: message,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema
    }
  });

  const text = response?.text || "{}";

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { speech: "Falha ao interpretar a resposta da IA.", items: [] };
  }

  if (!parsed.speech) parsed.speech = "Ok. Diga marca, modelo e detalhes do que você quer.";
  if (!Array.isArray(parsed.items)) parsed.items = [];

  return parsed;
}
