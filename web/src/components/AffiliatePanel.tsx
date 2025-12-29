import React, { useMemo, useState } from "react";
import type { AffiliateIds, Plan } from "../types";
import { canUseExec, canUsePro, getSubscriberLink, updateIds } from "../services/subscription";

type Props = {
  plan: Plan;
  ids: AffiliateIds;
};

export const AffiliatePanel: React.FC<Props> = ({ plan, ids }) => {
  const pro = canUsePro(plan);
  const exec = canUseExec(plan);

  const [amazonTag, setAmazonTag] = useState(ids.amazonTag || "mordomoai-20");
  const [ml, setMl] = useState(ids.mercadoLivreId || "");
  const [shopee, setShopee] = useState(ids.shopeeId || "");
  const [ebay, setEbay] = useState(ids.ebayId || "");
  const [ali, setAli] = useState(ids.aliexpressId || "");

  const lockedText = useMemo(() => {
    if (plan === "FREE") return "Desbloqueie PROFISSIONAL para configurar seus IDs e receber seu link.";
    if (plan === "PRO") return "Desbloqueie EXECUTIVO para liberar IDs multi-marketplace completos.";
    return "";
  }, [plan]);

  return (
    <div
      style={{
        marginTop: 14,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        padding: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900 }}>Configuração do Assinante</div>
          <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
            Plano atual: <b>{plan === "FREE" ? "GRÁTIS" : plan === "PRO" ? "PROFISSIONAL" : "EXECUTIVO"}</b>
          </div>
        </div>

        {pro && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
            Seu link (MVP):{" "}
            <span style={{ color: "#93c5fd", fontWeight: 900 }}>{getSubscriberLink()}</span>
          </div>
        )}
      </div>

      {!pro && (
        <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.70)" }}>
          {lockedText}
        </div>
      )}

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.70)", marginBottom: 6 }}>Amazon Tag</div>
            <input
              value={amazonTag}
              onChange={(e) => setAmazonTag(e.target.value)}
              disabled={!pro}
              style={{
                width: "100%",
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: !pro ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                color: "#fff",
                outline: "none",
                opacity: !pro ? 0.55 : 1,
              }}
              placeholder="mordomoai-20"
            />
          </div>

          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.70)", marginBottom: 6 }}>Mercado Livre ID</div>
            <input
              value={ml}
              onChange={(e) => setMl(e.target.value)}
              disabled={!exec}
              style={{
                width: "100%",
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: !exec ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                color: "#fff",
                outline: "none",
                opacity: !exec ? 0.55 : 1,
              }}
              placeholder="somente EXECUTIVO"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <input
            value={shopee}
            onChange={(e) => setShopee(e.target.value)}
            disabled={!exec}
            style={{
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: !exec ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
              color: "#fff",
              outline: "none",
              opacity: !exec ? 0.55 : 1,
            }}
            placeholder="Shopee (EXEC)"
          />
          <input
            value={ebay}
            onChange={(e) => setEbay(e.target.value)}
            disabled={!exec}
            style={{
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: !exec ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
              color: "#fff",
              outline: "none",
              opacity: !exec ? 0.55 : 1,
            }}
            placeholder="eBay (EXEC)"
          />
          <input
            value={ali}
            onChange={(e) => setAli(e.target.value)}
            disabled={!exec}
            style={{
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: !exec ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
              color: "#fff",
              outline: "none",
              opacity: !exec ? 0.55 : 1,
            }}
            placeholder="AliExpress (EXEC)"
          />
        </div>

        <button
          onClick={() => updateIds({ amazonTag, mercadoLivreId: ml, shopeeId: shopee, ebayId: ebay, aliexpressId: ali })}
          disabled={!pro}
          style={{
            marginTop: 4,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: pro ? "rgba(16,185,129,0.20)" : "rgba(255,255,255,0.06)",
            color: "#fff",
            fontWeight: 900,
            cursor: pro ? "pointer" : "not-allowed",
            opacity: pro ? 1 : 0.55,
          }}
        >
          Salvar IDs
        </button>
      </div>
    </div>
  );
};
