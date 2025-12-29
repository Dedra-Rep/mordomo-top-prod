import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));

// --- env ---
const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.API_KEY ||
  "";

const AMAZON_TAG = process.env.AMAZON_TAG || "mordomoai-20";

// --- helpers ---
function amazonSearchUrl(query, tag = AMAZON_TAG) {
  const q = encodeURIComponent(String(query || "").trim());
  const t = encodeURIComponent(String(tag || "").trim() || "mordomoai-20");
  // Busca Amazon com sua tag
  return `https://www.amazon.com.br/s?k=${q}&tag=${t}`;
}

function clampText(s, max = 140) {
  const x = String(s || "").trim();
  if (!x) return "";
  return x.length > max ? x.slice(0, max - 1).trimEnd() + "…" : x;
}

// --- API health ---
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    status: "API ativa",
    model: "gemini",
    hasKey: Boolean(GEMINI_API_KEY),
    amazonTag: AMAZON_TAG
  });
});

// --- chat ---
app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    const role = String(req.body?.role || "MORDOMO").trim();

    if (!message) {
      return res.status(400).json({ error: "Mensagem vazia." });
    }

    // Se não tiver chave, devolve resposta útil (não “morta”)
    if (!GEMINI_API_KEY) {
      const base = [
        {
          label: "MAIS BARATO",
          title: `Busca: ${message}`,
          priceText: "Defina sua chave GEMINI_API_KEY no Cloud Run para receber recomendações com IA.",
          url: amazonSearchUrl(message)
        },
        {
          label: "CUSTO-BENEFÍCIO",
          title: `Busca: ${message}`,
          priceText: "Após configurar GEMINI_API_KEY, eu devolvo 3 opções com contexto e filtros.",
          url: amazonSearchUrl(message)
        },
        {
          label: "PREMIUM",
          title: `Busca: ${message}`,
          priceText: "Enquanto isso, clique para ver resultados direto na Amazon.",
          url: amazonSearchUrl(message)
        }
      ];
      return res.json({
        text: "A API está online, mas falta configurar a chave GEMINI_API_KEY no Cloud Run para eu montar as 3 melhores opções automaticamente.",
        recommendations: base
      });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Pedimos JSON estrito, para o front renderizar sempre.
    const system = `
Você é o Mordomo.AI (assistente de compras).
Sua função: retornar EXATAMENTE 3 recomendações: MAIS BARATO, CUSTO-BENEFÍCIO, PREMIUM.
Responda SOMENTE em JSON válido, sem texto fora do JSON.
Formato:
{
  "text": "resumo curto e útil em pt-BR",
  "recommendations": [
    {
      "label": "MAIS BARATO" | "CUSTO-BENEFÍCIO" | "PREMIUM",
      "title": "nome do produto com detalhes relevantes",
      "why": "por que essa opção faz sentido",
      "query": "consulta curta para buscar na Amazon",
      "priceText": "faixa de preço estimada ou alerta de variação (se não souber, escreva 'Preço varia')"
    }
  ]
}
Regras:
- As 3 opções devem ser diferentes entre si.
- Se o pedido for vago, faça 1 pergunta de esclarecimento dentro de "text" e ainda assim forneça 3 palpites com disclaimers em "why".
- Não invente especificações impossíveis; prefira linguagem de mercado.
`;

    const userPrompt = `
Contexto: usuário no Brasil, e-commerce e afiliados.
Perfil: ${role}
Pedido do usuário: ${message}
`;

    const r = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { role: "user", parts: [{ text: system + "\n\n" + userPrompt }] }
      ]
    });

    const raw = r?.text || "";
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      // fallback robusto caso o modelo não retorne JSON perfeito
      parsed = {
        text: "Encontrei opções, mas houve variação no formato de resposta. Seguem 3 buscas seguras.",
        recommendations: [
          {
            label: "MAIS BARATO",
            title: `Melhor preço: ${message}`,
            why: "Busca ampla priorizando menor preço.",
            query: `${message} barato`,
            priceText: "Preço varia"
          },
          {
            label: "CUSTO-BENEFÍCIO",
            title: `Custo-benefício: ${message}`,
            why: "Busca equilibrando avaliações e preço.",
            query: `${message} melhor custo benefício`,
            priceText: "Preço varia"
          },
          {
            label: "PREMIUM",
            title: `Premium: ${message}`,
            why: "Busca por versões topo de linha.",
            query: `${message} premium`,
            priceText: "Preço varia"
          }
        ]
      };
    }

    const recs = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];
    const normalized = recs.slice(0, 3).map((x, i) => {
      const label = String(x?.label || "").toUpperCase().includes("PREMIUM")
        ? "PREMIUM"
        : String(x?.label || "").toUpperCase().includes("CUSTO")
          ? "CUSTO-BENEFÍCIO"
          : "MAIS BARATO";

      const title = clampText(x?.title || `Opção ${i + 1}: ${message}`, 90);
      const why = clampText(x?.why || "Preço varia; valide avaliações e vendedor.", 120);
      const query = clampText(x?.query || title, 80);
      const priceText = clampText(x?.priceText || "Preço varia", 60);

      return {
        label,
        title,
        why,
        query,
        priceText,
        url: amazonSearchUrl(query)
      };
    });

    // Garantia: sempre 3 cards
    while (normalized.length < 3) {
      const suffix = normalized.length === 0 ? "barato" : normalized.length === 1 ? "custo benefício" : "premium";
      normalized.push({
        label: normalized.length === 0 ? "MAIS BARATO" : normalized.length === 1 ? "CUSTO-BENEFÍCIO" : "PREMIUM",
        title: `${message} (${suffix})`,
        why: "Sugestão automática para completar as 3 opções.",
        query: `${message} ${suffix}`,
        priceText: "Preço varia",
        url: amazonSearchUrl(`${message} ${suffix}`)
      });
    }

    res.json({
      text: String(parsed?.text || "Aqui estão 3 opções para você comparar.").trim(),
      recommendations: normalized
    });
  } catch (err) {
    res.status(500).json({
      error: "Falha no /api/chat",
      details: String(err?.message || err)
    });
  }
});

// --- static web (Vite build) ---
const distPath = path.join(__dirname, "..", "web", "dist");
app.use(express.static(distPath));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Mordomo.TOP online em :${PORT}`);
});
