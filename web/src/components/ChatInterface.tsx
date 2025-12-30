import React, { useMemo, useState } from "react";
import type { Card, ChatResponse, PlanId } from "../types";
import { chatApi } from "../services/geminiService";

function badgeLabel(rotulo?: string) {
  const r = String(rotulo || "").toUpperCase();
  if (r.includes("MAIS")) return "MAIS BARATO";
  if (r.includes("CUSTO")) return "CUSTO-BENEFÍCIO";
  if (r.includes("PREMIUM")) return "PREMIUM";
  return r || "OPÇÃO";
}

function badgeClass(rotulo?: string) {
  const r = String(rotulo || "").toUpperCase();
  if (r.includes("MAIS")) return "bg-yellow-500/20 border-yellow-400/30 text-yellow-200";
  if (r.includes("CUSTO")) return "bg-blue-500/20 border-blue-400/30 text-blue-200";
  if (r.includes("PREMIUM")) return "bg-green-500/20 border-green-400/30 text-green-200";
  return "bg-white/10 border-white/15 text-white/80";
}

type Props = {
  plan: PlanId;
  onMood: (m: "idle" | "listening" | "thinking" | "speaking" | "error") => void;
  onSpokenText: (t: string) => void;
};

export const ChatInterface: React.FC<Props> = ({ plan, onMood, onSpokenText }) => {
  const [msg, setMsg] = useState("");
  const [last, setLast] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const subtitle = useMemo(() => {
    return "Busca cirúrgica em segundos. Diga o que você precisa e eu encontro o melhor preço na Amazon Brasil.";
  }, []);

  async function send() {
    const text = msg.trim();
    if (!text || loading) return;

    setLoading(true);
    onMood("thinking");
    setLast(null);

    try {
      const r = await chatApi({ message: text, plan });
      setLast(r);

      if (r.ok) {
        onMood("speaking");
        onSpokenText(r.reply);
        // volta para idle após curto tempo
        setTimeout(() => onMood("idle"), 600);
      } else {
        onMood("error");
        onSpokenText("Tive um problema agora. Tente novamente.");
      }
    } catch {
      onMood("error");
      onSpokenText("Falha de conexão.");
    } finally {
      setLoading(false);
      setMsg("");
    }
  }

  const cards: Card[] = last?.cards || [];

  return (
    <div className="w-full">
      {/* HERO */}
      <div className="text-center pt-20 pb-10">
        <div className="text-5xl sm:text-6xl font-black tracking-tight text-white">
          O MORDOMO MAIS FAMOSO
        </div>
        <div className="mt-3 text-white/70 max-w-2xl mx-auto">
          {subtitle}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-white/70">
            ⚡ AMAZON BR VERIFIED
          </span>
          <span className="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-white/70">
            ✅ LINKS 100% VÁLIDOS
          </span>
        </div>

        {/* Input */}
        <div className="mt-10 max-w-3xl mx-auto px-4">
          <div className="w-full rounded-2xl bg-white/5 border border-white/10 backdrop-blur flex items-center gap-2 px-4 py-3">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              className="flex-1 bg-transparent outline-none text-white placeholder:text-white/30"
              placeholder="O que você deseja comprar ou aprender agora?"
            />
            <button
              onClick={send}
              className="w-11 h-11 rounded-full bg-yellow-500/90 hover:bg-yellow-500 text-black font-black flex items-center justify-center"
              aria-label="Enviar"
              title="Enviar"
            >
              ➤
            </button>
          </div>

          {/* Resultado */}
          <div className="mt-6 text-left">
            <div className="text-white/60 text-xs mb-2">Resultado</div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              {!last && !loading && (
                <div className="text-white/70">Digite um produto para começar</div>
              )}
              {loading && (
                <div className="text-white/70">Pensando…</div>
              )}
              {last && (
                <>
                  <div className="text-white font-semibold">{last.reply}</div>
                  {last.error && (
                    <div className="mt-2 text-red-200/80 text-sm">
                      {last.error}
                    </div>
                  )}

                  {cards.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {cards.map((c, i) => (
                        <div key={i} className="rounded-2xl bg-black/20 border border-white/10 p-4">
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] px-2 py-1 rounded-full border ${badgeClass(c.badge)}`}>
                              {badgeLabel(c.badge)}
                            </span>
                            {c.priceRange && (
                              <span className="text-[11px] px-2 py-1 rounded-full bg-green-500/20 text-green-200 border border-green-400/20">
                                {c.priceRange}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 text-white font-semibold">{c.title}</div>

                          {c.bullets?.length ? (
                            <ul className="mt-2 text-white/70 text-sm list-disc pl-5 space-y-1">
                              {c.bullets.slice(0, 4).map((b, bi) => (
                                <li key={bi}>{b}</li>
                              ))}
                            </ul>
                          ) : null}

                          {c.url && (
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 block w-full text-center rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-black py-3"
                            >
                              VER NA AMAZON BRASIL
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {last?.meta && (
              <div className="mt-2 text-[11px] text-white/40">
                {last.meta.cached ? "cache" : "live"} • {last.meta.ms ?? "-"}ms • tag: {last.meta.amazonTagUsed ?? "-"}
              </div>
            )}
          </div>

          <div className="mt-10 text-center text-white/30 text-xs tracking-wide">
            MORDOMO.AI — RESULTADOS VERIFICADOS AMAZON BRASIL
          </div>
        </div>
      </div>
    </div>
  );
};
