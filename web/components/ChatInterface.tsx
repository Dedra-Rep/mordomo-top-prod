import React, { useState } from 'react';
import { AIResponse, UserRole } from '../types';

interface Props {
  role: UserRole;
  onSend: (msg: string) => void;
  lastResponse: AIResponse | null;
  isLoading: boolean;
}

export const ChatInterface: React.FC<Props> = ({
  onSend,
  lastResponse,
  isLoading
}) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60">
      {lastResponse && (
        <div className="mb-3 p-3 rounded bg-white/5 text-sm">
          <strong>Mordomo:</strong> {lastResponse.speech}
        </div>
      )}

      <div className="flex gap-2">
        <input
          className="flex-1 p-3 rounded bg-black text-white border border-white/10"
          placeholder="O que você deseja comprar?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-4 rounded bg-yellow-500 text-black font-bold"
        >
          {isLoading ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
};
