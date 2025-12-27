import React, { useMemo, useState } from "react";
import type { AIResponse, UserRole } from "../types";

type Props = {
  role: UserRole;
  onSend: (msg: string) => void;
  lastResponse: AIResponse | null;
  isLoading: boolean;
};

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

  return (
    <div className="absolute inset-0">
      {/* HERO CENTRAL (igual ao visual do AI Studio) */}
      <div className="max-w-5xl mx-auto px-6 pt-16 md:pt-20">
        <h2 className="text-center text-4xl md:text-6xl font-black tracking-tight">
          À sua total disposição.
        </h2>

        <p className="text-center text-slate-300/90 mt-4 md:mt-6 max-w-2xl mx-auto">
          {subtitle}
        </p>

        {/* Badges (opcional, mas mantém a estética) */}
        <div className="mt-8 flex justify-center gap-3">
          <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider">
            ⚡ Velocidade Máxima
          </span>
          <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider">
            🎓 Mentoria Expert
          </span>
        </div>

        {/* Resposta curta do Mordomo (aparece acima do input, sem destruir layout) */}
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
      </div>

      {/* INPUT FIXO EMBAIXO (igual ao AI Studio) */}
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
