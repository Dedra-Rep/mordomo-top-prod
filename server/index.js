import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8080;

// Aceita ambos para compatibilidade: GEMINI_API_KEY (preferido) e API_KEY (legado)
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
const AMAZON_TAG = (process.env.AMAZON_TAG || "mordomoai-20").trim();

function amazonSearchUrl(query, tag = AMAZON_TAG) {
  const q = encodeURIComponent(String(query || "").trim());
  const t = encodeURIComponent(String(tag || "").trim() || "mordomoai-20");
  return `https://www.amazon.com.br/s?k=${q}&tag=${t}`;
}

function clip(s, n) {
  const x = String(s || "").trim();
  if (!x) return "";
  return x.length > n ? x.slice(0, n - 1).trimEnd() + "…" : x;
}

/**
 * Resposta padrão garantida (nunca quebra o front).
 * Sempre retorna 3 recomendações.
 */
function guaranteedFallback(userMessage) {
  const msg = clip(userMessage, 90) || "produto";
  return {
    text:
      "Estou online. Vou te entregar 3 opções para comparar. Se a IA estiver instável, eu continuo sugerindo com busca segura.",
    recommendations: [
      {
        label: "MAIS BARATO",
        title: `Mais barato: ${msg}`,
        why: "Priorize preço baixo e compare frete e avaliações.",
        query: `${msg} barato`,
        priceText: "Preço varia",
        url: amazonSearchUrl(`${msg} barato`),
      },
      {
        label: "CUSTO-BENEFÍCIO",
        title: `Custo-benefício: ${msg}`,
        why: "Equilíbrio entre preço, nota e número de reviews.",
        query: `${msg} melhor custo benefício`,
        priceText: "Preço varia",
        url: amazonSearchUrl(`${msg} melhor custo benefício`),
      },
      {
        label: "PREMIUM",
        title: `Premium: ${msg}`,
        why: "Topo de linha. Verifique garantia e reputação do vendedor.",
        query: `${msg} premium`,
        priceText: "Preço varia",
        url: amazonSearchUrl(`${msg} premium`),
      },
    ],
  };
}

/**
 * Normaliza qualquer saída (IA ou fallback) para o formato do front.
 */
function normalizeResponse(payload, userMessage) {
  const base = guaranteedFallback(userMessage);

  const text = clip(payload?.text || base.text, 400);
  const recs = Array.isArray(payload?.recommendations) ? payload.recommendations : [];

  // Garante 3 itens, com labels padronizados.
  const fixed = recs.slice(0, 3).map((r, idx) => {
    const labelRaw = String(r?.label || "").toUpperCase();
    const label =
      labelRaw.includes("PREMIUM")
        ? "PREMIUM"
        : labelRaw.includes("CUSTO")
          ? "CUSTO-BENEFÍCIO"
          : "MAIS BARATO";

    const title = clip(r?.title || base.recommendations[idx]?.title, 110) || base.recommendations[idx].title;
    const why = clip(r?.why || base.recommendations[idx]?.why, 180) || base.recommendations[idx].why;
    const query = clip(r?.query || title, 120) || title;
    const priceText = clip(r?.priceText || "Preço varia", 60) || "Preço varia";

    return {
      label,
      title,
      why,
      query,
      priceText,
      url: amazonSearchUrl(query),
    };
  });

  // Se IA vier com menos de 3, completa com fallback
  while (fixed.length < 3) fixed.push(base.recommendations[fixed.length]);

  return { text, recommendations: fixed };
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    status: "API ativa",
    hasKey: Boolean(GEMINI_API_KEY),
    amazonTag: AMAZON_TAG,
  });
});

/**
 * Endpoint principal que seu layout já chama.
 * Contrato: { message: string, role?: string }
 * Retorno: { text: string, recommendations: [] }
 */
app.post("/api/chat", async (req, res) => {
  const message = String(req.body?.message || "").trim();
  const role = String(req.body?.role || "MORDOMO").trim();

  if (!message) {
    return res.status(200).json(normalizeResponse({ text: "Digite um produto para começar.", recommendations: [] }, ""));
  }

  // Sem chave? Não quebra: devolve fallback 200
  if (!GEMINI_API_KEY) {
    return res.status(200).json(normalizeResponse(null, message));
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Prompt ultra-objetivo, focado em JSON estável.
  const system = `
Você é o Mordomo.AI (assistente de compras no Brasil).
Você deve retornar SOMENTE JSON válido no formato:
{
 "text": "resumo curto",
 "recommendations": [
   {"label":"MAIS BARATO","title":"...","why":"...","query":"...","priceText":"..."},
   {"label":"CUSTO-BENEFÍCIO","title":"...","why":"...","query":"...","priceText":"..."},
   {"label":"PREMIUM","title":"...","why":"...","query":"...","priceText":"..."}
 ]
}
Regras:
- Sempre 3 recomendações, diferentes entre si.
- Não invente especificações impossíveis.
- Se não souber preço: "Preço varia".
- query deve ser curta e direta.
`;

  const user = `Perfil: ${role}\nPedido: ${message}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: system + "\n\n" + user }] }],
    });

    const raw = String(response?.text || "").trim();

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // IA não retornou JSON limpo. Não quebra.
      parsed = null;
    }

    return res.status(200).json(normalizeResponse(parsed, message));
  } catch (err) {
    console.error("ERROR /api/chat:", err);
    return res.status(200).json(normalizeResponse(null, message));
  }
});

/**
 * Servir o frontend já existente (SEM MEXER NO LAYOUT).
 */
const distPath = path.join(__dirname, "..", "web", "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));

app.listen(PORT, () => console.log(`Mordomo.TOP online em :${PORT}`));
