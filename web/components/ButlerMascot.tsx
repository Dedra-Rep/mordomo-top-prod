
import React, { useState, useEffect } from 'react';
import { MascotState, UserRole } from '../types';
import { COLORS } from '../constants';

interface ButlerMascotProps {
  state: MascotState;
  role: UserRole;
  emotion?: 'neutral' | 'happy' | 'attentive' | 'thinking';
  isMuted: boolean;
  onStop: () => void;
  onMuteToggle: () => void;
  onDismiss: () => void;
  isVisible?: boolean;
}

export const ButlerMascot: React.FC<ButlerMascotProps> = ({ 
  state, 
  role, 
  emotion = 'neutral',
  isMuted, 
  onStop, 
  onMuteToggle, 
  onDismiss,
  isVisible = true
}) => {
  const [mouthOpenAmount, setMouthOpenAmount] = useState(0);
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const isPro = role !== UserRole.CUSTOMER;
  const branding = role === UserRole.CUSTOMER ? "MORDOMO.AI" : "MORDOMO.TOP";
  const theme = COLORS[role];

  useEffect(() => {
    let interval: number;
    if (state === MascotState.SPEAKING) {
      interval = window.setInterval(() => {
        setMouthOpenAmount(Math.random() * 8 + 2);
      }, 80);
    } else {
      setMouthOpenAmount(0);
    }
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    const moveEyes = () => {
      if (isPro && role === UserRole.AFFILIATE_EXEC) {
         // Executive is more focused/steady
         setPupilPos({ x: 0, y: 0 }); 
         return;
      }
      if (state === MascotState.IDLE) {
        setPupilPos({ 
          x: (Math.random() - 0.5) * 4, 
          y: (Math.random() - 0.5) * 2 
        });
      } else if (state === MascotState.THINKING || state === MascotState.LISTENING) {
        setPupilPos({ x: 0, y: -2 });
      } else {
        setPupilPos({ x: 0, y: 0 });
      }
    };
    
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 120);
    };

    const eyeInt = setInterval(moveEyes, isPro ? 6000 : 2500);
    const blinkInt = setInterval(blink, isPro ? 8000 : 5000);
    
    return () => {
      clearInterval(eyeInt);
      clearInterval(blinkInt);
    };
  }, [state, isPro, role]);

  if (!isVisible) return null;

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 left-4 z-[2000]">
        <button 
          onClick={() => setIsExpanded(true)} 
          className="bg-amber-500 text-[#030D1E] p-5 rounded-full shadow-2xl animate-bounce border-4 border-[#030D1E] transition-all hover:scale-110 flex items-center justify-center group relative overflow-hidden"
        >
          <i className="fas fa-bell text-2xl relative z-10"></i>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </div>
    );
  }

  const getEyebrowPath = (side: 'left' | 'right') => {
    const isLeft = side === 'left';
    if (isPro && role === UserRole.AFFILIATE_EXEC) return isLeft ? "M 35 46 Q 40 44 45 46" : "M 75 46 Q 80 44 85 46";
    if (state === MascotState.THINKING) return isLeft ? "M 35 48 Q 40 42 45 48" : "M 75 48 Q 80 42 85 48";
    if (state === MascotState.LISTENING) return isLeft ? "M 34 50 Q 40 45 46 50" : "M 74 50 Q 80 45 86 50";
    if (emotion === 'happy') return isLeft ? "M 32 48 Q 40 40 48 48" : "M 72 48 Q 80 40 88 48";
    return isLeft ? "M 35 50 Q 40 48 45 50" : "M 75 50 Q 80 48 85 50";
  };

  const statusColor = 
    state === MascotState.THINKING ? '#F59E0B' : 
    state === MascotState.LISTENING ? '#3B82F6' : 
    state === MascotState.SPEAKING ? '#10B981' : '#475569';

  return (
    <div className="fixed bottom-4 left-4 z-[2000] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="relative group">
        {/* Controls Overlay */}
        <div className="absolute -top-16 left-0 flex gap-2 bg-[#07152B]/95 backdrop-blur-3xl p-2 rounded-2xl border border-white/10 shadow-2xl z-30 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2">
          <button 
            onClick={onMuteToggle} 
            title="Silenciar voz"
            className={`p-2.5 rounded-xl transition-all ${isMuted ? 'text-red-400 bg-red-400/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
          </button>
          {(state === MascotState.SPEAKING || state === MascotState.THINKING) && (
             <button onClick={onStop} title="Parar fala" className="p-2.5 text-amber-500 bg-amber-500/10 rounded-xl hover:bg-amber-500/20">
               <i className="fas fa-square"></i>
             </button>
          )}
          <button onClick={() => setIsExpanded(false)} title="Minimizar" className="p-2.5 text-slate-500 hover:text-white transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Mascot Body */}
        <div className={`w-36 h-48 relative transition-all duration-700 ease-out ${state === MascotState.LISTENING ? 'scale-105' : 'scale-100'}`}>
          <svg viewBox="0 0 120 150" className="w-full h-full drop-shadow-[0_25px_50px_rgba(0,0,0,0.6)]">
            <defs>
              <linearGradient id="headGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#FFFFFF' }} />
                <stop offset="100%" style={{ stopColor: '#CBD5E1' }} />
              </linearGradient>
              <radialGradient id="eyeHighlight" cx="30%" cy="30%" r="50%">
                <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#FFFFFF', stopOpacity: 0 }} />
              </radialGradient>
              <linearGradient id="suitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: theme.butlerSuit }} />
                <stop offset="100%" style={{ stopColor: '#0F172A' }} />
              </linearGradient>
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="1" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Suit */}
            <path d="M 20 145 Q 20 110 60 110 Q 100 110 100 145 L 100 150 L 20 150 Z" fill="url(#suitGradient)" />
            <path d="M 45 110 L 60 122 L 75 110 L 60 115 Z" fill="#F8FAFC" filter="url(#shadow)" />
            <g transform="translate(60, 122)">
              <path d="M -12 -6 Q -15 0 -12 6 L 0 0 Z" fill={theme.tie} />
              <path d="M 12 -6 Q 15 0 12 6 L 0 0 Z" fill={theme.tie} />
              <rect x="-3" y="-3" width="6" height="6" rx="1" fill={theme.tie} />
            </g>

            {/* Head */}
            <path 
              d="M 30 40 Q 30 25 60 25 Q 90 25 90 40 L 90 85 Q 90 105 60 105 Q 30 105 30 85 Z" 
              fill="url(#headGradient)" 
              stroke="#0F172A" 
              strokeWidth="4" 
            />

            {/* Eyebrows */}
            <path d={getEyebrowPath('left')} fill="none" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <path d={getEyebrowPath('right')} fill="none" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />

            {/* Eyes */}
            <g transform={`translate(${pupilPos.x * 0.5}, ${pupilPos.y * 0.5})`}>
              <circle cx="45" cy="65" r="14" fill="#0F172A" />
              <circle cx="45" cy="65" r="12" fill="#FFFFFF" style={{ transform: isBlinking ? 'scaleY(0)' : 'scaleY(1)', transformOrigin: '45px 65px' }} className="transition-transform duration-100" />
              <g style={{ opacity: isBlinking ? 0 : 1 }}>
                <circle cx={45 + pupilPos.x} cy={65 + pupilPos.y} r="6" fill="#1E293B" />
                <circle cx={43 + pupilPos.x} cy={63 + pupilPos.y} r="2.5" fill="url(#eyeHighlight)" />
              </g>

              <circle cx="75" cy="65" r="14" fill="#0F172A" />
              <circle cx="75" cy="65" r="12" fill="#FFFFFF" style={{ transform: isBlinking ? 'scaleY(0)' : 'scaleY(1)', transformOrigin: '75px 65px' }} className="transition-transform duration-100" />
              <g style={{ opacity: isBlinking ? 0 : 1 }}>
                <circle cx={75 + pupilPos.x} cy={65 + pupilPos.y} r="6" fill="#1E293B" />
                <circle cx={73 + pupilPos.x} cy={63 + pupilPos.y} r="2.5" fill="url(#eyeHighlight)" />
              </g>
            </g>

            {/* Mouth */}
            <g transform="translate(60, 92)">
              {state === MascotState.LISTENING ? (
                <rect x="-8" y="-1" width="16" height="2" rx="1" fill="#3B82F6" className="animate-pulse" />
              ) : (
                <path d={`M -12 0 Q 0 ${mouthOpenAmount} 12 0`} fill="none" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" className="transition-all duration-100" />
              )}
            </g>

            {/* Status Dot */}
            <circle cx="100" cy="35" r="5" fill={statusColor} className={state !== MascotState.IDLE ? 'animate-pulse' : ''} />
          </svg>
          
          <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#0F172A] ${isPro ? 'text-amber-500' : 'text-sky-400'} text-[10px] font-black px-4 py-1.5 rounded-full border border-white/20 uppercase tracking-[0.2em] shadow-2xl z-20 italic whitespace-nowrap`}>
            {state === MascotState.THINKING ? 'ANALISANDO' : state === MascotState.LISTENING ? 'OUVINDO' : branding}
          </div>
        </div>
      </div>
    </div>
  );
};
