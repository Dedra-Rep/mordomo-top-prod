import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("Missing API_KEY env var");
  }
  return new GoogleGenAI({ apiKey: key });
};

const SYSTEM_INSTRUCTION_BASE = `
Você é o Mordomo.AI.
OBJETIVO: ajudar o usuário a decidir compras com clareza.
Retorne sempre JSON válido conforme o schema.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    speech: { type: Type.STRING },
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          rotulo: { type: Type.STRING },
          nome: { type: Type.STRING },
          porque: { type: Type.STRING },
          link_afiliado: { type: Type.STRING }
        },
        required: ["rotulo", "nome", "link_afiliado"]
      }
    }
  },
  required: ["speech", "results"]
};

export async function processUserRequest(prompt, role = "FREE", affiliateIds = {}) {
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const raw = response?.text || "{}";
    const data = JSON.parse(raw);

    if (!Array.isArray(data.results)) {
      data.results = [];
    }

    return {
      speech: data.speech || `Você pediu: ${prompt}.`,
      results: data.results
    };
  } catch (err) {
    console.error("Gemini error:", err);
    return {
      speech: "Tive um problema ao gerar a resposta, mas já estou pronto para tentar novamente.",
      results: []
    };
  }
}
