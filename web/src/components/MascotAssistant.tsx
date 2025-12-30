import React, { useEffect, useMemo, useState } from "react";
import type { PlanId } from "../types";

type Mood = "idle" | "listening" | "thinking" | "speaking" | "error";

type Props = {
  plan: PlanId;
  mood: Mood;
  sayText?: string;
  enabled: boolean;
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

type SpriteSpec = {
  cols: number;
  rows: number;
  frameSize: number; // px (quadrado)
};

// Mapa de frames: (plan+mood) -> index do frame (0..N-1)
// Ajuste depois quando você tiver o sprite final.
function frameIndex(plan: PlanId, mood: Mood) {
  const base =
    plan === "exec" ? 10 : plan === "pro" ? 5 : 0; // 0..4 free, 5..9 pro, 10..14 exec (exemplo)
  const offset =
    mood === "idle" ? 0 :
    mood === "listening" ? 1 :
    mood === "thinking" ? 2 :
    mood === "speaking" ? 3 :
    4; // error
  return base + offset;
}

export const Mascot: React.FC<Props> = ({ plan, mood, sayText, enabled, onToggle }) => {
  const [lastSpoken, setLastSpoken] = useState<string>("");
  const [spriteOk, setSpriteOk] = useState(false);

  const canSpeak = useMemo(() => typeof window !== "undefined" && "speechSynthesis" in window, []);

  // Detecta se sprite existe (sem travar)
  useEffect(() => {
    const img = new Image();
    img.onload = () => setSpriteOk(true);
    img.onerror = () => setSpriteOk(false);
    img.src = "/mascot-sprite.png";
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (!canSpeak) return;

    const text = String(sayText || "").trim();
    if (!text) return;
    if (text === lastSpoken) return;

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    u.rate = plan === "exec" ? 1.08 : plan === "pro" ? 1.02 : 0.98;
    u.pitch = plan === "exec" ? 0.95 : 1.0;

    window.speechSynthesis.speak(u);
    setLastSpoken(text);
  }, [sayText, enabled, canSpeak, lastSpoken, plan]);

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

  // Sprite config (exemplo)
  const sprite: SpriteSpec = { cols: 5, rows: 3, frameSize: 96 };
  const idx = frameIndex(plan, mood);
  const x = (idx % sprite.cols) * sprite.frameSize;
  const y = Math.floor(idx / sprite.cols) * sprite.frameSize;

  return (
    <div className="fixed left-4 bottom-4 z-50 select-none">
      <div
        className={`w-24 h-24 rounded-2xl bg-white/5 backdrop-blur border border-white/10 ${ringClass} flex items-center justify-center overflow-hidden relative`}
      >
        {spriteOk ? (
          <div
            className="w-24 h-24"
            style={{
              backgroundImage: `url("/mascot-sprite.png")`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${sprite.cols * sprite.frameSize}px ${sprite.rows * sprite.frameSize}px`,
              backgroundPosition: `-${x}px -${y}px`,
              imageRendering: "auto",
            }}
            aria-label="Mascote (sprite)"
          />
        ) : (
          <img
            src="/mascot.png"
            alt="Mascote Mordomo"
            className="w-24 h-24 object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </div>

      <div className="mt-2 w-52 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-white/80 backdrop-blur">
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
