
import React, { useState } from 'react';
import { UserRole } from '../types';

interface PlanCheckoutProps {
  plan: UserRole;
  onCancel: () => void;
  onConfirm: () => void;
}

export const PlanCheckout: React.FC<PlanCheckoutProps> = ({ plan, onCancel, onConfirm }) => {
  const [step, setStep] = useState<'info' | 'payment'>('info');

  const planData = {
    [UserRole.AFFILIATE_PRO]: {
      name: "Plano Profissional",
      price: "US$ 20,00/mês",
      benefits: ["IDs Customizados", "Links Multi-Marketplace", "Suporte Prioritário", "IA Comercial"],
      color: "from-blue-600 to-indigo-700"
    },
    [UserRole.AFFILIATE_EXEC]: {
      name: "Plano Executivo",
      price: "US$ 50,00/mês",
      benefits: ["Mentoria Gemini Pro", "Estratégias Avançadas", "Análise de Mercado Real-time", "Acesso VIP"],
      color: "from-purple-600 to-amber-600"
    },
    [UserRole.CUSTOMER]: { name: "", price: "", benefits: [], color: "" }
  }[plan];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onCancel}></div>
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className={`h-32 bg-gradient-to-br ${planData.color} p-8 flex flex-col justify-end`}>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{planData.name}</h2>
          <p className="text-white/80 font-bold">{planData.price}</p>
        </div>
        
        <div className="p-8">
          {step === 'info' ? (
            <>
              <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">O que você libera agora:</h3>
              <ul className="space-y-3 mb-8">
                {planData.benefits.map((b, i) => (
                  <li key={i} className="flex items-center text-slate-200 text-sm font-medium">
                    <i className="fas fa-check-circle text-green-500 mr-3"></i> {b}
                  </li>
                ))}
              </ul>
              <div className="space-y-3">
                <button 
                  onClick={() => setStep('payment')}
                  className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                >
                  Continuar para Pagamento
                </button>
                <button 
                  onClick={onCancel}
                  className="w-full py-4 text-slate-500 font-bold hover:text-white transition-all text-sm"
                >
                  Talvez mais tarde
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-shield-halved text-green-500 text-2xl"></i>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Simulação de Pagamento</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                Ao clicar em confirmar, simularemos a aprovação da sua assinatura para liberar o acesso imediato.
              </p>
              <button 
                onClick={onConfirm}
                className="w-full py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-500 transition-all uppercase tracking-widest text-xs shadow-lg shadow-green-900/20"
              >
                Confirmar e Ativar Agora
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
