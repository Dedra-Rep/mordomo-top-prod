import React, { useMemo, useState } from "react";
import type { AIResponse, AffiliateIds, Plan, Recommendation, UserRole } from "../types";
import { sendChat, unlockPlan } from "../services/geminiService";
import { MascotAssistant } from "./MascotAssistant";

const STRIPE_PRO = "https://buy.stripe.com/aFa00c3ny7lS5tJ4gS08g00";  // US$20
const STRIPE_EXEC = "https://buy.stripe.com/9B65kw4rCgWsf4jaFg08g01"; // US$50

function badgeStyle() {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: 800 as const,
    letterSpacing: 0.2,
  };
}

function pillStyle(active: boolean, locked: boolean) {
  return {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: active ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.06)",
    color: "#fff",
    fontWeight: 900 as const,
    fontSize: 12,
    cursor: "pointer" as const,
    opacity: locked ? 0.75 : 1,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
}

function cardLabelStyle(label: Recommendation["label"]) {
  const upper = String(label || "").toUpperCase();
  const base = {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 12,
    fontWeight: 900 as const,
    letterSpacing: 0.3,
  };
  if (upper.includes("PREMIUM")) return { ...base, background: "rgba(168,85,247,0.18)", color: "#e9d5ff" };
  if (upper.includes("CUSTO")) return { ...base, background: "rgba(56,189,248,0.18)", color: "#bae6fd" };
  return { ...base, background: "rgba(16,185,129,0.18)", color: "#a7f3d0" };
}

