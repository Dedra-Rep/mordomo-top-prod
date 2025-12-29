import React, { useState, useEffect, useCallback, useRef } from "react";
import { UserRole, MascotState, AIResponse, AffiliateIDs } from "./types";
import { ButlerMascot } from "./components/ButlerMascot";
import { ChatInterface } from "./components/ChatInterface";
import { AffiliateConfig } from "./components/AffiliateConfig";
import { PlanCheckout } from "./components/PlanCheckout";
import { processUserRequest } from "./services/geminiService";
import { COLORS, BUTLER_PHRASES } from "./constants";

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [mascotState, setMascotState] = useState<MascotState>(MascotState.IDLE);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [affiliateIds, setAffiliateIds] = useState<AffiliateIDs>({});
  const [paidPlans, setPaidPlans] = useState<Set<UserRole>>(new Set([UserRole.CUSTOMER]));
  const [pendingPlan, setPendingPlan] = useState<UserRole | null>(null);

  // 🧠 CONTADOR DE BUSCAS (CTA inteligente)
  const [searchCount, setSearchCount] = useState(0);

  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setMascotState(MascotState.IDLE);
  }, []);

  const speak = useCallback(
    (text: string) => {
      stopSpeaking();
      if (isMuted || !text) return;
      if (typeof window === "undefined") return;

      setMascotState(MascotState.SPEAKING);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.onend = () => setMascotState(MascotState.IDLE);
      synthRef.current?.speak(utterance);
    },
    [isMuted, stopSpeaking]
  );

  useEffect(() => {
    const greeting =
      role === UserRole.CUSTOMER
        ? BUTLER_PHRASES.INITIAL_DESKTOP
        : role === UserRole.AFFILIATE_PRO
        ? BUTLER_PHRASES.PRO_WELCOME
        : BUTLER_PHRASES.EXEC_WELCOME;

    const timer = setTimeout(() => speak(greeting), 800);
    return () => clearTimeout(timer);
  }, [role, speak]);

  const handleRoleChange = (newRole: UserRole) => {
    if (paidPlans.has(newRole)) {
      setRole(newRole);
    } else {
      setPendingPlan(newRole);
      speak("Excelente escolha. Vamos confirmar sua adesão?");
    }
  };

  const confirmSubscription = () => {
    if (pendingPlan) {
      setPaidPlans((prev) => new Set(prev).add(pendingPlan));
      setRole(pendingPlan);
      setPendingPlan(null);
      speak("Assinatura confirmada. Bem-vindo ao Mordomo.Pro.");
    }
  };

  const handleSend = async (msg: string) => {
    stopSpeaking();
    setIsLoading(true);
    setMascotState(MascotState.THINKING);

    try {
      const response = await processUserRequest(msg, role, affiliateIds);
      setLastResponse(response);
      setSearchCount((c) => c + 1); // 👈 incrementa buscas
      speak(response.speech);
    } catch (err: any) {
      setLastResponse({ speech: err?.message || "Erro ao processar." } as any);
    } finally {
      setIsLoading(false);
      setMascotState(MascotState.IDLE);
    }
  };

  return (
    <div className={`min-h-screen ${COLORS[role].primary} text-slate-100 flex flex-col`}>
      <main className="flex-1 relative pb-32 overflow-x-hidden">
        <ChatInterface
          role={role}
          onSend={handleSend}
          lastResponse={lastResponse}
          isLoading={isLoading}
        />

        {/* 🔵 CTA PRO CONTEXTUAL */}
        {role === UserRole.CUSTOMER && searchCount >= 1 && (
          <div className="max-w-3xl mx-auto px-6 mt-10 text-center">
            <p className="text-slate-300 text-sm">
              Quer transformar isso em renda?
            </p>
            <p className="mt-2 text-slate-400 text-xs">
              No <strong>Mordomo.Pro</strong>, você usa essa mesma inteligência para
              ganhar dinheiro como afiliado em vários marketplaces.
            </p>

            <button
              onClick={() => handleRoleChange(UserRole.AFFILIATE_PRO)}
              className="mt-4 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition hover:opacity-90"
              style={{ backgroundColor: "#f59e0b", color: "#0b1220" }}
            >
              Ativar Mordomo.Pro
            </button>
          </div>
        )}

        <ButlerMascot
          state={mascotState}
          role={role}
          emotion={lastResponse?.emotion}
          isMuted={isMuted}
          onStop={stopSpeaking}
          onMuteToggle={() => setIsMuted(!isMuted)}
          onDismiss={stopSpeaking}
        />

        {role !== UserRole.CUSTOMER && (
          <AffiliateConfig
            ids={affiliateIds}
            onSave={(ids) => {
              setAffiliateIds(ids);
              handleSend("Configurei meus IDs.");
            }}
          />
        )}

        {pendingPlan && (
          <PlanCheckout
            plan={pendingPlan}
            onCancel={() => setPendingPlan(null)}
            onConfirm={confirmSubscription}
          />
        )}
      </main>
    </div>
  );
};

export default App;
