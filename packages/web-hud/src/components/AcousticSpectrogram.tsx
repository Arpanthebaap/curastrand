import React from 'react';
import { AcousticData } from '../types';
import { Mic, Globe, AlertTriangle } from 'lucide-react';

interface Props {
  acoustic: AcousticData;
}

export const AcousticSpectrogram: React.FC<Props> = ({ acoustic }) => {
  const isUrgent = acoustic.urgencyScore > 0.8;
  const isStridor = acoustic.primaryClassification === 'inspiratory_stridor';
  const isAgonal = acoustic.primaryClassification === 'agonal_breathing';
  const isDysarthria = acoustic.primaryClassification === 'aphasic_dysarthria';

  // Generate simulated dynamic spectrogram bars based on classification
  const barCount = 28;
  const bars = Array.from({ length: barCount }, (_, i) => {
    let height = 20;
    if (isAgonal) {
      // Periodic low-frequency agonal gasps
      height = (Math.sin(i * 0.4) * 0.5 + 0.5) * 85 + Math.random() * 15;
    } else if (isStridor) {
      // High frequency pitch concentration
      height = i > 16 ? Math.random() * 80 + 20 : Math.random() * 30 + 10;
    } else if (isDysarthria) {
      // Irregular, broken cadence
      height = (i % 3 === 0) ? Math.random() * 60 + 20 : Math.random() * 20 + 5;
    } else {
      // Normal speech distribution
      height = Math.sin((i / barCount) * Math.PI) * 55 + Math.random() * 15;
    }
    return Math.max(8, Math.min(100, height));
  });

  return (
    <div className={`clinical-card rounded-xl p-5 border transition-all duration-300 ${
      isUrgent ? 'border-amber-500/60 clinical-glow-amber' : 'border-slate-800'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isUrgent ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
              Acoustic Biomarker Spectrogram
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Ambient Node: <span className="text-cyan-400">Alexa Echo Mic Array (Far-Field)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium bg-slate-900 border border-slate-700 text-slate-300">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            {acoustic.detectedLanguageOrDialect}
          </span>
        </div>
      </div>

      {/* Acoustic Pattern Status Badge */}
      <div className="mb-4 bg-slate-900/90 rounded-lg p-3 border border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
            Acoustic Phonetic Pattern
          </div>
          <div className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span className={`capitalize ${
              isAgonal || isStridor ? 'text-rose-400 animate-pulse' :
              isDysarthria ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {acoustic.primaryClassification.replace('_', ' ')}
            </span>
            {isUrgent && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
            Speech Intelligibility
          </div>
          <div className="text-base font-mono font-bold text-slate-200">
            {(acoustic.speechIntelligibilityIndex * 100).toFixed(0)}% <span className="text-xs text-slate-500">(SII)</span>
          </div>
        </div>
      </div>

      {/* Visual Audio Equalizer / Spectrogram Bars */}
      <div className="bg-[#080c16] rounded-lg p-3 border border-slate-800 mb-4">
        <div className="flex items-end justify-between h-20 gap-1 px-1">
          {bars.map((height, idx) => (
            <div
              key={idx}
              className={`flex-1 rounded-t transition-all duration-150 ${
                isAgonal || isStridor ? 'bg-gradient-to-t from-red-600 to-rose-400' :
                isDysarthria ? 'bg-gradient-to-t from-amber-600 to-amber-400' :
                'bg-gradient-to-t from-cyan-600 to-cyan-400'
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2 px-1">
          <span>100 Hz (Infraglottic)</span>
          <span>1 kHz (Formants)</span>
          <span>4 kHz (High Stridor)</span>
          <span>8 kHz</span>
        </div>
      </div>

      {/* Live Detected Utterance / Phoneme Transcript */}
      <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800 text-xs">
        <span className="text-slate-500 font-mono block mb-1">ACOUSTIC TRANSCRIBE & PHONETIC BUFFER:</span>
        <p className="font-mono text-slate-200 italic">
          "{acoustic.transcriptionOrAcousticPhonemes || 'Ambient monitoring active. No anomalous distress vocalization detected.'}"
        </p>
      </div>
    </div>
  );
};
