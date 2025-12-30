import React, { useEffect, useMemo, useState } from "react";
import type { PlanId } from "../types";

type Mood = "idle" | "listening" | "thinking" | "speaking" | "error";

type Props = {
  plan: PlanId;
  mood: Mood;
  sayText?: string; // texto para falar
  enabled: boolean; // fala ligada/desligada
  onToggle: () => void;
};

function planLabel(plan: PlanId) {
  if (plan === "exec") return "EXECUTIVO";
  if (plan === "pro") return "PROFISSIONAL";
  return "GRÁTIS";
}

function moodLabel(mood: Mood) {
  if (mood === "listening") return "ouvindo";
  if (mood === "thinking") return "pensando";
  if (mood === "speaking") return "falando";
  if (mood === "error") return "erro";
  return "pronto";
}

export const Mascot: React.FC<Props> = ({ plan, mood, sayText, enabled, onToggle }) => {
  const [lastSpoken, setLastSpoken] = useState<string>("");

  const canSpeak = useMemo(() => {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (!canSpeak) return;
    const text = String(sayText || "").trim();
    if (!text) return;
    if (text === lastSpoken) return;

    // Cancela fala anterior para ficar "instantâneo"
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    u.rate = plan === "exec" ? 1.05 : plan === "pro" ? 1.0 : 0.98;
    u.pitch = plan === "exec" ? 0.95 : 1.0;

    window.speechSynthesis.speak(u);
    setLastSpoken(text);
  }, [sayText, enabled, canSpeak, lastSpoken, plan]);

  // Expressões (sem trocar seu layout; só um “estado visual”)
  const ringClass =
    mood === "speaking"
      ? "ring-2 ring-green-400"
      : mood === "thinking"
      ? "ring-2 ring-yellow-400"
      : mood === "listening"
      ? "ring-2 ring-blue-400"
      : mood === "error"
      ? "ring-2 ring-red-400"
      : "ring-1 ring-white/10";

  return (
    <div className="fixed left-4 bottom-4 z-50 select-none">
      <div className={`w-20 h-20 rounded-2xl bg-white/5 backdrop-blur border border-white/10 ${ringClass} flex items-center justify-center overflow-hidden`}>
        {/* Use a mesma imagem do seu mascote (se já existe no projeto).
            Se você já tinha uma img, troque o src para o seu caminho atual. */}
        <img
          src="/mascot.png"
          alt="Mascote Mordomo"
          className="w-20 h-20 object-cover"
          onError={(e) => {
            // fallback: se não tiver a imagem, não quebra
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        {/* fallback simples visual */}
        <div className="absolute inset-0 flex items-center justify-center text-white/60 text-xs">
          {!canSpeak && "M"}
        </div>
      </div>

      <div className="mt-2 w-44 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-white/80 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="font-semibold">MORDOMO</span>
          <button
            className="text-[11px] px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10"
            onClick={onToggle}
            title={enabled ? "Desligar voz" : "Ligar voz"}
          >
            {enabled ? "Voz: ON" : "Voz: OFF"}
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="opacity-80">{planLabel(plan)}</span>
          <span className="opacity-70">{moodLabel(mood)}</span>
        </div>
      </div>
    </div>
  );
};
