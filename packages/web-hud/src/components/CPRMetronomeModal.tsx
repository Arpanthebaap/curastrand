import React, { useEffect, useRef, useState } from 'react';
import { Heart, Volume2, VolumeX, X, AlertOctagon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetBpm?: number;
}

export const CPRMetronomeModal: React.FC<Props> = ({ isOpen, onClose, targetBpm = 110 }) => {
  const [compressions, setCompressions] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const playClick = () => {
    if (isAudioMuted || typeof window === 'undefined') return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch click
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio fallback
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCompressions(0);
      return;
    }

    const intervalMs = (60 / targetBpm) * 1000;
    intervalRef.current = setInterval(() => {
      setCompressions(prev => prev + 1);
      playClick();
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, targetBpm, isAudioMuted]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border-2 border-red-500 rounded-2xl max-w-lg w-full p-6 text-center shadow-2xl shadow-red-950/60 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 bg-slate-900 rounded-full border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-mono text-xs font-bold mb-3 animate-pulse">
          <AlertOctagon className="w-4 h-4" /> LEVEL 1 EMERGENCY: CARDIAC ARREST PACER
        </div>

        <h2 className="text-2xl font-bold text-slate-100 mb-1">
          Bystander CPR Metronome
        </h2>
        <p className="text-sm text-slate-400 font-mono mb-6">
          AHA Standard Cadence: <span className="text-red-400 font-bold">{targetBpm} BPM</span>
        </p>

        {/* Pulsing Compression Circle */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute w-44 h-44 rounded-full bg-red-500/10 animate-ping" />
          <div className="w-36 h-36 rounded-full bg-gradient-to-br from-red-600 to-rose-700 flex flex-col items-center justify-center shadow-lg shadow-red-600/50 border-4 border-red-400 transform transition-transform duration-100 scale-95 active:scale-90">
            <Heart className="w-10 h-10 text-white animate-pulse" />
            <span className="text-2xl font-mono font-black text-white mt-1">
              {compressions}
            </span>
            <span className="text-[10px] font-mono text-red-200 uppercase tracking-widest">
              PUSH NOW
            </span>
          </div>
        </div>

        {/* Clinical Pacing Instructions */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 text-left text-xs space-y-2 mb-6">
          <div className="flex items-start gap-2">
            <span className="bg-red-500/20 text-red-400 font-mono font-bold px-1.5 py-0.5 rounded text-[10px]">1</span>
            <span className="text-slate-200">Place heel of one hand in center of chest. Interlock fingers.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-red-500/20 text-red-400 font-mono font-bold px-1.5 py-0.5 rounded text-[10px]">2</span>
            <span className="text-slate-200">Push hard and fast (at least 2 inches / 5 cm deep).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-red-500/20 text-red-400 font-mono font-bold px-1.5 py-0.5 rounded text-[10px]">3</span>
            <span className="text-slate-200">Allow complete chest recoil between each compression.</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-colors"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            {isAudioMuted ? 'Unmute Metronome' : 'Mute Click'}
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs font-mono transition-colors shadow-lg shadow-red-900/40"
          >
            Acknowledge / Pause
          </button>
        </div>
      </div>
    </div>
  );
};
