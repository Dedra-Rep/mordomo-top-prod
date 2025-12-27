
import React, { useState } from 'react';
import { AffiliateIDs } from '../types';

interface AffiliateConfigProps {
  ids: AffiliateIDs;
  onSave: (ids: AffiliateIDs) => void;
}

export const AffiliateConfig: React.FC<AffiliateConfigProps> = ({ ids, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(ids);

  const handleSave = () => {
    onSave(form);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-6 right-6 z-[100]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-500 p-1 animate-gear shadow-lg shadow-pink-500/20 flex items-center justify-center"
      >
        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
          <i className="fas fa-cog text-2xl text-white"></i>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-16 right-0 w-80 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold mb-4 flex items-center text-white">
            <i className="fas fa-id-card mr-2 text-pink-500"></i> Configurar IDs
          </h2>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">1. Amazon Tag</label>
              <input 
                type="text" 
                value={form.amazon || ''} 
                onChange={e => setForm({...form, amazon: e.target.value})}
                placeholder="seuid-20"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">2. Mercado Livre ID</label>
              <input 
                type="text" 
                value={form.mercadolivre || ''} 
                onChange={e => setForm({...form, mercadolivre: e.target.value})}
                placeholder="ID de Afiliado ML"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">3. Shopee ID</label>
              <input 
                type="text" 
                value={form.shopee || ''} 
                onChange={e => setForm({...form, shopee: e.target.value})}
                placeholder="ID de Afiliado Shopee"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-pink-500 outline-none"
              />
            </div>
            <button 
              onClick={handleSave}
              className="w-full mt-2 bg-gradient-to-r from-pink-600 to-amber-600 text-white font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Salvar e Ativar IA
            </button>
            <div className="pt-4 mt-4 border-t border-slate-800">
              <p className="text-[9px] text-slate-600 text-center uppercase tracking-widest font-bold">
                Build ID: MORDOMO-V1-DEPLOY-OK
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
