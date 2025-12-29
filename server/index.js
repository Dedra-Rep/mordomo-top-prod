import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 8080;

// ===== Fix para ES Modules =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Middlewares =====
app.use(express.json());

// ================================
// API (MANTENHA SUA LÓGICA ATUAL)
// ================================
app.post("/api/chat", async (req, res) => {
  try {
    // 👉 se você já tem lógica aqui, mantenha
    res.json({ speech: "API ativa", items: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno no /api/chat" });
  }
});

// ================================
// FRONTEND (Vite / React)
// ================================
const distPath = path.join(__dirname, "..", "web", "dist");

// Serve arquivos estáticos
app.use(express.static(distPath));

// SPA fallback — ESSENCIAL PARA NÃO DAR 404
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ================================
app.listen(PORT, () => {
  console.log(`🚀 Mordomo rodando na porta ${PORT}`);
});
