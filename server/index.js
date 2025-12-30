import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 dist fica na RAIZ do projeto
const distPath = path.join(__dirname, "..", "dist");

// Serve arquivos estáticos (CSS, JS, assets)
app.use(express.static(distPath));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Cloud Run PORT
const port = Number(process.env.PORT || 8080);
app.listen(port, "0.0.0.0", () =>
  console.log("🚀 Mordomo rodando na porta", port)
);
