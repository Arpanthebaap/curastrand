import React from 'react';
import { RingState } from '../types';
import { Shield, Unlock, Lock, Video, Siren, KeyRound } from 'lucide-react';

interface Props {
  ringState: RingState;
  onToggleLock: () => void;
}

export const RingPerimeterHUD: React.FC<Props> = ({ ringState, onToggleLock }) => {
  return (
    <div className={`clinical-card rounded-xl p-5 border transition-all duration-300 ${
      !ringState.frontDoorLocked ? 'border-amber-500/70 clinical-glow-amber' : 'border-slate-800'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${!ringState.frontDoorLocked ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
              Ring Smart Perimeter Access
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Device: <span className="text-cyan-400">{ringState.deviceId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-2.5 py-1 rounded text-xs font-mono font-medium border ${
            !ringState.frontDoorLocked
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {ringState.frontDoorLocked ? 'DEADBOLT SECURE' : 'EMERGENCY OVERRIDE: UNLOCKED'}
          </span>
        </div>
      </div>

      {/* Simulated Ring Camera Live Feed */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black aspect-video mb-4 flex items-center justify-center">
        {/* Mock camera visual */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 z-10" />
        
        {/* Background porch scene representation */}
        <div className="absolute inset-0 bg-slate-900 opacity-60 flex items-center justify-center">
          <div className="w-24 h-44 border-2 border-slate-700/80 rounded relative flex items-center justify-center">
            {/* Front door silhouette */}
            <div className={`w-3 h-3 rounded-full absolute right-2 ${ringState.frontDoorLocked ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'}`} />
            <span className="text-[10px] font-mono text-slate-600">FRONT ENTRY</span>
          </div>
        </div>

        {/* Live indicator & Camera watermark */}
        <div className="absolute top-2.5 left-3 z-20 flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-200 tracking-wider flex items-center gap-1">
            <Video className="w-3 h-3 text-red-400" /> RING PORCH CAM 1080p
          </span>
        </div>

        <div className="absolute top-2.5 right-3 z-20 text-[10px] font-mono text-slate-400">
          {new Date().toLocaleTimeString()} PST
        </div>

        {/* Center overlay banner if emergency unlocked */}
        {!ringState.frontDoorLocked && (
          <div className="z-20 bg-amber-500/90 text-slate-950 font-mono font-bold text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-bounce">
            <Unlock className="w-4 h-4" /> FIRST RESPONDER ENTRY GRANTED
          </div>
        )}

        {/* Bottom telemetry overlay */}
        <div className="absolute bottom-2.5 left-3 right-3 z-20 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-300">
            {ringState.emergencyStrobeActive ? (
              <span className="text-amber-400 flex items-center gap-1">
                <Siren className="w-3.5 h-3.5 animate-spin" /> Floodlight SOS Beacon Pulsing
              </span>
            ) : (
              <span className="text-slate-400">Ambient Lighting Active</span>
            )}
          </span>

          <span className="text-slate-400 flex items-center gap-1">
            <KeyRound className="w-3 h-3 text-cyan-400" /> CAD PIN: <span className="text-cyan-300 font-bold">#{ringState.temporaryAccessPin}#</span>
          </span>
        </div>
      </div>

      {/* Access Controls & Status Description */}
      <div className="space-y-3">
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs">
          <span className="text-slate-500 font-mono block mb-1">PERIMETER TELEMETRY EVENT:</span>
          <p className="font-mono text-slate-300">
            {ringState.lastEventDescription}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLock}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors border ${
              ringState.frontDoorLocked
                ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/40'
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {ringState.frontDoorLocked ? (
              <>
                <Unlock className="w-4 h-4" /> Simulate Emergency Override Unlock
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Re-engage Smart Deadbolt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