function placeholderImg(title: string) {
  const t = encodeURIComponent(title || "produto");
  return `https://dummyimage.com/900x900/0b1020/ffffff&text=${t}`;
}

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function writeLS(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

type Props = {
  role: UserRole;
  lastResponse: AIResponse | null;
  setLastResponse: (r: AIResponse | null) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
};

export const ChatInterface: React.FC<Props> = ({ role, lastResponse, setLastResponse, isLoading, setIsLoading }) => {
  const subtitle = useMemo(
    () => "Busca cirúrgica em segundos. Diga o que você precisa e eu encontro o melhor preço na Amazon Brasil.",
    []
  );

  const [plan, setPlan] = useState<Plan>(() => readLS<Plan>("mordomo.plan", "FREE"));
  const [unlocks, setUnlocks] = useState<{ PRO: boolean; EXEC: boolean }>(() => readLS("mordomo.unlocks", { PRO: false, EXEC: false }));

  const [affiliate, setAffiliate] = useState<AffiliateIds>(() =>
    readLS("mordomo.affiliate", { amazonTag: "mordomoai-20" })
  );

  const [msg, setMsg] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);

  // modal controle
  const [showPay, setShowPay] = useState(false);
  const [targetPlan, setTargetPlan] = useState<"PRO" | "EXEC">("PRO");
  const [unlockCode, setUnlockCode] = useState("");

  const isProUnlocked = unlocks.PRO;
  const isExecUnlocked = unlocks.EXEC;

  function setPlanSafe(p: Plan) {
    setPlan(p);
    writeLS("mordomo.plan", p);
  }

  function openPay(p: "PRO" | "EXEC") {
    setTargetPlan(p);
    setShowPay(true);
    setUnlockCode("");
  }

  async function tryUnlock() {
    if (!unlockCode.trim()) return;
    const ok = await unlockPlan(targetPlan, unlockCode.trim());
    if (ok) {
      const next = { ...unlocks, [targetPlan]: true };
      setUnlocks(next);
      writeLS("mordomo.unlocks", next);
      setShowPay(false);
      setPlanSafe(targetPlan);
      return;
    }
    setLastError("Código inválido.");
  }

  const canUsePro = isProUnlocked;
  const canUseExec = isExecUnlocked;

  async function send(textOverride?: string) {
    const text = String(textOverride ?? msg).trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setLastError(null);
    setLastResponse(null);

    try {
      const r = await sendChat(text, role, plan, affiliate);
      setLastResponse(r);
      setMsg("");
    } catch {
      setLastError("Falha de rede.");
      setLastResponse({ text: "Falha de rede. Atualize (Ctrl+F5).", recommendations: [] });
    } finally {
      setIsLoading(false);
    }
  }

  function onSelectPlan(p: Plan) {
    if (p === "PRO" && !canUsePro) return openPay("PRO");
    if (p === "EXEC" && !canUseExec) return openPay("EXEC");
    setPlanSafe(p);
  }

  const shareLink = useMemo(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("amazonTag", affiliate.amazonTag || "mordomoai-20");
    if (affiliate.mercadoLivre) url.searchParams.set("ml", affiliate.mercadoLivre);
    if (affiliate.shopee) url.searchParams.set("shopee", affiliate.shopee);
    if (affiliate.ebay) url.searchParams.set("ebay", affiliate.ebay);
    if (affiliate.aliexpress) url.searchParams.set("ali", affiliate.aliexpress);
    return url.toString();
  }, [affiliate]);

  // permitir carregar IDs por URL (link do afiliado)
  useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    const amazonTag = p.get("amazonTag");
    if (amazonTag) {
      const next: AffiliateIds = {
        amazonTag,
        mercadoLivre: p.get("ml") || undefined,
        shopee: p.get("shopee") || undefined,
        ebay: p.get("ebay") || undefined,
        aliexpress: p.get("ali") || undefined,
      };
      setAffiliate(next);
      writeLS("mordomo.affiliate", next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recs = lastResponse?.recommendations || [];
  const speakText = lastError ? suggestingErrorText(lastError) : (isLoading ? "Buscando…" : (lastResponse?.text || ""));

  return (
    <div style={{ minHeight: "100vh", background: "#050816", color: "#fff" }}>
      {/* Top bar */}
      <div
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          right: 14,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
            }}
          >
            M
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 900, letterSpacing: 0.4 }}>MORDOMO.AI</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>SMART ASSISTANT</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button style={pillStyle(plan === "FREE", false)} onClick={() => onSelectPlan("FREE")}>
            GRÁTIS
          </button>

          <button style={pillStyle(plan === "PRO", !canUsePro)} onClick={() => onSelectPlan("PRO")}>
            {canUsePro ? "PROFISSIONAL" : "🔒 PROFISSIONAL"}
          </button>

          <button style={pillStyle(plan === "EXEC", !canUseExec)} onClick={() => onSelectPlan("EXEC")}>
            {canUseExec ? "EXECUTIVO" : "🔒 EXECUTIVO"}
          </button>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(16,185,129,0.25)",
              background: "rgba(16,185,129,0.12)",
              color: "#a7f3d0",
              fontWeight: 900,
              fontSize: 12,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#34d399" }} />
            LIVE
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "130px 22px 30px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 54, fontWeight: 950, letterSpacing: -1, textTransform: "uppercase" }}>
            O MORDOMO MAIS FAMOSO
          </div>

          <div style={{ marginTop: 10, color: "rgba(255,255,255,0.70)", fontSize: 15 }}>
            {subtitle}
          </div>

          <div style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={badgeStyle()}>⚡ AMAZON BR VERIFIED</span>
            <span style={badgeStyle()}>✅ LINKS 100% VÁLIDOS</span>
          </div>

          {/* Config de afiliado (somente PRO/EXEC) */}
          {(plan === "PRO" || plan === "EXEC") && (
            <div
              style={{
                margin: "18px auto 0",
                width: "min(920px, 96vw)",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                padding: 14,
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: 950, marginBottom: 10 }}>
                Configuração do Afiliado (liberado no {plan})
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                <Field label="Amazon Tag (obrigatório)" value={affiliate.amazonTag} onChange={(v) => setAffiliateAndSave(setAffiliate, affiliate, { amazonTag: v })} />
                <Field label="Mercado Livre ID" value={affiliate.mercadoLivre || ""} onChange={(v) => setAffiliateAndSave(setAffiliate, affiliate, { mercadoLivre: v })} />
                <Field label="Shopee ID" value={affiliate.shopee || ""} onChange={(v) => setAffiliateAndSave(setAffiliate, affiliate, { shopee: v })} />
                <Field label="eBay ID" value={affiliate.ebay || ""} onChange={(v) => setAffiliateAndSave(setAffiliate, affiliate, { ebay: v })} />
                <Field label="AliExpress ID" value={affiliate.aliexpress || ""} onChange={(v) => setAffiliateAndSave(setAffiliate, affiliate, { aliexpress: v })} />
                <div style={{ display: "grid", alignContent: "end" }}>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(shareLink);
                    }}
                    style={{
                      padding: "12px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(245,158,11,0.18)",
                      color: "#fff",
                      fontWeight: 950,
                      cursor: "pointer",
                    }}
                    title="Copiar link exclusivo"
                  >
                    Copiar link exclusivo
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
                Link exclusivo: <span style={{ color: "#fff", fontWeight: 800 }}>{shareLink}</span>
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{ marginTop: 22, display: "flex", justifyContent: "center" }}>
            <div
              style={{
                width: "min(820px, 96vw)",
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: 10,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="O que você deseja comprar ou aprender agora?"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "#fff",
                  padding: "12px 16px",
                  fontSize: 14,
                }}
              />

              <button
                onClick={() => send()}
                disabled={isLoading}
                title="Buscar"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  border: "none",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  background: "#f59e0b",
                  color: "#111827",
                  fontWeight: 950,
                  opacity: isLoading ? 0.65 : 1,
                }}
              >
                ↗
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.32)", letterSpacing: 1 }}>
            MORDOMO.AI — RESULTADOS VERIFICADOS AMAZON BRASIL
          </div>
        </div>

        {/* Resultado */}
        <div style={{ marginTop: 30 }}>
          {isLoading && (
            <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", padding: 14, color: "rgba(255,255,255,0.75)" }}>
              Buscando as melhores opções…
            </div>
          )}

          {!isLoading && lastResponse?.text && (
            <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", padding: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
              {lastResponse.text}
            </div>
          )}

          {lastError && (
            <div style={{ marginTop: 12, borderRadius: 18, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.10)", padding: 12, color: "rgba(255,255,255,0.92)" }}>
              {lastError}
            </div>
          )}

          {recs.length > 0 && (
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
              {recs.slice(0, 3).map((it, idx) => (
                <div key={idx} style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.22)", overflow: "hidden" }}>
                  <div style={{ padding: 14 }}>
                    <div style={cardLabelStyle(it.label)}>{it.label}</div>

                    <div style={{ marginTop: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", aspectRatio: "1/1" as any, overflow: "hidden" }}>
                      <img src={it.imageUrl || placeholderImg(it.title)} alt={it.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>

                    <div style={{ marginTop: 12, fontWeight: 950, fontSize: 15 }}>{it.title}</div>

                    {it.why && <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.35 }}>{it.why}</div>}

                    {it.priceText && <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.80)", fontWeight: 800 }}>{it.priceText}</div>}
                  </div>

                  <div style={{ padding: 14, paddingTop: 0 }}>
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        width: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "12px 14px",
                        borderRadius: 14,
                        background: "#f59e0b",
                        color: "#111827",
                        textDecoration: "none",
                        fontWeight: 950,
                        letterSpacing: 0.3,
                      }}
                    >
                      VER NA AMAZON BRASIL
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mascote falante/mic/expressões em todos os planos */}
      <MascotAssistant
        plan={plan}
        isLoading={isLoading}
        lastError={lastError}
        sayText={speakText}
        onVoiceInput={(text) => send(text)}
      />

      {/* Modal de pagamento/desbloqueio */}
      {showPay && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ fontWeight: 950, fontSize: 16 }}>
              Desbloquear {targetPlan === "PRO" ? "PROFISSIONAL" : "EXECUTIVO"}
            </div>
            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 1.4 }}>
              1) Assine no Stripe<br />
              2) Volte aqui e informe o código de liberação (você define no Cloud Run)
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <a
                href={targetPlan === "PRO" ? STRIPE_PRO : STRIPE_EXEC}
                target="_blank"
                rel="noreferrer"
                style={payBtnStyle}
              >
                Ir para assinatura no Stripe
              </a>

              <button onClick={() => setShowPay(false)} style={secondaryBtnStyle}>
                Fechar
              </button>
            </div>

            <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Já tenho o código</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={unlockCode}
                  onChange={(e) => setUnlockCode(e.target.value)}
                  placeholder="Digite o código (ex: PRO-2025)"
                  style={inputStyle}
                />
                <button onClick={tryUnlock} style={primaryBtnStyle}>
                  Desbloquear
                </button>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.60)" }}>
                Dica: você pode enviar esse código por WhatsApp ao cliente após confirmar a compra.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function suggestingErrorText(s: string) {
  if (String(s).toLowerCase().includes("inválido")) return "Código inválido. Verifique e tente novamente.";
  return "Algo falhou. Vamos tentar de novo.";
}

