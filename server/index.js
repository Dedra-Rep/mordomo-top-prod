import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { processUserRequest } from "./geminiService.js";

const app = express();
const PORT = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚠️ Este caminho é crítico: seu Vite build precisa gerar /dist na raiz do container
const DIST_PATH = path.join(__dirname, "../dist");

// 1) JSON para receber payload do chat
app.use(express.json({ limit: "1mb" }));

// 2) Servir frontend estático
app.use(express.static(DIST_PATH));

// 3) Healthcheck
app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok" });
});

// 4) CHAT API (front chama aqui)
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt, role, affiliateIds } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt_required" });
    }

    const safeRole = typeof role === "string" ? role : "FREE";
    const safeAffiliateIds =
      affiliateIds && typeof affiliateIds === "object" ? affiliateIds : {};

    const aiResponse = await processUserRequest(prompt, safeRole, safeAffiliateIds);
    return res.json(aiResponse);
  } catch (err) {
    console.error("API /api/chat error:", err);
    return res.status(500).json({ error: "ai_error" });
  }
});

// 5) SPA fallback
app.get("*", (_, res) => {
  res.sendFile(path.join(DIST_PATH, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Mordomo rodando na porta ${PORT}`);
});
