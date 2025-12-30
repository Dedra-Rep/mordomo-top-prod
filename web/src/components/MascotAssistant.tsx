import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Plan } from "../types";

type Mood = "idle" | "listening" | "thinking" | "speaking" | "success" | "error";

type Props = {
  plan: Plan;
  sayText?: string;
  isLoading: boolean;
  lastError?: string | null;
  onVoiceInput?: (text: string) => void;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

function supportsTTS() {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}
function supportsSTT() {
  return typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
}
function pickVoicePTBR(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const ptbr = voices.find((v) => /pt-BR/i.test(v.lang));
  if (ptbr) return ptbr;
  const pt = voices.find((v) => /^pt/i.test(v.lang));
  return pt || null;
}

function persona(plan: Plan) {
  if (plan === "EXEC") {
    return {
      title: "Executivo",
      greet: "Executivo ativo. Vou te entregar decisão rápida em 3 níveis, com próximos passos.",
      rate: 1.08,
    };
  }
  if (plan === "PRO") {
    return {
      title: "Profissional",
      greet: "Profissional ativo. Vou comparar opções com critérios claros e links válidos.",
      rate: 1.02,
    };
  }
  return {
    title: "Grátis",
    greet: "Modo grátis. Me diga o que você precisa que eu trago 3 opções.",
    rate: 1.0,
  };
}

function faceStyle(mood: Mood): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 74,
    height: 110,
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    position: "relative",
    boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
  };

  if (mood === "listening") return { ...base, outline: "2px solid rgba(59,130,246,0.55)" };
  if (mood === "thinking") return { ...base, outline: "2px solid rgba(245,158,11,0.55)" };
  if (mood === "speaking") return { ...base, outline: "2px solid rgba(16,185,129,0.55)" };
  if (mood === "success") return { ...base, outline: "2px solid rgba(34,197,94,0.75)" };
  if (mood === "error") return { ...base, outline: "2px solid rgba(239,68,68,0.65)" };
  return base;
}

function mouthPath(mood: Mood) {
  switch (mood) {
    case "listening":
      return "M 22 64 Q 37 74 52 64";
    case "thinking":
      return "M 24 66 Q 37 58 50 66";
    case "speaking":
      return "M 30 64 Q 37 78 44 64 Q 37 60 30 64";
    case "success":
      return "M 22 62 Q 37 82 52 62";
    case "error":
      return "M 22 70 Q 37 54 52 70";
    default:
      return "M 22 66 Q 37 72 52 66";
  }
}

