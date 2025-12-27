import express from "express";

const app = express();
app.use(express.json({ limit: "1mb" }));

// Healthcheck (Cloud Run / monitoramento)
app.get("/health", (req, res) => res.status(200).send("ok"));

// Página base de produção
app.get("/", (req, res) => {
  res.status(200).send(`
    <html>
      <head><title>Mordomo.top</title></head>
      <body style="font-family: Arial; padding: 24px;">
        <h1>Mordomo.top — Produção</h1>
        <p>Base profissional ativa.</p>
        <p><a href="/health">/health</a></p>
      </body>
    </html>
  `);
});

// Endpoint base (IA entra depois)
app.post("/api/chat", async (req, res) => {
  const { message } = req.body || {};
  res.json({
    ok: true,
    reply: `Base de produção ativa. Mensagem recebida: ${message ?? "(vazia)"}`
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