function Field(props: { label: string; value: string; onChange: (v: string) => void }) {
  ensureCssOnce();
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.70)", fontWeight: 800 }}>{props.label}</span>
      <input value={props.value} onChange={(e) => props.onChange(e.target.value)} style={fieldInputStyle} />
    </label>
  );
}

function setAffiliateAndSave(
  setAffiliate: React.Dispatch<React.SetStateAction<AffiliateIds>>,
  current: AffiliateIds,
  patch: Partial<AffiliateIds>
) {
  const next = { ...current, ...patch };
  setAffiliate(next);
  try {
    localStorage.setItem("mordomo.affiliate", JSON.stringify(next));
  } catch {}
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.62)",
  zIndex: 80,
  display: "grid",
  placeItems: "center",
  padding: 18,
};

const modalStyle: React.CSSProperties = {
  width: "min(560px, 96vw)",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(10,14,30,0.96)",
  padding: 16,
  boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
};

const payBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 12px",
  borderRadius: 14,
  background: "#f59e0b",
  color: "#111827",
  textDecoration: "none",
  fontWeight: 950,
  flex: 1,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(16,185,129,0.18)",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  outline: "none",
};

let cssInjected = false;
function ensureCssOnce() {
  if (cssInjected) return;
  cssInjected = true;
}

const fieldInputStyle: React.CSSProperties = {
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  outline: "none",
};
