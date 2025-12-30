import React, { useMemo, useRef, useState } from "react";
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

type Mood = "idle" | "listening" | "thinking" | "speaking" | "error";

type Props = {
  plan: PlanId;
  onMood: (m: Mood) => void;
  onSpokenText: (t: string) => void;
};

type SpeechRecognitionType = typeof window & {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
};

export const ChatInterface: React.FC<Props> = ({ plan, onMood, onSpokenText }) => {
  const [msg, setMsg] = useState("");
  const [last, setLast] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Microfone
  const [micOn, setMicOn] = useState(false);
  const recognitionRef = useRef<any>(null);

  const subtitle = useMemo(() => {
    return "Busca cirúrgica em segundos. Diga o que você precisa e eu encontro o melhor preço na Amazon Brasil.";
  }, []);

  function hasSpeechRecognition(): boolean {
    const w = window as unknown as SpeechRecognitionType;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  function startMic() {
    if (!hasSpeechRecognition()) {
      alert("Seu navegador não suporta SpeechRecognition. Use Google Chrome no desktop.");
      return;
    }

    const w = window as unknown as SpeechRecognitionType;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;

    const rec = new SR();
    recognitionRef.current = rec;

    rec.lang = "pt-BR";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onstart = () => {
      setMicOn(true);
      onMood("listening");
    };

    rec.onerror = () => {
      setMicOn(false);
      onMood("error");
    };

    rec.onend = () => {
      setMicOn(false);
      // se não estiver pensando/falando, volta para idle
      onMood((prev => (prev === "thinking" || prev === "speaking") ? prev : "idle") as any);
    };

    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      const t = String(transcript || "").trim();
      if (t) setMsg(t);

      // quando final, pode enviar automaticamente
      const isFinal = event.results?.[event.results.length - 1]?.isFinal;
      if (isFinal && t) {
        // pequeno delay para UX
        setTimeout(() => {
          send(t);
        }, 150);
      }
    };

    rec.start();
  }

  function stopMic() {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    setMicOn(false);
    onMood("idle");
  }

  async function send(forceText?: string) {
    const text = (forceText ?? msg).trim();
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
        setTimeout(() => onMood("idle"), 650);
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
      <div className="text-center pt-20 pb-10">
        <div className="text-5xl sm:text-6xl font-black tracking-tight text-white">
          O MORDOMO MAIS FAMOSO
        </div>

        <div className="mt-3 text-white/70 max-w-2xl mx-auto">{subtitle}</div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-white/70">
            ⚡ AMAZON BR VERIFIED
          </span>
          <span className="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-white/70">
            ✅ LINKS 100% VÁLIDOS
          </span>
        </div>

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

            {/* Microfone */}
            <button
              onClick={() => (micOn ? stopMic() : startMic())}
              className={[
                "w-11 h-11 rounded-full border flex items-center justify-center",
                micOn
                  ? "bg-blue-500/20 border-blue-400/30 text-blue-200"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
              ].join(" ")}
              aria-label="Microfone"
              title={micOn ? "Parar microfone" : "Falar no microfone"}
            >
              🎤
            </button>

            {/* Enviar */}
            <button
              onClick={() => send()}
              className="w-11 h-11 rounded-full bg-yellow-500/90 hover:bg-yellow-500 text-black font-black flex items-center justify-center"
              aria-label="Enviar"
              title="Enviar"
            >
              ➤
            </button>
          </div>

          <div className="mt-6 text-left">
            <div className="text-white/60 text-xs mb-2">Resultado</div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              {!last && !loading && (
                <div className="text-white/70">Digite um produto para começar</div>
              )}
              {loading && <div className="text-white/70">Pensando…</div>}
              {last && (
                <>
                  <div className="text-white font-semibold">{last.reply}</div>
                  {last.error && (
                    <div className="mt-2 text-red-200/80 text-sm">{last.error}</div>
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
