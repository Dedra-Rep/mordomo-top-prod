import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import geminiService from "./geminiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// ============================
// API
// ============================
app.post("/api/chat", async (req, res) => {
  try {
    const result = await geminiService(req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno no /api/chat" });
  }
});

// ============================
// FRONTEND (Vite build)
// ============================
// ATENÇÃO: o build será copiado para /app/dist
const distPath = path.join(__dirname, "dist");

app.use(express.static(distPath));

// SPA fallback (CRÍTICO)
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ============================
app.listen(PORT, () => {
  console.log(`🚀 Mordomo rodando na porta ${PORT}`);
});
