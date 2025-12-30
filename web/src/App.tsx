import React, { useEffect, useState } from "react";
import type { PlanId } from "./types";
import { PlanTabs } from "./components/PlanTabs";
import { ChatInterface } from "./components/ChatInterface";
import { Mascot } from "./components/Mascot";

type Mood = "idle" | "listening" | "thinking" | "speaking" | "error";

export default function App() {
  const [plan, setPlan] = useState<PlanId>("free");
  const [mood, setMood] = useState<Mood>("idle");
  const [voiceOn, setVoiceOn] = useState<boolean>(true);
  const [sayText, setSayText] = useState<string>("");

  useEffect(() => {
    // Persistência simples
    const p = localStorage.getItem("mordomo_plan") as PlanId | null;
    if (p === "free" || p === "pro" || p === "exec") setPlan(p);

    const v = localStorage.getItem("mordomo_voice");
    if (v === "0") setVoiceOn(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("mordomo_plan", plan);
  }, [plan]);

  function toggleVoice() {
    const next = !voiceOn;
    setVoiceOn(next);
    localStorage.setItem("mordomo_voice", next ? "1" : "0");
  }

  return (
    <div className="min-h-screen bg-[#050b16] text-white">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black/10 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-black">
              M
            </div>
            <div>
              <div className="font-black leading-4">MORDOMO.AI</div>
              <div className="text-[11px] text-white/50">SMART ASSISTANT</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PlanTabs plan={plan} onChange={setPlan} />
            <span className="px-3 py-1 rounded-full text-xs border border-green-400/20 bg-green-500/10 text-green-200">
              ● LIVE
            </span>
          </div>
        </div>
      </div>

      <div className="pt-16">
        <ChatInterface
          plan={plan}
          onMood={setMood}
          onSpokenText={(t) => setSayText(t)}
        />
      </div>

      <Mascot
        plan={plan}
        mood={mood}
        sayText={sayText}
        enabled={voiceOn}
        onToggle={toggleVoice}
      />
    </div>
  );
}
