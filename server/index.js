import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8080;

// Aceita GEMINI_API_KEY e, por compatibilidade, API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
const AMAZON_TAG = process.env.AMAZON_TAG || "mordomoai-20";

function amazonSearchUrl(query, tag = AMAZON_TAG) {
  const q = encodeURIComponent(String(query || "").trim());
  const t = encodeURIComponent(String(tag || "").trim() || "mordomoai-20");
  return `https://www.amazon.com.br/s?k=${q}&tag=${t}`;
}

function clamp(s, n) {
  const x = String(s || "").trim();
  if (!x) return "";
  return x.length > n ? x.slice(0, n - 1).trimEnd() + "…" : x;
}

function fallback(message) {
  return {
    text:
      "Estou online. Se a IA estiver indisponível, sigo te entregando 3 opções via busca segura (Amazon).",
    recommendations: [
      {
        label: "MAIS BARATO",
        title: clamp(`Mais barato: ${message}`, 80),
        why: "Busca mais ampla priorizando preço baixo. Compare avaliações e frete.",
        query: clamp(`${message} barato`, 80),
        priceText: "Preço varia",
        url: amazonSearchUrl(`${message} barato`)
      },
      {
        label: "CUSTO-BENEFÍCIO",
        title: clamp(`Custo-benefício: ${message}`, 80),
        why: "Equilíbrio entre preço e avaliações. Veja nota e número de reviews.",
        query: clamp(`${message} melhor custo benefício`, 80),
        priceText: "Preço varia",
        url: amazonSearchUrl(`${message} melhor custo benefício`)
      },
      {
        label: "PREMIUM",
        title: clamp(`Premium: ${message}`, 80),
        why: "Versões topo de linha. Confirme garantia e vendedor.",
        query: clamp(`${message} premium`, 80),
        priceText: "Preço varia",
        url: amazonSearchUrl(`${message} premium`)
      }
    ]
  };
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    status: "API ativa",
    sdk: "@google/genai",
    hasKey: Boolean(GEMINI_API_KEY),
    amazonTag: AMAZON_TAG
  });
});

app.post("/api/chat", async (req, res) => {
  const message = String(req.body?.message || "").trim();
  const role = String(req.body?.role || "MORDOMO").trim();

  if (!message) return res.status(400).json({ error: "Mensagem vazia." });

  // Se não tiver chave, devolve fallback 200 (nunca quebra)
  if (!GEMINI_API_KEY) {
    return res.status(200).json(fallback(message));
  }

  // IMPORTANTE: use o padrão da doc atual.
  // A doc mostra: const ai = new GoogleGenAI({}); e response.text :contentReference[oaicite:1]{index=1}
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const system = `
Você é o Mordomo.AI (assistente de compras no Brasil).
Objetivo: retornar EXATAMENTE 3 recomendações: MAIS BARATO, CUSTO-BENEFÍCIO, PREMIUM.
Responda SOMENTE em JSON válido.
Formato:
{
  "text":"resumo curto em pt-BR",
  "recommendations":[
    {"label":"MAIS BARATO","title":"...","why":"...","query":"...","priceText":"..."},
    {"label":"CUSTO-BENEFÍCIO","title":"...","why":"...","query":"...","priceText":"..."},
    {"label":"PREMIUM","title":"...","why":"...","query":"...","priceText":"..."}
  ]
}
Regras:
- As 3 opções devem ser diferentes entre si.
- Se não souber preço, use "Preço varia".
- Não invente especificações impossíveis.
`;

  const prompt = `Perfil: ${role}\nPedido do usuário: ${message}`;

  try {
    // Use um modelo estável da família 2.5 (doc oficial usa 2.5 flash). :contentReference[oaicite:2]{index=2}
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: system + "\n\n" + prompt }]
        }
      ]
    });

    const raw = String(response?.text || "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Se não vier JSON perfeito, não quebra: fallback
      return res.status(200).json(fallback(message));
    }

    const recs = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];
    if (recs.length < 3) return res.status(200).json(fallback(message));

    const normalized = recs.slice(0, 3).map((x, i) => {
      const labelRaw = String(x?.label || "").toUpperCase();
      const label =
        labelRaw.includes("PREMIUM")
          ? "PREMIUM"
          : labelRaw.includes("CUSTO")
            ? "CUSTO-BENEFÍCIO"
            : "MAIS BARATO";

      const title = clamp(x?.title || `Opção ${i + 1}: ${message}`, 90);
      const why = clamp(x?.why || "Preço varia; valide reviews e frete.", 140);
      const query = clamp(x?.query || title, 90);
      const priceText = clamp(x?.priceText || "Preço varia", 60);

      return {
        label,
        title,
        why,
        query,
        priceText,
        url: amazonSearchUrl(query)
      };
    });

    return res.status(200).json({
      text: clamp(parsed?.text || "Aqui estão 3 opções para você comparar.", 220),
      recommendations: normalized
    });
  } catch (err) {
    // BLINDAGEM: qualquer erro do Gemini vira fallback 200 (sem “Falha no /api/chat”)
    console.error("Gemini error:", err);
    return res.status(200).json(fallback(message));
  }
});

// Static (Vite build)
const distPath = path.join(__dirname, "..", "web", "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));

app.listen(PORT, () => console.log(`Mordomo.TOP online em :${PORT}`));
