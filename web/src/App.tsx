import React, { useState } from "react";
import type { AIResponse, UserRole } from "./types";
import { ChatInterface } from "./components/ChatInterface";

export default function App() {
  const [role, setRole] = useState<UserRole>("MORDOMO");
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSend = async (msg: string) => {
    setIsLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, role })
      });

      const data = await r.json().catch(() => ({}));

      // Mesmo que o backend responda 200 sempre, isso fica robusto.
      if (!r.ok) {
        setLastResponse({
          text: data?.error ? String(data.error) : `Erro HTTP ${r.status} no /api/chat`,
          recommendations: []
        });
        return;
      }

      setLastResponse({
        text: String(data?.text || ""),
        recommendations: Array.isArray(data?.recommendations) ? data.recommendations : []
      });
    } catch (e: any) {
      setLastResponse({
        text: "Falha de rede. Verifique se o serviço do Cloud Run está público e se não há bloqueio de CORS.",
        recommendations: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <ChatInterface role={role} onSend={onSend} lastResponse={lastResponse} isLoading={isLoading} />

      <div style={{ position: "fixed", right: 18, top: 18, display: "flex", gap: 8 }}>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff",
            padding: "8px 10px",
            borderRadius: 10,
            outline: "none"
          }}
        >
          <option value="MORDOMO">Mordomo</option>
          <option value="AFILIADO">Afiliado</option>
          <option value="PRO">Pro</option>
        </select>
      </div>
    </div>
  );
}
