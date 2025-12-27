import React, { useState, useEffect, useCallback, useRef } from "react";
import { UserRole, MascotState, AIResponse, AffiliateIDs } from "./types";
import { ButlerMascot } from "./components/ButlerMascot";
import { ChatInterface } from "./components/ChatInterface";
import { AffiliateConfig } from "./components/AffiliateConfig";
import { PlanCheckout } from "./components/PlanCheckout";
import { processUserRequest } from "./services/geminiService";
import { COLORS, BUTLER_PHRASES } from "./constants";

const App: React.FC = () => {
  // IMPORTANTE: seu UserRole deve estar alinhado com o backend:
  // CUSTOMER -> FREE (ou ajuste no types.ts)
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [mascotState, setMascotState] = useState<MascotState>(MascotState.IDLE);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [affiliateIds, setAffiliateIds] = useState<AffiliateIDs>({});

  const [paidPlans, setPaidPlans] = useState<Set<UserRole>>(new Set([UserRole.CUSTOMER]));
  const [pendingPlan, setPendingPlan] = useState<UserRole | null>(null);

  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setMascotState(MascotState.IDLE);
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      stopSpeaking();
      if (isMuted || !text) return;
      if (typeof window === "undefined") return;

      setMascotState(MascotState.SPEAKING);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 1.0;
      utterance.onend = () => setMascotState(MascotState.IDLE);
      utterance.onerror = () => setMascotState(MascotState.IDLE);

      synthRef.current?.speak(utterance);
    },
    [isMuted, stopSpeaking]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = window.innerWidth < 768;
    const greeting =
      role === UserRole.CUSTOMER
        ? isMobile
          ? BUTLER_PHRASES.INITIAL_MOBILE
          : BUTLER_PHRASES.INITIAL_DESKTOP
        : role === UserRole.AFFILIATE_PRO
          ? BUTLER_PHRASES.PRO_WELCOME
          : BUTLER_PHRASES.EXEC_WELCOME;

    const timer = setTimeout(() => speak(greeting), 1000);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [role, speak, stopSpeaking]);

  const handleRoleChange = (newRole: UserRole) => {
    if (paidPlans.has(newRole)) {
      setRole(newRole);
    } else {
      setPendingPlan(newRole);
      speak(
        `Excelente escolha. O plano ${
          newRole === UserRole.AFFILIATE_PRO ? "Profissional" : "Executivo"
        } vai mudar o seu jogo. Vamos confirmar sua adesão?`
      );
    }
  };

  const confirmSubscription = () => {
    if (pendingPlan) {
      setPaidPlans((prev) => new Set(Array.from(prev).concat(pendingPlan)));
      setRole(pendingPlan);
      setPendingPlan(null);
      speak("Assinatura confirmada com sucesso! Bem-vindo ao próximo nível. Já liberei suas novas ferramentas.");
    }
  };

  const handleSend = async (msg: string) => {
    stopSpeaking();
    setIsLoading(true);
    setMascotState(MascotState.THINKING);

    try {
      const response = await processUserRequest(msg, role, affiliateIds);
      setLastResponse(response);
      setMascotState(MascotState.IDLE);
      speak(response.speech);
    } catch (err) {
      console.error(err);
      setMascotState(MascotState.IDLE);
    } finally {
      setIsLoading(false);
    }
  };

  const currentBrand = role === UserRole.CUSTOMER ? "MORDOMO.AI" : "MORDOMO.TOP";

  return (
    <div className={`min-h-screen ${COLORS[role].primary} text-slate-100 transition-colors duration-700 overflow-hidden flex flex-col`}>
      <header className="p-4 border-b border-white/5 flex justify-between items-center z-40 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-black text-xl italic">M</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter uppercase">{currentBrand}</h1>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              {role === UserRole.AFFILIATE_EXEC ? "Mentor Executivo" : "Assistente Inteligente"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-white/5 rounded-full p-1 border border-white/10">
            <button
              onClick={() => handleRoleChange(UserRole.CUSTOMER)}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase transition-all ${
                role === UserRole.CUSTOMER ? "bg-sky-600 text-white shadow-lg" : "text-slate-400"
              }`}
            >
              Grátis
            </button>

            <button
              onClick={() => handleRoleChange(UserRole.AFFILIATE_PRO)}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase transition-all flex items-center gap-2 ${
                role === UserRole.AFFILIATE_PRO ? "bg-blue-600 text-white shadow-lg" : "text-slate-400"
              }`}
            >
              {!paidPlans.has(UserRole.AFFILIATE_PRO) && <i className="fas fa-lock text-[8px]"></i>} Profissional
            </button>

            <button
              onClick={() => handleRoleChange(UserRole.AFFILIATE_EXEC)}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase transition-all flex items-center gap-2 ${
                role === UserRole.AFFILIATE_EXEC ? "bg-purple-600 text-white shadow-lg" : "text-slate-400"
              }`}
            >
              {!paidPlans.has(UserRole.AFFILIATE_EXEC) && <i className="fas fa-lock text-[8px]"></i>} Executivo
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-green-900/20 rounded-full border border-green-500/30">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">
              Ativo
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 relative pb-32 overflow-hidden">
        <ChatInterface role={role} onSend={handleSend} lastResponse={lastResponse} isLoading={isLoading} />

        <ButlerMascot
          state={mascotState}
          role={role}
          emotion={lastResponse?.emotion}
          isMuted={isMuted}
          onStop={stopSpeaking}
          onMuteToggle={() => setIsMuted(!isMuted)}
          onDismiss={() => stopSpeaking()}
        />

        {role !== UserRole.CUSTOMER && (
          <AffiliateConfig
            ids={affiliateIds}
            onSave={(ids) => {
              setAffiliateIds(ids);
              handleSend("Configurei meus IDs. Vamos começar.");
            }}
          />
        )}

        {pendingPlan && (
          <PlanCheckout plan={pendingPlan} onCancel={() => setPendingPlan(null)} onConfirm={confirmSubscription} />
        )}
      </main>
    </div>
  );
};

export default App;
