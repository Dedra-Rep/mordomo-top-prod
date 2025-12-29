// server/index.js
import express from "express";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json({ limit: "1mb" }));

// Healthcheck (Cloud Run)
app.get("/healthz", (_, res) => res.status(200).send("ok"));

// ===============================
// 1) API (mantenha suas rotas aqui)
// ===============================
// Se você já tem /api/chat aqui, mantenha como está.
// (Não estou alterando a lógica do chat para não quebrar nada.)

// ===============================
// 2) FRONTEND (Vite / React)
// ===============================

// Resolve possíveis saídas do Vite:
// - dist/ (na raiz do projeto)
// - web/dist/ (dentro da pasta web)
const candidates = [
  path.join(process.cwd(), "dist"),
  path.join(process.cwd(), "web", "dist"),
  path.join(__dirname, "..", "dist"),
  path.join(__dirname, "..", "web", "dist"),
];

const distPath = candidates.find((p) => fs.existsSync(p)) || null;

if (distPath) {
  app.use(express.static(distPath));

  // SPA fallback — ESSENCIAL para não dar 404 em refresh/rotas
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Se não existir dist, mostre um erro claro (melhor que 404 confuso)
  app.get("*", (_, res) => {
    res
      .status(500)
      .send("Build do frontend não encontrado. Pasta dist/web/dist não existe.");
  });
}

// Cloud Run: obrigatoriamente ouvir em PORT
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Mordomo rodando na porta ${PORT}`);
});
