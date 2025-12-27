import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 8080;

// Resolver __dirname em ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do build do Vite
const DIST_PATH = path.join(__dirname, "../dist");

// Servir arquivos estáticos do frontend
app.use(express.static(DIST_PATH));

// Healthcheck (mantém o que já funciona)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Qualquer rota → React
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_PATH, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Mordomo rodando na porta ${PORT}`);
});
