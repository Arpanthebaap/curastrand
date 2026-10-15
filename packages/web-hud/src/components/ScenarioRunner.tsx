import React from 'react';
import { Play, RotateCcw, AlertTriangle, Activity, User, ShieldCheck } from 'lucide-react';

interface Props {
  activeScenario: string;
  onSelectScenario: (scenarioId: string) => void;
  isLoading: boolean;
}

export const ScenarioRunner: React.FC<Props> = ({ activeScenario, onSelectScenario, isLoading }) => {
  const scenarios = [
    {
      id: 'stemi_arrest',
      title: 'Scenario 1: STEMI & Ventricular Fibrillation',
      patient: 'Robert Sterling (69M)',
      badge: 'Level 1: Immediate Red',
      badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
      description: 'Acute pulseless collapse, agonal respirations, VFib ECG rhythm. Triggers emergency Ring unlock & CPR metronome.',
      icon: Activity
    },
    {
      id: 'geriatric_fall',
      title: 'Scenario 2: Fall Trauma & Acute Subdural Hematoma',
      patient: 'Elena Rostova (78F)',
      badge: 'Level 2: Very Urgent Orange',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: '5.8G mechanical impact deceleration on Eliquis blood thinner with speech dysarthria.',
      icon: AlertTriangle
    },
    {
      id: 'pediatric_anaphylaxis',
      title: 'Scenario 3: Severe Stridor & Pediatric Anaphylaxis',
      patient: 'Maya Patel (7F)',
      badge: 'Level 2: Very Urgent Orange',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'IgE peanut exposure, biphasic laryngeal stridor, SpO2 84%. Urgent CAD epinephrine dispatch.',
      icon: ShieldCheck
    },
    {
      id: 'multilingual_stroke',
      title: 'Scenario 4: Cross-Cultural Multilingual Stroke',
      patient: 'Minh Nguyen (64M)',
      badge: 'Level 2: Very Urgent Orange',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Vietnamese distress phonemes ("mất cảm giác tay chân") accurately triaged without non-English disparity.',
      icon: User
    }
  ];

  return (
    <div className="clinical-card rounded-xl p-5 border border-slate-800">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
            Interactive Clinical Benchmarks (1-Click Evaluation)
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Standardized simulated patient cohorts for instant peer-reviewed reproducibility
          </p>
        </div>

        <button
          onClick={() => onSelectScenario('baseline')}
          disabled={isLoading}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Reset to Baseline
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarios.map(sc => {
          const Icon = sc.icon;
          const isActive = activeScenario === sc.id;

          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              disabled={isLoading}
              className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-800/90 border-cyan-500/80 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-900/60 hover:bg-slate-800/50 border-slate-800'
              } disabled:opacity-60`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${sc.badgeClass}`}>
                    {sc.badge}
                  </span>
                  <div className={`p-1.5 rounded-md ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="font-semibold text-slate-100 text-xs mb-1">
                  {sc.title}
                </div>
                <div className="text-[11px] font-mono text-cyan-400 mb-2">
                  Patient: {sc.patient}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {sc.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className={isActive ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                  {isActive ? '● ACTIVE BENCHMARK' : 'Click to load'}
                </span>
                <Play className={`w-3 h-3 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
