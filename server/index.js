import express from "express";
import path from "path";
import crypto from "crypto";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    hasKey: Boolean(process.env.API_KEY),
    fastTimeoutMs: Number(process.env.FAST_TIMEOUT_MS || 1200),
    cacheTtlMs: Number(process.env.CACHE_TTL_MS || 600000),
    amazonTagDefault: process.env.AMAZON_TAG_DEFAULT || null,
    time: new Date().toISOString(),
  });
});

const cache = new Map(); // key -> { ts, value }
function cacheGet(key) {
  const ttl = Number(process.env.CACHE_TTL_MS || 600000);
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > ttl) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}
function cacheSet(key, value) {
  cache.set(key, { ts: Date.now(), value });
}

function sha1(input) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function buildAmazonSearchUrl(query, tag) {
  const q = encodeURIComponent(query || "");
  const base = `https://www.amazon.com.br/s?k=${q}`;
  if (!tag) return base;
  return `${base}&tag=${encodeURIComponent(tag)}`;
}

function safeNumber(n, fallback) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

async function callGemini({ prompt, timeoutMs }) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return { ok: false, error: "API_KEY ausente no Cloud Run (Variáveis de ambiente)." };
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: 1100,
        },
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return {
        ok: false,
        error: data?.error?.message || `Gemini erro HTTP ${resp.status}`,
        raw: data,
      };
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";

    return { ok: true, text };
  } catch (e) {
    const msg =
      e?.name === "AbortError" ? `Timeout de ${timeoutMs}ms na IA` : e?.message || "Erro ao chamar Gemini";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

function planConfig(plan) {
  if (plan === "exec") return { cards: 7, persona: "EXECUTIVO" };
  if (plan === "pro") return { cards: 5, persona: "PROFISSIONAL" };
  return { cards: 3, persona: "GRÁTIS" };
}

app.post("/api/chat", async (req, res) => {
  const t0 = Date.now();

  const message = String(req.body?.message || "").trim();
  const plan = String(req.body?.plan || "free").toLowerCase();
  const amazonTagFromUser = String(req.body?.amazonTag || "").trim();

  if (!message) return res.status(400).json({ ok: false, error: "Mensagem vazia." });

  const amazonTagUsed =
    amazonTagFromUser || process.env.AMAZON_TAG_DEFAULT || "mordomoai-20";

  const timeoutMs = safeNumber(process.env.FAST_TIMEOUT_MS, 1200);
  const cfg = planConfig(plan);

  const cacheKey = sha1(JSON.stringify({ message, plan, amazonTagUsed }));
  const cached = cacheGet(cacheKey);
  if (cached) {
    return res.json({
      ...cached,
      meta: { ...cached.meta, cached: true, ms: Date.now() - t0 },
    });
  }

  const persona =
    plan === "exec"
      ? `Você é o Mordomo Executivo. Seja extremamente objetivo e estratégico. Entregue decisão, trade-offs, riscos, checklist e recomendação final.`
      : plan === "pro"
      ? `Você é o Mordomo Profissional. Seja técnico e comparativo. Entregue filtros sugeridos e opções práticas.`
      : `Você é o Mordomo Grátis. Seja simples e direto, sem jargões.`;

  const extraJSON =
    plan === "exec"
      ? `"exec": {"strategy": "texto curto (2-4 frases)", "risks": ["...","..."], "checklist": ["...","...","..."]}`
      : plan === "pro"
      ? `"pro": {"filters": ["...","...","..."]}`
      : "";

  const prompt = `
${persona}

Tarefa: o usuário quer comprar/aprender algo. Gere ${cfg.cards} opções.
Regras:
- Sempre usar PT-BR.
- Sempre retornar JSON puro (sem markdown, sem texto fora).
- Cada card deve ter: badge, title, priceRange, bullets(3 itens).

Formato:
{
  "reply": "resposta curta (1-3 frases)",
  "cards": [
    {"badge":"...","title":"...","priceRange":"R$ ... - R$ ...","bullets":["...","...","..."] }
  ]
  ${extraJSON ? "," + extraJSON : ""}
}

Badges sugeridos (use os 3 primeiros pelo menos):
MAIS BARATO, CUSTO-BENEFÍCIO, PREMIUM
Demais badges (se houver): OPÇÃO 4, OPÇÃO 5, etc.

Usuário: ${JSON.stringify(message)}
`;

  const ai = await callGemini({ prompt, timeoutMs });

  if (!ai.ok) {
    const out = {
      ok: false,
      plan,
      reply: "Estou online, mas não consegui gerar as opções agora. Tente novamente em alguns segundos.",
      cards: [],
      meta: { cached: false, ms: Date.now() - t0, amazonTagUsed },
      error: ai.error,
    };
    cacheSet(cacheKey, out);
    return res.status(200).json(out);
  }

  let parsed = null;
  try {
    parsed = JSON.parse(ai.text);
  } catch {
    parsed = { reply: ai.text?.slice(0, 400) || "Ok.", cards: [] };
  }

  const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
  const cardsWithUrls = cards.slice(0, cfg.cards).map((c, i) => {
    const title = String(c?.title || `Opção ${i + 1}`);
    return {
      badge: String(c?.badge || `OPÇÃO ${i + 1}`).toUpperCase(),
      title,
      priceRange: String(c?.priceRange || ""),
      bullets: Array.isArray(c?.bullets) ? c.bullets.map(String).slice(0, 6) : [],
      url: buildAmazonSearchUrl(title, amazonTagUsed),
    };
  });

  const out = {
    ok: true,
    plan,
    reply: String(parsed.reply || "").trim() || "Aqui vão minhas melhores opções.",
    cards: cardsWithUrls,
    pro: plan === "pro" ? (parsed.pro || { filters: [] }) : undefined,
    exec: plan === "exec" ? (parsed.exec || { strategy: "", risks: [], checklist: [] }) : undefined,
    meta: { cached: false, ms: Date.now() - t0, amazonTagUsed },
  };

  cacheSet(cacheKey, out);
  return res.json(out);
});

// Static do Vite
const __dirnameFix = path.dirname(new URL(import.meta.url).pathname);
const webDist = path.join(__dirnameFix, "..", "web", "dist");
app.use(express.static(webDist));

app.get("*", (_req, res) => {
  res.sendFile(path.join(webDist, "index.html"));
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log("Mordomo.top server up on port", port));
