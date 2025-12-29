// server/index.js (ESM safe)
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json({ limit: "1mb" }));

// Healthcheck (Cloud Run)
app.get("/healthz", (_, res) => res.status(200).send("ok"));

// ===============================
// FRONTEND (Vite / React)
// ===============================

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// candidatos para pasta do Vite (cobre seus cenários)
const candidates = [
  path.join(process.cwd(), "dist"),
  path.join(process.cwd(), "web", "dist"),
  path.join(__dirname, "..", "dist"),
  path.join(__dirname, "..", "web", "dist"),
];

const distPath = candidates.find((p) => fs.existsSync(p)) || null;

if (distPath) {
  app.use(express.static(distPath));

  // SPA fallback
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Mesmo sem dist, o servidor SOBE (isso evita "not ready")
  app.get("*", (_, res) => {
    res.status(200).send("Servidor ok. Frontend ainda não gerado (dist não encontrado).");
  });
}

// Cloud Run precisa ouvir na porta PORT (8080)
const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Mordomo rodando na porta ${PORT}`);
});
