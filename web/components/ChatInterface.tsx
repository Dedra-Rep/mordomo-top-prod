import React, { useMemo, useState } from "react";
import type { AIResponse, UserRole } from "../types";

type Props = {
  role: UserRole;
  onSend: (msg: string) => void;
  lastResponse: AIResponse | null;
  isLoading: boolean;
};

function badgeLabel(rotulo?: string) {
  const r = String(rotulo || "").toUpperCase();
  if (r.includes("MAIS")) return "MAIS BARATO";
  if (r.includes("OPÇÃO")) return r;
  return r || "OPÇÃO";
}

function badgeClass(rotulo?: string) {
  const r = String(rotulo || "").toUpperCase();
  if (r.includes("MAIS")) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  if (r.includes("OPÇÃO 1")) return "bg-sky-500/20 text-sky-300 border-sky-500/30";
  if (r.includes("OPÇÃO 2")) return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
  if (r.includes("OPÇÃO 3")) return "bg-purple-500/20 text-purple-300 border-purple-500/30";
  return "bg-white/5 text-slate-300 border-white/10";
}

function safeResults(lastResponse: AIResponse | null) {
  const results = (lastResponse as any)?.results;
  return Array.isArray(results) ? results : [];
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

  const results = safeResults(lastResponse);

  return (
    <div className="absolute inset-0">
      {/* HERO CENTRAL (mantém o visual do AI Studio) */}
      <div className="max-w-5xl mx-auto px-6 pt-16 md:pt-20 pb-44">
        <h2 className="text-center text-4xl md:text-6xl font-black tracking-tight">
          À sua total disposição.
        </h2>

        <p className="text-center text-slate-300/90 mt-4 md:mt-6 max-w-2xl mx-auto">
          {subtitle}
        </p>

        {/* Badges */}
        <div className="mt-8 flex justify-center gap-3">
          <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider">
            ⚡ Velocidade Máxima
          </span>
          <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider">
            🎓 Mentoria Expert
          </span>
        </div>

        {/* Resposta curta (speech) */}
        {lastResponse?.speech && (
          <div className="mt-10 mx-auto max-w-3xl">
            <div className="bg-black/25 border border-white/10 rounded-2xl p-4 text-slate-200">
              <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                Mordomo
              </div>
              <div className="text-sm md:text-base">{lastResponse.speech}</div>
            </div>
          </div>
        )}

        {/* CARDS estilo AI Studio (results) */}
        {results.length > 0 && (
          <div className="mt-8 mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {results.slice(0, 4).map((item: any, idx: number) => {
                const rotulo = badgeLabel(item?.rotulo);
                const link = String(item?.link_afiliado || "").trim();
                const nome = String(item?.nome || "").trim();
                const porque = String(item?.porque || "").trim();
                const obs = String(item?.observacoes || "").trim();

                return (
                  <div
                    key={`${rotulo}-${idx}`}
                    className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur-md p-5 hover:border-white/20 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${badgeClass(
                          rotulo
                        )}`}
                      >
                        {rotulo}
                      </span>

                      {/* ícone “a” (amazon) apenas decorativo */}
                      <div className="opacity-25 text-2xl font-black select-none">a</div>
                    </div>

                    <div className="mt-3">
                      <div className="text-lg font-black leading-snug">{nome || "Recomendação"}</div>
                      {porque && (
                        <div className="mt-2 text-sm text-slate-300/90">{porque}</div>
                      )}
                      {obs && (
                        <div className="mt-2 text-xs text-slate-400">{obs}</div>
                      )}
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => {
                          if (!link) return;
                          window.open(link, "_blank", "noopener,noreferrer");
                        }}
                        disabled={!link}
                        className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-sm transition ${
                          link
                            ? "hover:opacity-90"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                        style={{ backgroundColor: "#f59e0b", color: "#0b1220" }}
                      >
                        Comprar agora
                      </button>

                      {!link && (
                        <div className="mt-2 text-[11px] text-slate-500">
                          Link indisponível nesta resposta.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* INPUT FIXO EMBAIXO */}
      <div className="absolute left-0 right-0 bottom-0 pb-6">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-black/35 border border-white/10 rounded-full flex items-center gap-3 px-5 py-3 backdrop-blur-md">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="O que você deseja comprar ou aprender agora?"
              className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-500"
            />

            <button
              onClick={send}
              disabled={isLoading}
              className={`w-12 h-12 rounded-full font-black grid place-items-center transition ${
                isLoading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
              }`}
              style={{ backgroundColor: "#f59e0b", color: "#0b1220" }}
              aria-label="Enviar"
              title="Enviar"
            >
              ➤
            </button>
          </div>

          <div className="mt-3 text-center text-[10px] uppercase tracking-widest text-slate-600">
            MORDOMO.AI — INTELIGÊNCIA DE MERCADO & MENTORIA
          </div>
        </div>
      </div>
    </div>
  );
};
