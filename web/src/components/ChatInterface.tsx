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
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Resultado</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                {isLoading ? "Buscando as melhores opções..." : recs.length ? "3 opções para comparar" : "Digite ou fale um produto"}
              </div>
            </div>

            {/* Controles de voz */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                />
                Falar automaticamente
              </label>

              <button
                onClick={() => (isSpeaking ? stopSpeaking() : speak(lastResponse?.text || mascotLine))}
                disabled={!speechSupported}
                style={{
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  cursor: speechSupported ? "pointer" : "not-allowed",
                  opacity: speechSupported ? 1 : 0.45,
                  fontWeight: 800
                }}
                title={speechSupported ? "Ler em voz alta" : "Voz não suportada neste navegador"}
              >
                {isSpeaking ? "Parar voz" : "Falar"}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 12, color: "rgba(255,255,255,0.78)", fontSize: 14, lineHeight: 1.45 }}>
            {isLoading ? "Processando sua solicitação…" : lastResponse?.text || "Exemplo: “bicicleta infantil aro 20” ou “notebook i5 16gb”."}
          </div>

          {recs.length > 0 && (
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
              {recs.slice(0, 3).map((it, idx) => {
                const c = badgeStyle(it.label);
                const img = buildPlaceholderImage(it.title);

                return (
                  <div key={idx} style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.25)", padding: 12 }}>
                    <div
                      style={{
                        display: "inline-flex",
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: `1px solid ${c.br}`,
                        background: c.bg,
                        color: c.tx,
                        fontSize: 12,
                        fontWeight: 800
                      }}
                    >
                      {it.label}
                    </div>

                    <div style={{ marginTop: 10, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.2)", aspectRatio: "1/1" as any }}>
                      <img src={img} alt={it.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>

                    <div style={{ marginTop: 10, fontSize: 14, fontWeight: 800 }}>{it.title}</div>

                    {it.priceText && <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{it.priceText}</div>}
                    {it.why && <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.62)", lineHeight: 1.35 }}>{it.why}</div>}

                    <a
                      href={it.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        marginTop: 12,
                        display: "inline-flex",
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10px 12px",
                        borderRadius: 14,
                        background: "#fbbf24",
                        color: "#111827",
                        fontWeight: 900,
                        textDecoration: "none"
                      }}
                    >
                      Ver oferta
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input com microfone */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            padding: 10
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
              background: "transparent",
              border: "none",
              outline: "none",
              color: "white",
              fontSize: 14,
              padding: "10px 10px"
            }}
          />

          <button
            onClick={() => (isListening ? stopListening() : startListening())}
            disabled={!recSupported || isLoading}
            style={{
              width: 46,
              height: 46,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              cursor: recSupported && !isLoading ? "pointer" : "not-allowed",
              background: isListening ? "rgba(239,68,68,0.85)" : "rgba(255,255,255,0.06)",
              color: "#fff",
              fontWeight: 900,
              opacity: recSupported ? 1 : 0.45
            }}
            title={recSupported ? (isListening ? "Parar gravação" : "Falar (microfone)") : "Reconhecimento de voz não suportado"}
          >
            🎙
          </button>

          <button
            onClick={send}
            disabled={isLoading}
            style={{
              width: 46,
              height: 46,
              borderRadius: 999,
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              background: "#f59e0b",
              color: "#111827",
              fontWeight: 900,
              opacity: isLoading ? 0.55 : 1
            }}
            title="Enviar"
          >
            ➤
          </button>
        </div>

        <div style={{ marginTop: 14, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
          MORDOMO.TOP — Inteligência de Mercado & Mentoria
        </div>
      </div>

      {/* Mascote falante (fixo) */}
      <div
        style={{
          position: "fixed",
          left: 16,
          bottom: 16,
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          maxWidth: 520,
          zIndex: 50
        }}
      >
        {/* Avatar simples sem depender de assets externos */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 22,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 12px 30px rgba(0,0,0,0.35)"
          }}
          title="Mordomo"
        >
          <div style={{ fontSize: 34 }}>🤵</div>
        </div>

        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.35)",
            padding: "12px 14px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.35)"
          }}
        >
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>MORDOMO</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.86)", lineHeight: 1.35, maxWidth: 420 }}>
            {mascotLine}
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => (isSpeaking ? stopSpeaking() : speak(mascotLine))}
              disabled={!speechSupported}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                cursor: speechSupported ? "pointer" : "not-allowed",
                opacity: speechSupported ? 1 : 0.45,
                fontWeight: 800,
                fontSize: 12
              }}
            >
              {isSpeaking ? "Parar" : "Ouvir"}
            </button>

            <button
              onClick={() => (isListening ? stopListening() : startListening())}
              disabled={!recSupported || isLoading}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: isListening ? "rgba(239,68,68,0.85)" : "rgba(255,255,255,0.06)",
                color: "#fff",
                cursor: recSupported && !isLoading ? "pointer" : "not-allowed",
                opacity: recSupported ? 1 : 0.45,
                fontWeight: 800,
                fontSize: 12
              }}
            >
              {isListening ? "Ouvindo…" : "Falar"}
            </button>
          </div>

          {!speechSupported && (
            <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
              Voz não disponível neste navegador.
            </div>
          )}
          {!recSupported && (
            <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
              Microfone não disponível (use Chrome/Edge).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
