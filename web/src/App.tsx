import React, { useEffect, useMemo, useState } from "react";
import type { AIResponse, Plan, UserRole } from "./types";
import { ChatInterface } from "./components/ChatInterface";
import { AffiliatePanel } from "./components/AffiliatePanel";
import { PaywallModal } from "./components/PaywallModal";
import { PlanBar } from "./components/PlanBar";
import { getSubscriber, setPlan, updateProfile } from "./services/subscription";

export default function App() {
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [subscriber, setSubscriberState] = useState(() => getSubscriber());
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [requested, setRequested] = useState<"PRO" | "EXEC">("PRO");

  // role (opcional): você pode derivar do plano
  const role: UserRole = useMemo(() => {
    if (subscriber.plan === "EXEC") return "PRO";
    if (subscriber.plan === "PRO") return "AFILIADO";
    return "MORDOMO";
  }, [subscriber.plan]);

  useEffect(() => {
    const sync = () => setSubscriberState(getSubscriber());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const changePlan = (p: Plan) => {
    if (p === "FREE") {
      setPlan("FREE");
      setSubscriberState(getSubscriber());
      return;
    }

    // PRO/EXEC exigem paywall (MVP)
    setRequested(p);
    setPaywallOpen(true);
  };

  const onUnlocked = (name: string, email: string, plan: Plan) => {
    updateProfile({ name, email });
    setPlan(plan);
    setSubscriberState(getSubscriber());
  };

  const onSend = async (msg: string) => {
    setIsLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, role }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setLastResponse({ text: data?.error ? String(data.error) : `Erro HTTP ${r.status} no /api/chat`, recommendations: [] });
        return;
      }

      setLastResponse({
        text: String(data?.text || ""),
        recommendations: Array.isArray(data?.recommendations) ? data.recommendations : [],
      });
    } catch {
      setLastResponse({ text: "Falha de rede. Tente atualizar a página (Ctrl+F5).", recommendations: [] });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* topo: planos */}
      <div style={{ position: "fixed", top: 14, left: 14, right: 14, zIndex: 60, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 12, opacity: 0.8 }}>MORDOMO.AI</div>
          <PlanBar plan={subscriber.plan} onChange={changePlan} />
        </div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
          Status: <b style={{ color: "#34d399" }}>LIVE</b>
        </div>
      </div>

      <div style={{ paddingTop: 60 }}>
        <ChatInterface role={role} onSend={onSend} lastResponse={lastResponse} isLoading={isLoading} />

        {/* painel de IDs */}
        <div style={{ maxWidth: 1050, margin: "0 auto", padding: "0 22px 30px" }}>
          <AffiliatePanel plan={subscriber.plan} ids={subscriber.ids} />
        </div>
      </div>

      <PaywallModal
        open={paywallOpen}
        requestedPlan={requested}
        onClose={() => setPaywallOpen(false)}
        onUnlocked={onUnlocked}
      />
    </div>
  );
}
