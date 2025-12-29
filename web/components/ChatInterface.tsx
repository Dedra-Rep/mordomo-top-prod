import React, { useMemo, useState } from "react";
import type { AIResponse, UserRole } from "../types";
import {
  buildAmazonSearchUrl,
  buildPlaceholderImage,
  AMAZON_DEFAULT_TAG,
} from "../services/amazonLinks";

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

/**
 * Suporta dois formatos:
 * - novo: lastResponse.items[]
 * - legado: lastResponse.results[]
 */
function safeItems(lastResponse: AIResponse | null): any[] {
  const r1 = (lastResponse as any)?.items;
  if (Array.isArray(r1)) return r1;

  const r2 = (lastResponse as any)?.results;
  if (Array.isArray(r2)) return r2;

  return [];
}

function normalizeItem(raw: any) {
  const title = String(raw?.title ?? raw?.nome ?? "").trim();
  const query = String(raw?.query ?? "").trim();
  const why = String(raw?.why ?? raw?.porque ?? "").trim();
  const rotulo = String(raw?.rotulo ?? "").trim();
  const priceHint = raw?.priceHint ?? raw?.observacoes ?? null;
  const imageUrl = String(raw?.imageUrl ?? raw?.image_url ?? "").trim();

  const linkQuery = query || title || "produto amazon";
  const link = buildAmazonSearchUrl(linkQuery, AMAZON_DEFAULT_TAG);
  const image = imageUrl || buildPlaceholderImage(title || "Recomendação");

  return { title, query, why, rotulo, priceHint, link, image };
}

export const ChatInterface: React.FC<Props> = ({
  role,
  onSend,
  lastResponse,
  isLoading,
}) => {
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

  const items = safeItems(lastResponse).slice(0, 4).map(normalizeItem);

  return (
    <div className="min-h-screen overflow-y-auto">
      {/* CONTEÚDO */}
      <div className="max-w-5xl mx-auto px-6 pt-16 md:pt-20 pb-48">
        <h2 className="text-center text-4xl md:text-6xl font-black tracking-tight">
          À sua total disposição.
        </h2>

        <p className="text-center text-slate-300/90 mt-4 md:mt-6 max-w-2xl mx-auto">
          {subtitle}
        </p>

        {/* BADGES */}
        <div className="mt-8 flex justify-center gap-3">
          <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider">
            ⚡ Velocidade Máxima
          </span>
          <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider">
            🎓 Mentoria Expert
          </span>
        </div>

        {/* FALA DO MORDOMO */}
        {(lastResponse as any)?.speech && (
          <div className="mt-10 mx-auto max-w-3xl">
            <div className="bg-black/25 border border-white/10 rounded-2xl p-4 text-slate-200">
              <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                Mordomo
              </div>
              <div className="text-sm md:text-base">
                {(lastResponse as any).speech}
              </div>
            </div>
          </div>
        )}

        {/* CARDS */}
        {items.length > 0 && (
          <div className="mt-10 mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {items.map((item, idx) => {
                const rotulo = badgeLabel(item.rotulo);

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
                      <div className="opacity-25 text-2xl font-black select-none">a</div>
                    </div>

                    <div className="mt-4">
                      <img
                        src={item.image}
                        alt={item.title || "Produto"}
                        className="w-full h-36 object-cover rounded-xl border border-white/10"
                        loading="lazy"
                      />
                    </div>

                    <div className="mt-3">
                      <div className="text-lg font-black leading-snug">
                        {item.title || "Recomendação"}
                      </div>

                      {item.why && (
                        <div className="mt-2 text-sm text-slate-300/90">
                          {item.why}
                        </div>
                      )}

                      {item.priceHint && (
                        <div className="mt-2 text-xs text-slate-400">
                          {String(item.priceHint)}
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-sm transition hover:opacity-90 inline-flex items-center justify-center"
                        style={{ backgroundColor: "#f59e0b", color: "#0b1220" }}
                      >
                        Comprar agora
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 🔵 COPY EDUCATIVA – PLANO GRÁTIS */}
            <div className="mt-10 text-center max-w-3xl mx-auto">
              <p className="text-sm text-slate-300">
                Essas recomendações foram encontradas na Amazon com o melhor custo-benefício disponível hoje.
              </p>

              <p className="mt-3 text-xs text-slate-400">
                No Plano Profissional, o Mordomo compara vários marketplaces e passa a trabalhar com seus próprios links de afiliado.
              </p>

              <p className="mt-4 text-sm font-semibold text-amber-300">
                No Mordomo.Pro, você deixa de apenas comprar e passa a ganhar dinheiro como afiliado em diversos marketplaces no mundo.
                <br />
                Você já viu como funciona. Agora, é hora de virar o jogo.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* INPUT FIXO */}
      <div className="fixed left-0 right-0 bottom-0 pb-6">
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
