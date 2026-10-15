import React, { useEffect, useRef } from 'react';
import { PatientVitals } from '../types';
import { Activity, Heart, Wind, ShieldAlert, Cpu } from 'lucide-react';

interface Props {
  vitals: PatientVitals;
}

export const VitalsWaveformCanvas: React.FC<Props> = ({ vitals }) => {
  const ecgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ppgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const ecgCanvas = ecgCanvasRef.current;
    const ppgCanvas = ppgCanvasRef.current;
    if (!ecgCanvas || !ppgCanvas) return;

    const ecgCtx = ecgCanvas.getContext('2d');
    const ppgCtx = ppgCanvas.getContext('2d');
    if (!ecgCtx || !ppgCtx) return;

    const width = ecgCanvas.width;
    const height = ecgCanvas.height;
    const ppgHeight = ppgCanvas.height;

    // Buffer arrays for continuous scrolling waveform
    const ecgData: number[] = new Array(width).fill(height / 2);
    const ppgData: number[] = new Array(width).fill(ppgHeight / 2);

    const render = () => {
      phaseRef.current += 1;
      const t = phaseRef.current;
      const hr = Math.max(20, Math.min(220, vitals.heartRateBpm));
      const period = (60 / hr) * 60; // frames per beat at ~60fps
      const cycle = t % period;
      const normCycle = cycle / period;

      let ecgSample = height / 2;
      let ppgSample = ppgHeight / 2;

      // 1. ECG Signal Synthesis
      if (vitals.ecgRhythm === 'ventricular_fibrillation') {
        // Chaotic, rapid, irregular undulating waveform
        const noise1 = Math.sin(t * 0.35) * 24;
        const noise2 = Math.sin(t * 0.72 + 1.2) * 16;
        const noise3 = (Math.random() - 0.5) * 8;
        ecgSample = height / 2 + noise1 + noise2 + noise3;
      } else if (vitals.ecgRhythm === 'asystole') {
        // Flatline with low-amplitude baseline artifact
        ecgSample = height / 2 + (Math.random() - 0.5) * 3;
      } else if (vitals.ecgRhythm === 'stemi_elevation') {
        // Monophasic QRS with marked tombstone ST-segment elevation
        if (normCycle < 0.1) {
          ecgSample = height / 2 - Math.sin(normCycle * Math.PI * 10) * 8; // P wave
        } else if (normCycle >= 0.15 && normCycle < 0.22) {
          // Sharp R spike
          const rProg = (normCycle - 0.15) / 0.07;
          ecgSample = height / 2 - Math.sin(rProg * Math.PI) * 45;
        } else if (normCycle >= 0.22 && normCycle < 0.55) {
          // Severe elevated ST-segment & T-wave
          const stProg = (normCycle - 0.22) / 0.33;
          ecgSample = height / 2 - Math.sin(stProg * Math.PI) * 32 - 14;
        } else {
          ecgSample = height / 2 + (Math.random() - 0.5) * 1.5;
        }
      } else {
        // Normal Sinus Rhythm (P - Q - R - S - T)
        if (normCycle >= 0.08 && normCycle < 0.18) {
          // P wave
          const p = (normCycle - 0.08) / 0.10;
          ecgSample = height / 2 - Math.sin(p * Math.PI) * 10;
        } else if (normCycle >= 0.23 && normCycle < 0.25) {
          // Q dip
          ecgSample = height / 2 + 8;
        } else if (normCycle >= 0.25 && normCycle < 0.30) {
          // High R spike
          const r = (normCycle - 0.25) / 0.05;
          ecgSample = height / 2 - Math.sin(r * Math.PI) * 52;
        } else if (normCycle >= 0.30 && normCycle < 0.33) {
          // S dip
          ecgSample = height / 2 + 14;
        } else if (normCycle >= 0.42 && normCycle < 0.65) {
          // T wave
          const tw = (normCycle - 0.42) / 0.23;
          ecgSample = height / 2 - Math.sin(tw * Math.PI) * 16;
        } else {
          ecgSample = height / 2 + (Math.random() - 0.5) * 1.5;
        }
      }

      // 2. Plethysmography (PPG) Pulse Wave Synthesis
      if (vitals.ecgRhythm === 'asystole' || vitals.ecgRhythm === 'ventricular_fibrillation') {
        ppgSample = ppgHeight / 2 + (Math.random() - 0.5) * 2;
      } else {
        const ppgPhase = (normCycle + 0.15) % 1.0;
        if (ppgPhase < 0.35) {
          ppgSample = ppgHeight / 2 - Math.sin((ppgPhase / 0.35) * Math.PI) * (ppgHeight * 0.38);
        } else if (ppgPhase >= 0.35 && ppgPhase < 0.55) {
          // Dicrotic notch reflection
          const dnotch = (ppgPhase - 0.35) / 0.20;
          ppgSample = ppgHeight / 2 - Math.sin(dnotch * Math.PI) * (ppgHeight * 0.12);
        } else {
          ppgSample = ppgHeight / 2;
        }
      }

      // Shift buffers
      ecgData.shift();
      ecgData.push(ecgSample);

      ppgData.shift();
      ppgData.push(ppgSample);

      // Draw ECG Canvas
      ecgCtx.fillStyle = '#080c16';
      ecgCtx.fillRect(0, 0, width, height);

      // Grid lines (clinical monitor grid)
      ecgCtx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
      ecgCtx.lineWidth = 1;
      for (let x = 0; x < width; x += 25) {
        ecgCtx.beginPath();
        ecgCtx.moveTo(x, 0);
        ecgCtx.lineTo(x, height);
        ecgCtx.stroke();
      }
      for (let y = 0; y < height; y += 25) {
        ecgCtx.beginPath();
        ecgCtx.moveTo(0, y);
        ecgCtx.lineTo(width, y);
        ecgCtx.stroke();
      }

      // Draw ECG Waveform
      const isLethal = vitals.ecgRhythm === 'ventricular_fibrillation' || vitals.ecgRhythm === 'asystole';
      const isStemi = vitals.ecgRhythm === 'stemi_elevation';
      ecgCtx.strokeStyle = isLethal ? '#ef4444' : isStemi ? '#f59e0b' : '#10b981';
      ecgCtx.lineWidth = 2.2;
      ecgCtx.shadowColor = isLethal ? 'rgba(239, 68, 68, 0.6)' : isStemi ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)';
      ecgCtx.shadowBlur = 8;

      ecgCtx.beginPath();
      for (let x = 0; x < width; x++) {
        const y = ecgData[x];
        if (x === 0) ecgCtx.moveTo(x, y);
        else ecgCtx.lineTo(x, y);
      }
      ecgCtx.stroke();
      ecgCtx.shadowBlur = 0;

      // Draw PPG Canvas
      ppgCtx.fillStyle = '#080c16';
      ppgCtx.fillRect(0, 0, width, ppgHeight);

      ppgCtx.strokeStyle = 'rgba(6, 182, 212, 0.9)';
      ppgCtx.lineWidth = 2.0;
      ppgCtx.shadowColor = 'rgba(6, 182, 212, 0.5)';
      ppgCtx.shadowBlur = 6;

      ppgCtx.beginPath();
      for (let x = 0; x < width; x++) {
        const y = ppgData[x];
        if (x === 0) ppgCtx.moveTo(x, y);
        else ppgCtx.lineTo(x, y);
      }
      ppgCtx.stroke();
      ppgCtx.shadowBlur = 0;

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [vitals.heartRateBpm, vitals.ecgRhythm]);

  const isLethal = vitals.ecgRhythm === 'ventricular_fibrillation' || vitals.ecgRhythm === 'asystole';
  const isStemi = vitals.ecgRhythm === 'stemi_elevation';

  return (
    <div className={`clinical-card rounded-xl p-5 border transition-all duration-300 ${
      isLethal ? 'border-red-500/70 clinical-glow-rose' : isStemi ? 'border-amber-500/60 clinical-glow-amber' : 'border-slate-800'
    }`}>
      {/* Header telemetry status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isLethal ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
              Multimodal Biosignal Telemetry
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Source: <span className="text-cyan-400">{vitals.wearableSource}</span> • High-Freq Stream (250 Hz)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-2.5 py-1 rounded text-xs font-mono font-medium ${
            isLethal ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse' :
            isStemi ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {vitals.ecgRhythm.replace('_', ' ').toUpperCase()}
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
      </div>

      {/* Numerical Vital Gauges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {/* Heart Rate */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-400" /> HR</span>
            <span className="font-mono text-[10px] text-slate-500">BPM</span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-100 flex items-baseline gap-1">
            <span className={vitals.heartRateBpm > 120 || vitals.heartRateBpm < 50 ? 'text-rose-400 animate-pulse' : 'text-slate-100'}>
              {vitals.heartRateBpm}
            </span>
            <span className="text-xs font-normal text-slate-500">bpm</span>
          </div>
        </div>

        {/* Blood Pressure */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-cyan-400" /> NIBP</span>
            <span className="font-mono text-[10px] text-slate-500">mmHg</span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-100">
            <span className={vitals.systolicBp < 80 || vitals.systolicBp > 180 ? 'text-amber-400' : 'text-slate-100'}>
              {vitals.systolicBp}/{vitals.diastolicBp}
            </span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-cyan-400" /> SpO2</span>
            <span className="font-mono text-[10px] text-slate-500">%</span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-100">
            <span className={vitals.spO2Percent < 90 ? 'text-rose-400 animate-pulse' : vitals.spO2Percent < 94 ? 'text-amber-400' : 'text-cyan-400'}>
              {vitals.spO2Percent}%
            </span>
          </div>
        </div>

        {/* HRV RMSSD */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>HRV RMSSD</span>
            <span className="font-mono text-[10px] text-slate-500">ms</span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-100">
            {vitals.hrvRmssdMs} <span className="text-xs font-normal text-slate-500">ms</span>
          </div>
        </div>

        {/* Deceleration Impact G */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> IMPACT</span>
            <span className="font-mono text-[10px] text-slate-500">G</span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight">
            <span className={vitals.impactDecelerationG > 4.0 ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-100'}>
              {vitals.impactDecelerationG.toFixed(1)}G
            </span>
          </div>
        </div>
      </div>

      {/* Waveform Canvases */}
      <div className="space-y-3">
        {/* ECG Lead II */}
        <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#080c16]">
          <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400/90">ECG LEAD II</span>
            <span className="text-[10px] font-mono text-slate-500">25mm/s • 10mm/mV</span>
          </div>
          <canvas
            ref={ecgCanvasRef}
            width={720}
            height={130}
            className="w-full h-[120px] block"
          />
        </div>

        {/* Plethysmogram (PPG) */}
        <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#080c16]">
          <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-400/90">PLETH (PPG)</span>
            <span className="text-[10px] font-mono text-slate-500">Peripheral Pulse Waveform</span>
          </div>
          <canvas
            ref={ppgCanvasRef}
            width={720}
            height={70}
            className="w-full h-[65px] block"
          />
        </div>
      </div>
    </div>
  );
};