export const MascotAssistant: React.FC<Props> = ({ plan, sayText, isLoading, lastError, onVoiceInput }) => {
  const p = useMemo(() => persona(plan), [plan]);

  const [voiceOn, setVoiceOn] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [mood, setMood] = useState<Mood>("idle");
  const [bubble, setBubble] = useState<string>(p.greet);

  const recognitionRef = useRef<any>(null);
  const speakingRef = useRef(false);

  useEffect(() => {
    if (!supportsTTS()) return;
    window.speechSynthesis.onvoiceschanged = () => {};
  }, []);

  useEffect(() => {
    setBubble(p.greet);
    if (voiceOn) speak(p.greet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  useEffect(() => {
    if (!sayText) return;
    setBubble(sayText);
    if (voiceOn) speak(sayText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sayText]);

  useEffect(() => {
    if (lastError) {
      setMood("error");
      setBubble("Tive um problema. Tente novamente.");
      return;
    }
    if (isLoading) {
      setMood("thinking");
      setBubble("Buscando… já já te entrego as 3 melhores opções.");
      return;
    }
    if (!speakingRef.current && !micOn) setMood("idle");
  }, [isLoading, lastError, micOn]);

  useEffect(() => {
    if (!supportsSTT()) return;

    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new R();
    rec.lang = "pt-BR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setMicOn(true);
      setMood("listening");
      setBubble("Estou ouvindo. Fale agora.");
    };

    rec.onend = () => {
      setMicOn(false);
      if (!speakingRef.current && !isLoading) setMood("idle");
    };

    rec.onerror = () => {
      setMicOn(false);
      setMood("error");
      setBubble("Microfone falhou. Se preferir, digite.");
    };

    rec.onresult = (event: any) => {
      const text = String(event?.results?.[0]?.[0]?.transcript || "").trim();
      if (text) {
        setBubble(`Entendi: "${text}"`);
        onVoiceInput?.(text);
      }
    };

    recognitionRef.current = rec;
  }, [onVoiceInput, isLoading]);

  function speak(text: string) {
    if (!supportsTTS()) return;
    const clean = String(text || "").trim();
    if (!clean) return;

    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      const v = pickVoicePTBR();
      if (v) u.voice = v;
      u.rate = p.rate;
      u.pitch = 1.0;

      u.onstart = () => {
        speakingRef.current = true;
        setMood("speaking");
      };
      u.onend = () => {
        speakingRef.current = false;
        setMood("success");
        setTimeout(() => setMood("idle"), 650);
      };
      u.onerror = () => {
        speakingRef.current = false;
        setMood("error");
      };

      window.speechSynthesis.speak(u);
    } catch {
      setMood("error");
    }
  }

  function toggleMic() {
    if (!supportsSTT()) {
      setMood("error");
      setBubble("Seu navegador não suporta microfone aqui. Use Chrome no desktop.");
      return;
    }
    const rec = recognitionRef.current;
    if (!rec) return;

    try {
      if (micOn) rec.stop();
      else rec.start();
    } catch {
      setMood("error");
      setBubble("Não consegui abrir o microfone. Verifique permissões do navegador.");
    }
  }

  const canMic = supportsSTT();
  const canSpeak = supportsTTS();

  return (
    <div style={{ position: "fixed", left: 14, bottom: 14, zIndex: 55, display: "flex", alignItems: "flex-end", gap: 10 }}>
      <div style={faceStyle(mood)} title={`Mordomo (${p.title})`}>
        <svg width="74" height="110" viewBox="0 0 74 110">
          <rect x="10" y="14" width="54" height="64" rx="14" fill="rgba(255,255,255,0.10)" />
          <circle cx="28" cy="42" r="5.2" fill="rgba(255,255,255,0.95)" />
          <circle cx="46" cy="42" r="5.2" fill="rgba(255,255,255,0.95)" />
          <circle cx="28" cy="42" r={mood === "thinking" ? 2.2 : 2.8} fill="#0b1020" />
          <circle cx="46" cy="42" r={mood === "thinking" ? 2.2 : 2.8} fill="#0b1020" />

          <path d={mood === "error" ? "M 22 33 Q 28 28 34 33" : "M 22 32 Q 28 30 34 32"} stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" />
          <path d={mood === "error" ? "M 40 33 Q 46 28 52 33" : "M 40 32 Q 46 30 52 32"} stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" />

          <path d={mouthPath(mood)} stroke="rgba(255,255,255,0.75)" strokeWidth="3" fill="none" />

          <rect x="29" y="84" width="16" height="6" rx="3" fill="rgba(245,158,11,0.95)" />
          <path d="M 37 90 L 30 104 L 44 104 Z" fill="rgba(168,85,247,0.9)" />
        </svg>

        {mood === "speaking" && (
          <div style={{ position: "absolute", inset: -4, borderRadius: 22, border: "2px solid rgba(16,185,129,0.35)", animation: "pulse 1s infinite" }} />
        )}

        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: .75; }
            70% { transform: scale(1.05); opacity: .25; }
            100% { transform: scale(1); opacity: 0; }
          }
        `}</style>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ maxWidth: 380, padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.40)", fontSize: 12, color: "rgba(255,255,255,0.88)", lineHeight: 1.35 }}>
          <div style={{ fontWeight: 900, fontSize: 11, opacity: 0.85, marginBottom: 4 }}>
            MORDOMO ({p.title})
          </div>
          {bubble}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setVoiceOn((v) => !v)}
            disabled={!canSpeak}
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: voiceOn ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.06)",
              color: "#fff",
              fontWeight: 900,
              cursor: canSpeak ? "pointer" : "not-allowed",
              opacity: canSpeak ? 1 : 0.5,
              fontSize: 11,
            }}
          >
            {voiceOn ? "Voz: ON" : "Voz: OFF"}
          </button>

          <button
            onClick={toggleMic}
            disabled={!canMic}
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: micOn ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.06)",
              color: "#fff",
              fontWeight: 900,
              cursor: canMic ? "pointer" : "not-allowed",
              opacity: canMic ? 1 : 0.5,
              fontSize: 11,
            }}
          >
            {micOn ? "Mic: ON" : "Mic: OFF"}
          </button>

          <button
            onClick={() => speak(bubble)}
            disabled={!canSpeak}
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(245,158,11,0.18)",
              color: "#fff",
              fontWeight: 900,
              cursor: canSpeak ? "pointer" : "not-allowed",
              opacity: canSpeak ? 1 : 0.5,
              fontSize: 11,
            }}
          >
            Repetir
          </button>
        </div>
      </div>
    </div>
  );
};
