
import React, { useState, useRef, useEffect } from 'react';
import { MascotState, UserRole, AIResponse } from '../types';
import { COLORS } from '../constants';

interface ChatInterfaceProps {
  role: UserRole;
  onSend: (msg: string) => void;
  lastResponse: AIResponse | null;
  isLoading: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ role, onSend, lastResponse, isLoading }) => {
  const [input, setInput] = useState('');
  const theme = COLORS[role];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [lastResponse, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  const isPro = role !== UserRole.CUSTOMER;
  const branding = isPro ? "MORDOMO.TOP" : "MORDOMO.AI";

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700"
      >
        {!lastResponse && !isLoading && (
          <div className="text-center py-20 animate-in fade-in zoom-in duration-700">
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter text-white">
              {isPro ? "Pronto para decolar?" : "À sua total disposição."}
            </h1>
            <p className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed">
              {isPro 
                ? "Procure qualquer produto ou peça orientação para sua carreira de afiliado. Estou aqui para transformar sua performance."
                : "Encontre produtos com precisão cirúrgica. Diga-me o que você precisa e eu buscarei o melhor preço."}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest text-slate-500">
                <i className="fas fa-bolt mr-2 text-amber-500"></i> Velocidade Máxima
              </div>
              <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest text-slate-500">
                <i className="fas fa-graduation-cap mr-2 text-purple-500"></i> Mentoria Expert
              </div>
            </div>
          </div>
        )}

        {lastResponse && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-800/30 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl">
              <p className="text-sky-400 text-[10px] mb-3 font-black uppercase tracking-[0.2em]">{lastResponse.pedido_do_cliente}</p>
              <p className="text-xl md:text-2xl font-medium leading-tight text-slate-100">{lastResponse.entendimento}</p>
            </div>

            {lastResponse.results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lastResponse.results.map((item, idx) => (
                  <div key={idx} className={`relative p-5 rounded-2xl border ${theme.border} bg-slate-800/20 hover:bg-slate-800/40 transition-all group overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                      <i className="fab fa-amazon text-4xl"></i>
                    </div>
                    <div className="absolute -top-3 left-4 bg-[#0f172a] border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-500">
                      {item.rotulo}
                    </div>
                    <h3 className="text-lg font-bold mt-2 mb-1 text-white line-clamp-2">{item.nome}</h3>
                    <p className="text-xs text-slate-400 mb-4 line-clamp-3 leading-relaxed">{item.porque}</p>
                    <a 
                      href={item.link_afiliado} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-center py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest bg-amber-500 hover:bg-amber-400 transition-all text-slate-900 shadow-lg shadow-amber-900/20"
                    >
                      Comprar Agora
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-transparent sticky bottom-0 z-10">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="O que você deseja comprar ou aprender agora?"
            className="w-full bg-[#07152B]/80 backdrop-blur-2xl border-2 border-white/5 rounded-full px-8 py-4 pr-16 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 shadow-2xl transition-all"
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-slate-900 hover:bg-amber-400 hover:scale-105 transition-all disabled:opacity-50 shadow-lg"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-600 mt-3 uppercase tracking-widest font-bold">
          {branding} — Inteligência de Mercado & Mentoria
        </p>
      </div>
    </div>
  );
};
