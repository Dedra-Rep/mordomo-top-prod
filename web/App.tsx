import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole, MascotState, AIResponse, AffiliateIDs } from './types';
import { ButlerMascot } from './components/ButlerMascot';
import { ChatInterface } from './components/ChatInterface';
import { AffiliateConfig } from './components/AffiliateConfig';
import { PlanCheckout } from './components/PlanCheckout';
import { COLORS, BUTLER_PHRASES } from './constants';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [mascotState, setMascotState] = useState<MascotState>(MascotState.IDLE);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [affiliateIds, setAffiliateIds] = useState<AffiliateIDs>({});

  const [paidPlans, setPaidPlans] = useState<Set<UserRole>>(new Set([UserRole.CUSTOMER]));
  const [pendingPlan, setPendingPlan] = useState<UserRole | null>(null);

  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' ? window.speechSynthesis : null
  );

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setMascotState(MascotState.IDLE);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!text || isMuted || typeof window === 'undefined') return;
      stopSpeaking();
      setMascotState(MascotState.SPEAKING);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
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

    const t = setTimeout(() => speak(greeting), 800);
    return () => clearTimeout(t);
  }, [role, speak]);

  const handleRoleChange = (newRole: UserRole) => {
    if (paidPlans.has(newRole)) {
      setRole(newRole);
    } else {
      setPendingPlan(newRole);
      speak('Excelente escolha. Vamos confirmar sua adesão?');
    }
  };

  const confirmSubscription = () => {
    if (!pendingPlan) return;
    setPaidPlans((p) => new Set([...p, pendingPlan]));
    setRole(pendingPlan);
    setPendingPlan(null);
    speak('Assinatura confirmada. Bem-vindo ao próximo nível.');
  };

  // 🚀 AQUI ESTÁ A CONEXÃO COM A IA (FINALMENTE)
  const handleSend = async (msg: string) => {
    stopSpeaking();
    setIsLoading(true);
    setMascotState(MascotState.THINKING);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: msg,
          role,
          affiliateIds
        })
      });

      if (!res.ok) throw new Error('Erro na API');

      const data: AIResponse = await res.json();
      setLastResponse(data);
      speak(data.speech);
    } catch (err) {
      console.error('Erro IA:', err);
      speak('Tive um problema ao pensar. Tente novamente.');
    } finally {
      setIsLoading(false);
      setMascotState(MascotState.IDLE);
    }
  };

  const currentBrand = role === UserRole.CUSTOMER ? 'MORDOMO.AI' : 'MORDOMO.TOP';

  return (
    <div className={`min-h-screen ${COLORS[role].primary} text-slate-100 flex flex-col`}>
      <header className="p-4 border-b border-white/5 flex justify-between bg-black/40">
        <h1 className="font-black">{currentBrand}</h1>

        <div className="flex gap-2">
          <button onClick={() => handleRoleChange(UserRole.CUSTOMER)}>Grátis</button>
          <button onClick={() => handleRoleChange(UserRole.AFFILIATE_PRO)}>Profissional</button>
          <button onClick={() => handleRoleChange(UserRole.AFFILIATE_EXEC)}>Executivo</button>
        </div>
      </header>

      <main className="flex-1 relative pb-32">
        <ChatInterface
          role={role}
          onSend={handleSend}
          lastResponse={lastResponse}
          isLoading={isLoading}
        />

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
              handleSend('Configurei meus IDs.');
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
