import React, { useMemo, useState } from "react";
import type { Plan } from "../types";
import { STRIPE_EXEC_URL, STRIPE_PRO_URL } from "../services/subscription";

type Props = {
  open: boolean;
  requestedPlan: Exclude<Plan, "FREE">;
  onClose: () => void;
  onUnlocked: (name: string, email: string, plan: Plan) => void;
};

export const PaywallModal: React.FC<Props> = ({ open, requestedPlan, onClose, onUnlocked }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const payUrl = useMemo(() => {
    return requestedPlan === "EXEC" ? STRIPE_EXEC_URL : STRIPE_PRO_URL;
  }, [requestedPlan]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 999,
        padding: 18,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(720px, 96vw)",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(10,14,30,0.95)",
          color: "#fff",
          padding: 18,
          boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>
              Desbloquear plano {requestedPlan === "EXEC" ? "EXECUTIVO" : "PROFISSIONAL"}
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.72)" }}>
              Para ativar, assine no Stripe e depois confirme aqui (MVP). Em seguida o Mordomo libera a área de IDs e o link do assinante.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Fechar
          </button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              style={{
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                outline: "none",
              }}
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              style={{
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              href={payUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: "none",
                padding: "12px 14px",
                borderRadius: 12,
                background: "#f59e0b",
                color: "#111827",
                fontWeight: 900,
              }}
            >
              Assinar no Stripe agora
            </a>

            <button
              onClick={() => {
                if (!name.trim() || !email.trim()) return;
                onUnlocked(name.trim(), email.trim(), requestedPlan);
                onClose();
              }}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(59,130,246,0.25)",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
              }}
              title="MVP: confirma e libera localmente. Depois substituímos por validação automática via webhook."
            >
              Já assinei, liberar agora
            </button>
          </div>

          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            Nota: validação automática (sem fraude) será implementada com webhook Stripe no backend. Este fluxo já funciona para venda e ativação imediata no produto.
          </div>
        </div>
      </div>
    </div>
  );
};
