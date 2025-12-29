import React, { useMemo, useState } from "react";
import type { AIResponse, UserRole, Recommendation } from "../types";
import { buildPlaceholderImage } from "../services/amazonLinks";

type Props = {
  role: UserRole;
  onSend: (msg: string) => void;
  lastResponse: AIResponse | null;
  isLoading: boolean;
};

function badgeClass(label: Recommendation["label"]) {
  if (label === "MAIS BARATO") return { bg: "rgba(16,185,129,0.14)", br: "rgba(16,185,129,0.25)", tx: "#a7f3d0" };
  if (label === "CUSTO-BENEFÍCIO") return { bg: "rgba(56,189,248,0.14)", br: "rgba(56,189,248,0.25)", tx: "#bae6fd" };
  return { bg: "rgba(168,85,247,0.14)", br: "rgba(168,85,247,0.25)", tx: "#e9d5ff" };
}

export const ChatInterface: React.FC<Props> = ({ role, onSend, lastResponse, isLoading }) => {
  const [msg, setMsg] = useState("");

  const subtitle = useMemo(() => {
    return "Encontre produtos com precisão cirúrgica. Diga-me o que você precisa e eu buscarei o melhor preço.";
  }, []);

  const send = () => {
    const text = msg.trim();
    if (!text || isLoading) return;
    onSend(text);
    setMsg("");
  };

  const recs = lastResponse?.recommendations || [];

  return (
    <div style={{ minHeight: "100vh", color: "white" }}>
      <div style={{ maxWidth: 1050, margin: "0 auto", padding: "60px 22px 40px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: -1 }}>À sua total disposição.</div>
          <div style={{ marginTop: 12, color: "rgba(255,255,255,0.72)", fontSize: 16 }}>{subtitle}</div>

          <div style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#34d399", display: "inline-block" }} />
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
              Online (API OK) • Perfil: <b>{role}</b>
            </span>
          </div>
        </div>

        {/* Painel principal (resultado) */}
        <div style={{ marginTop: 32, borderRadius: 22, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Resultado</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                {isLoading ? "Buscando as melhores opções..." : recs.length ? "3 opções para comparar" : "Digite um produto para começar"}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, color: "rgba(255,255,255,0.78)", fontSize: 14, lineHeight: 1.45 }}>
            {isLoading ? "Processando sua solicitação…" : lastResponse?.text || "Exemplo: “bicicleta infantil aro 20” ou “notebook i5 16gb para trabalho”."}
          </div>

          {recs.length > 0 && (
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
              {recs.slice(0, 3).map((it, idx) => {
                const c = badgeClass(it.label);
                const img = buildPlaceholderImage(it.title);

                return (
                  <div key={idx} style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.25)", padding: 12 }}>
                    <div style={{ display: "inline-flex", padding: "6px 10px", borderRadius: 999, border: `1px solid ${c.br}`, background: c.bg, color: c.tx, fontSize: 12, fontWeight: 800 }}>
                      {it.label}
                    </div>

                    <div style={{ marginTop: 10, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.2)", aspectRatio: "1/1" as any }}>
                      <img src={img} alt={it.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>

                    <div style={{ marginTop: 10, fontSize: 14, fontWeight: 800 }}>
                      {it.title}
                    </div>

                    {it.priceText && (
                      <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                        {it.priceText}
                      </div>
                    )}

                    {it.why && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.62)", lineHeight: 1.35 }}>
                        {it.why}
                      </div>
                    )}

                    <a
                      href={it.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        marginTop: 12,
                        display: "inline-flex",
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10px 12px",
                        borderRadius: 14,
                        background: "#fbbf24",
                        color: "#111827",
                        fontWeight: 900,
                        textDecoration: "none"
                      }}
                    >
                      Ver oferta
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", padding: 10 }}>
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="O que você deseja comprar ou aprender agora?"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "white",
              fontSize: 14,
              padding: "10px 10px"
            }}
          />
          <button
            onClick={send}
            disabled={isLoading}
            style={{
              width: 46,
              height: 46,
              borderRadius: 999,
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              background: "#f59e0b",
              color: "#111827",
              fontWeight: 900,
              opacity: isLoading ? 0.55 : 1
            }}
            title="Enviar"
          >
            ➤
          </button>
        </div>

        <div style={{ marginTop: 14, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
          MORDOMO.TOP — Inteligência de Mercado & Mentoria
        </div>
      </div>
    </div>
  );
};
