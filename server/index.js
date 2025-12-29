// server/index.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { runGemini } from "./geminiService.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Healthcheck (Cloud Run gosta disso)
app.get("/health", (_, res) => res.status(200).send("ok"));

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

// serve estáticos
app.use(express.static(distPath));

// ✅ SPA fallback: qualquer rota volta pro index.html
app.get("*", (_, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ✅ Cloud Run: obrigatoriamente process.env.PORT
const PORT = Number(process.env.PORT || 8080);

// ✅ bind 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Mordomo rodando na porta ${PORT}`);
});
