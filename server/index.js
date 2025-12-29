// server/index.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { runGemini } from "./geminiService.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Healthcheck
app.get("/health", (_req, res) => res.status(200).send("ok"));

// API
app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.prompt || req.body?.message || req.body?.text || "";
    const role = req.body?.role || "CUSTOMER";

    if (!String(message).trim()) {
      return res.status(400).json({ error: "Mensagem vazia." });
    }

    const data = await runGemini({ message, role });
    return res.json(data);
  } catch (err) {
    console.error("Erro /api/chat:", err);
    return res.status(500).json({ error: err?.message || "Erro interno no /api/chat" });
  }
});

// ===============================
// FRONTEND (Vite / React)
// ===============================
const distPath = path.join(__dirname, "..", "web", "dist");

// Serve estáticos do Vite build
app.use(express.static(distPath));

// SPA fallback (evita 404 em rotas)
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Cloud Run: obrigatório
const PORT = Number(process.env.PORT || 8080);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Mordomo rodando na porta ${PORT}`);
});
