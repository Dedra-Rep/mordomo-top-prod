import React, { useEffect, useMemo, useRef, useState } from "react";
import type { AIResponse, UserRole, Recommendation } from "../types";
import { buildPlaceholderImage } from "../services/amazonLinks";

type Props = {
  role: UserRole;
  onSend: (msg: string) => void;
  lastResponse: AIResponse | null;
  isLoading: boolean;
};

function badgeStyle(label: Recommendation["label"]) {
  if (label === "MAIS BARATO") return { bg: "rgba(16,185,129,0.14)", br: "rgba(16,185,129,0.25)", tx: "#a7f3d0" };
  if (label === "CUSTO-BENEFÍCIO") return { bg: "rgba(56,189,248,0.14)", br: "rgba(56,189,248,0.25)", tx: "#bae6fd" };
  return { bg: "rgba(168,85,247,0.14)", br: "rgba(168,85,247,0.25)", tx: "#e9d5ff" };
}

function cleanSpeakText(s: string) {
  // Evita ler URLs gigantes e textos ruins
  return String(s || "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const ChatInterface: React.FC<Props> = ({ role, onSend, lastResponse, isLoading }) => {
  const [msg, setMsg] = useState("");

  // Speech (browser)
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recSupported, setRecSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef<string>("");

  const subtitle = useMemo(() => {
    return "Encontre produtos com precisão cirúrgica. Diga-me o que você precisa e eu buscarei o melhor preço.";
  }, []);

  const recs = lastResponse?.recommendations || [];

  const send = () => {
    const text = msg.trim();
    if (!text || isLoading) return;
    stopListening();
    onSend(text);
    setMsg("");
  };

  // --- init speech support ---
  useEffect(() => {
    const hasTTS = typeof window !== "undefined" && "speechSynthesis" in window;
    setSpeechSupported(Boolean(hasTTS));

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const hasRec = Boolean(SpeechRecognition);
    setRecSupported(hasRec);

    if (hasRec) {
      const rec = new SpeechRecognition();
      rec.lang = "pt-BR";
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.continuous = false;

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setMsg(transcript.trim());
      };

      recognitionRef.current = rec;
    }

    // cleanup speech when leaving
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {}
      try {
        recognitionRef.current?.abort?.();
      } catch {}
    };
  }, []);

  function speak(text: string) {
    const t = cleanSpeakText(text);
    if (!t) return;

    if (!("speechSynthesis" in window)) return;

    // Evita repetir a mesma fala em loop
    if (lastSpokenRef.current === t) return;
    lastSpokenRef.current = t;

    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = "pt-BR";
      u.rate = 1.0;
      u.pitch = 1.0;

      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(u);
    } catch {
      setIsSpeaking(false);
    }
  }

  function stopSpeaking() {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    setIsSpeaking(false);
  }

  function startListening() {
    if (!recognitionRef.current) return;
    stopSpeaking();
    try {
      recognitionRef.current.start();
    } catch {
      // Alguns navegadores dão erro se clicar rápido; ignore
    }
  }

  function stopListening() {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.abort();
    } catch {}
    setIsListening(false);
  }

  // Auto-fala quando chega resposta nova
  useEffect(() => {
    if (!autoSpeak) return;
    if (!speechSupported) return;
    const text = lastResponse?.text || "";
    if (!text) return;
    if (isLoading) return;

    // Fala apenas quando chega uma nova resposta útil
    speak(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResponse?.text, isLoading, autoSpeak, speechSupported]);

  // Texto “falado” do mascote (mostra status)
  const mascotLine = useMemo(() => {
    if (isLoading) return "Processando sua solicitação…";
    if (isListening) return "Estou ouvindo. Fale o nome do produto.";
    if (lastResponse?.text) return lastResponse.text;
    return "Diga ou digite o produto que você quer. Eu devolvo 3 opções para comparar.";
  }, [isLoading, isListening, lastResponse?.text]);

  return (
    <div style={{ minHeight: "100vh", color: "white", background: "#050816" }}>
      <div style={{ maxWidth: 1050, margin: "0 auto", padding: "60px 22px 120px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: -1 }}>À sua total disposição.</div>
          <div style={{ marginTop: 12, color: "rgba(255,255,255,0.72)", fontSize: 16 }}>{subtitle}</div>

          <div
            style={{
              marginTop: 22,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)"
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#34d399", display: "inline-block" }} />
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
              Online (API OK) • Perfil: <b>{role}</b>
            </span>
          </div>
        </div>

        {/* Painel principal */}
        <div
          style={{
            marginTop: 32,
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            padding: 18
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}
