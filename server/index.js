import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8080;

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
const AMAZON_TAG_DEFAULT = (process.env.AMAZON_TAG_DEFAULT || "mordomoai-20").trim();

const FAST_TIMEOUT_MS = Number(process.env.FAST_TIMEOUT_MS || 1200);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000);

const PRO_UNLOCK_CODE = String(process.env.PRO_UNLOCK_CODE || "").trim();
const EXEC_UNLOCK_CODE = String(process.env.EXEC_UNLOCK_CODE || "").trim();

const cache = new Map(); // key -> { at, value }

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

function now() {
  return Date.now();
}
function cacheGet(key) {
  const it = cache.get(key);
  if (!it) return null;
  if (now() - it.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return it.value;
}
function cacheSet(key, value) {
  cache.set(key, { at: now(), value });
  if (cache.size > 500) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

function clip(s, n) {
  const x = String(s || "").trim();
  if (!x) return "";
  return x.length > n ? x.slice(0, n - 1).trimEnd() + "…" : x;
}

function amazonSearchUrl(query, tag) {
  const q = encodeURIComponent(String(query || "").trim());
  const t = encodeURIComponent(String(tag || AMAZON_TAG_DEFAULT || "mordomoai-20").trim());
  return `https://www.amazon.com.br/s?k=${q}&tag=${t}`;
}

function guaranteedFallback(userMessage, amazonTag) {
  const msg = clip(userMessage, 90) || "produto";
  const tag = amazonTag || AMAZON_TAG_DEFAULT;

  return {
    text:
      "Estou online. Vou te entregar 3 opções para comparar. Se a IA estiver lenta, eu sigo com busca segura e links válidos.",
    recommendations: [
      {
        label: "MAIS BARATO",
        title: `Mais barato: ${msg}`,
        why: "Priorize preço baixo e compare frete e avaliações.",
        query: `${msg} barato`,
        priceText: "Preço varia",
        url: amazonSearchUrl(`${msg} barato`, tag),
      },
      {
        label: "CUSTO-BENEFÍCIO",
        title: `Custo-benefício: ${msg}`,
        why: "Equilíbrio entre preço, nota e número de reviews.",
        query: `${msg} melhor custo benefício`,
        priceText: "Preço varia",
        url: amazonSearchUrl(`${msg} melhor custo benefício`, tag),
      },
      {
        label: "PREMIUM",
        title: `Premium: ${msg}`,
        why: "Topo de linha. Verifique garantia e reputação do vendedor.",
        query: `${msg} premium`,
        priceText: "Preço varia",
        url: amazonSearchUrl(`${msg} premium`, tag),
      },
    ],
  };
}

function normalizeResponse(payload, userMessage, amazonTag) {
  const base = guaranteedFallback(userMessage, amazonTag);

  const text = clip(payload?.text || base.text, 520);
  const recs = Array.isArray(payload?.recommendations) ? payload.recommendations : [];

  const fixed = recs.slice(0, 3).map((r, idx) => {
    const labelRaw = String(r?.label || "").toUpperCase();
    const label =
      labelRaw.includes("PREMIUM")
        ? "PREMIUM"
        : labelRaw.includes("CUSTO")
          ? "CUSTO-BENEFÍCIO"
          : "MAIS BARATO";

    const title = clip(r?.title || base.recommendations[idx]?.title, 120) || base.recommendations[idx].title;
    const why = clip(r?.why || base.recommendations[idx]?.why, 240) || base.recommendations[idx].why;
    const query = clip(r?.query || title, 140) || title;
    const priceText = clip(r?.priceText || "Preço varia", 60) || "Preço varia";

    return {
      label,
      title,
      why,
      query,
      priceText,
      url: amazonSearchUrl(query, amazonTag || AMAZON_TAG_DEFAULT),
    };
  });

  while (fixed.length < 3) fixed.push(base.recommendations[fixed.length]);
  return { text, recommendations: fixed };
}

async function callGeminiJSON(message, role, plan) {
  const system = `
Você é o Mordomo.AI (assistente de compras no Brasil).
Retorne SOMENTE JSON válido no formato:
{
 "text":"resumo curto e objetivo",
 "recommendations":[
  {"label":"MAIS BARATO","title":"...","why":"...","query":"...","priceText":"..."},
  {"label":"CUSTO-BENEFÍCIO","title":"...","why":"...","query":"...","priceText":"..."},
  {"label":"PREMIUM","title":"...","why":"...","query":"...","priceText":"..."}
 ]
}

Regras:
- Sempre 3 recomendações diferentes
- Se não souber preço: "Preço varia"
- "query" curta e direta (sem URL)
- Modo do plano:
  - FREE: mais curto, sem detalhes longos
  - PRO: justifica com critérios (nota/reviews/frete/garantia)
  - EXEC: entrega decisão e próximos passos (checklist)
`;

  const user = `Perfil: ${role}\nPlano: ${plan}\nPedido: ${message}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: system + "\n\n" + user }] }],
  });

  const raw = String(response?.text || "").trim();
  return JSON.parse(raw);
}

// Health
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    status: "API ativa",
    hasKey: Boolean(GEMINI_API_KEY),
    amazonTagDefault: AMAZON_TAG_DEFAULT,
    fastTimeoutMs: FAST_TIMEOUT_MS,
    cacheTtlMs: CACHE_TTL_MS,
  });
});

// Entitlement simples (por código)
app.post("/api/unlock", (req, res) => {
  const plan = String(req.body?.plan || "").toUpperCase();
  const code = String(req.body?.code || "").trim();

  if (plan === "PRO" && PRO_UNLOCK_CODE && code === PRO_UNLOCK_CODE) {
    return res.status(200).json({ ok: true });
  }
  if (plan === "EXEC" && EXEC_UNLOCK_CODE && code === EXEC_UNLOCK_CODE) {
    return res.status(200).json({ ok: true });
  }
  return res.status(200).json({ ok: false });
});

// Chat
app.post("/api/chat", async (req, res) => {
  const message = String(req.body?.message || "").trim();
  const role = String(req.body?.role || "MORDOMO").trim();
  const plan = String(req.body?.plan || "FREE").trim().toUpperCase();
  const amazonTag = String(req.body?.affiliate?.amazonTag || "").trim();

  if (!message) {
    return res.status(200).json(normalizeResponse({ text: "Digite um produto para começar.", recommendations: [] }, "", amazonTag));
  }

  // cache key (inclui plano + amazonTag)
  const key = `${plan}::${role}::${amazonTag || AMAZON_TAG_DEFAULT}::${message}`.toLowerCase();
  const cached = cacheGet(key);
  if (cached) return res.status(200).json(cached);

  // Sem chave => fallback rápido
  if (!ai) {
    const out = normalizeResponse(null, message, amazonTag);
    cacheSet(key, out);
    return res.status(200).json(out);
  }

  const fallbackFast = () => normalizeResponse(null, message, amazonTag);

  try {
    const result = await Promise.race([
      (async () => {
        const parsed = await callGeminiJSON(message, role, plan);
        return normalizeResponse(parsed, message, amazonTag);
      })(),
      new Promise((resolve) => setTimeout(() => resolve(fallbackFast()), FAST_TIMEOUT_MS)),
    ]);

    cacheSet(key, result);
    return res.status(200).json(result);
  } catch (err) {
    console.error("ERROR /api/chat:", err);
    const out = fallbackFast();
    cacheSet(key, out);
    return res.status(200).json(out);
  }
});

// Servir front
const distPath = path.join(__dirname, "..", "web", "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));

app.listen(PORT, () => console.log(`Mordomo.TOP online em :${PORT}`));
