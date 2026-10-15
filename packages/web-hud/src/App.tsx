import React, { useState, useEffect } from 'react';
import { PatientVitals, AcousticData, TriageResult, RingState } from './types';
import { VitalsWaveformCanvas } from './components/VitalsWaveformCanvas';
import { AcousticSpectrogram } from './components/AcousticSpectrogram';
import { AlexaAgentConsole } from './components/AlexaAgentConsole';
import { RingPerimeterHUD } from './components/RingPerimeterHUD';
import { SafetyProofLedger } from './components/SafetyProofLedger';
import { ScenarioRunner } from './components/ScenarioRunner';
import { CPRMetronomeModal } from './components/CPRMetronomeModal';
import { Activity, ShieldCheck, Cpu, Siren, Code2 } from 'lucide-react';

export const App: React.FC = () => {
  const [patientId, setPatientId] = useState('PT-1001');
  const [activeScenario, setActiveScenario] = useState('baseline');
  const [isLoading, setIsLoading] = useState(false);
  const [isCprModalOpen, setIsCprModalOpen] = useState(false);

  // Core Clinical State
  const [vitals, setVitals] = useState<PatientVitals>({
    patientId: 'PT-1001',
    timestamp: new Date().toISOString(),
    heartRateBpm: 72,
    systolicBp: 128,
    diastolicBp: 82,
    spO2Percent: 98,
    respiratoryRate: 16,
    hrvRmssdMs: 42,
    ecgRhythm: 'sinus_rhythm',
    impactDecelerationG: 0.98,
    wearableSource: 'bee_wearable'
  });

  const [acoustic, setAcoustic] = useState<AcousticData>({
    audioStreamId: 'stream-PT-1001',
    timestamp: new Date().toISOString(),
    primaryClassification: 'normal_speech',
    confidence: 0.95,
    splDecibels: 56,
    speechIntelligibilityIndex: 0.96,
    detectedLanguageOrDialect: 'en-US',
    transcriptionOrAcousticPhonemes: 'Ambient vital monitoring active. No anomalous distress vocalization.',
    urgencyScore: 0.1
  });

  const [triage, setTriage] = useState<TriageResult>({
    level: 5,
    category: 'Non-urgent',
    color: 'Blue',
    targetResponseTimeMinutes: 240,
    discriminatorsTriggered: ['MTS-D10-ROUTINE-QUERY'],
    vitalSignsFlagged: [],
    mandatoryActions: [],
    formalProofHash: '0xMTSB821A40'
  });

  const [ringState, setRingState] = useState<RingState>({
    deviceId: 'RING-PRO-FRONT-ENTRY-01',
    frontDoorLocked: true,
    emergencyStrobeActive: false,
    sirenActive: false,
    porchCameraStreaming: true,
    responderAccessGranted: false,
    temporaryAccessPin: '7429',
    lastEventDescription: 'Perimeter secure. Smart deadbolt engaged.'
  });

  const [lastAssessment, setLastAssessment] = useState<any>(null);
  const [lastDispatch, setLastDispatch] = useState<any>(null);

  // Poll server or connect to MCP SSE
  useEffect(() => {
    let sse: EventSource | null = null;
    try {
      sse = new EventSource('/mcp/sse');
      sse.addEventListener('tool_executed', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.tool === 'perimeter_controller') {
            setRingState(data.result);
          } else if (data.tool === 'vitals_monitor') {
            setVitals(data.result);
          }
        } catch {}
      });
    } catch {}

    return () => {
      if (sse) sse.close();
    };
  }, []);

  // Handle Scenario Switch
  const handleSelectScenario = async (scenarioId: string) => {
    setIsLoading(true);
    setActiveScenario(scenarioId);

    try {
      // 1. Load scenario onto MCP server
      await fetch('/api/mcp/api/scenario/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      }).catch(() => {
        // Fallback for direct testing
      });

      // Update local state based on scenario
      let targetPt = 'PT-1001';
      let acousticHint = '';

      if (scenarioId === 'stemi_arrest') {
        targetPt = 'PT-1001';
        acousticHint = 'gasping... chest crushing pain... can\'t breathe...';
        setVitals({
          patientId: targetPt,
          timestamp: new Date().toISOString(),
          heartRateBpm: 198,
          systolicBp: 58,
          diastolicBp: 34,
          spO2Percent: 82,
          respiratoryRate: 6,
          hrvRmssdMs: 8,
          ecgRhythm: 'ventricular_fibrillation',
          impactDecelerationG: 1.2,
          wearableSource: 'bee_wearable'
        });
        setAcoustic({
          audioStreamId: `stream-${targetPt}`,
          timestamp: new Date().toISOString(),
          primaryClassification: 'agonal_breathing',
          confidence: 0.98,
          splDecibels: 76,
          speechIntelligibilityIndex: 0.22,
          detectedLanguageOrDialect: 'en-US',
          transcriptionOrAcousticPhonemes: '[Agonal Respiratory Ineffective Gasps Detected]',
          urgencyScore: 0.99
        });
      } else if (scenarioId === 'geriatric_fall') {
        targetPt = 'PT-1002';
        acousticHint = 'I fell... hit my head on the table... my arm is weak...';
        setVitals({
          patientId: targetPt,
          timestamp: new Date().toISOString(),
          heartRateBpm: 118,
          systolicBp: 188,
          diastolicBp: 104,
          spO2Percent: 93,
          respiratoryRate: 24,
          hrvRmssdMs: 14,
          ecgRhythm: 'atrial_fibrillation',
          impactDecelerationG: 5.8,
          wearableSource: 'apple_watch'
        });
        setAcoustic({
          audioStreamId: `stream-${targetPt}`,
          timestamp: new Date().toISOString(),
          primaryClassification: 'aphasic_dysarthria',
          confidence: 0.92,
          splDecibels: 54,
          speechIntelligibilityIndex: 0.38,
          detectedLanguageOrDialect: 'en-US',
          transcriptionOrAcousticPhonemes: 'I fell... hit my head on table... arm weak...',
          urgencyScore: 0.90
        });
      } else if (scenarioId === 'pediatric_anaphylaxis') {
        targetPt = 'PT-1004';
        acousticHint = 'wheezing tight throat can\'t breathe peanut';
        setVitals({
          patientId: targetPt,
          timestamp: new Date().toISOString(),
          heartRateBpm: 162,
          systolicBp: 80,
          diastolicBp: 48,
          spO2Percent: 84,
          respiratoryRate: 38,
          hrvRmssdMs: 12,
          ecgRhythm: 'sinus_tachycardia',
          impactDecelerationG: 1.0,
          wearableSource: 'ambient_biosensor'
        });
        setAcoustic({
          audioStreamId: `stream-${targetPt}`,
          timestamp: new Date().toISOString(),
          primaryClassification: 'inspiratory_stridor',
          confidence: 0.94,
          splDecibels: 68,
          speechIntelligibilityIndex: 0.48,
          detectedLanguageOrDialect: 'en-US',
          transcriptionOrAcousticPhonemes: '[Biphasic Inspiratory Stridor & Bronchospasm]',
          urgencyScore: 0.93
        });
      } else if (scenarioId === 'multilingual_stroke') {
        targetPt = 'PT-1003';
        acousticHint = 'mất cảm giác tay chân, nói ngọng...';
        setVitals({
          patientId: targetPt,
          timestamp: new Date().toISOString(),
          heartRateBpm: 92,
          systolicBp: 204,
          diastolicBp: 116,
          spO2Percent: 95,
          respiratoryRate: 18,
          hrvRmssdMs: 22,
          ecgRhythm: 'sinus_rhythm',
          impactDecelerationG: 1.1,
          wearableSource: 'bee_wearable'
        });
        setAcoustic({
          audioStreamId: `stream-${targetPt}`,
          timestamp: new Date().toISOString(),
          primaryClassification: 'aphasic_dysarthria',
          confidence: 0.91,
          splDecibels: 52,
          speechIntelligibilityIndex: 0.40,
          detectedLanguageOrDialect: 'vi-VN',
          transcriptionOrAcousticPhonemes: 'mất cảm giác tay chân, nói ngọng... (Numb limbs, slurred speech)',
          urgencyScore: 0.91
        });
      } else {
        targetPt = 'PT-1001';
        setVitals({
          patientId: targetPt,
          timestamp: new Date().toISOString(),
          heartRateBpm: 72,
          systolicBp: 128,
          diastolicBp: 82,
          spO2Percent: 98,
          respiratoryRate: 16,
          hrvRmssdMs: 42,
          ecgRhythm: 'sinus_rhythm',
          impactDecelerationG: 0.98,
          wearableSource: 'bee_wearable'
        });
        setAcoustic({
          audioStreamId: `stream-${targetPt}`,
          timestamp: new Date().toISOString(),
          primaryClassification: 'normal_speech',
          confidence: 0.96,
          splDecibels: 56,
          speechIntelligibilityIndex: 0.98,
          detectedLanguageOrDialect: 'en-US',
          transcriptionOrAcousticPhonemes: 'Ambient vital monitoring active.',
          urgencyScore: 0.1
        });
        setTriage({
          level: 5,
          category: 'Non-urgent',
          color: 'Blue',
          targetResponseTimeMinutes: 240,
          discriminatorsTriggered: ['MTS-D10-ROUTINE-QUERY'],
          vitalSignsFlagged: [],
          mandatoryActions: [],
          formalProofHash: '0xMTSB821A40'
        });
        setRingState({
          deviceId: 'RING-PRO-FRONT-ENTRY-01',
          frontDoorLocked: true,
          emergencyStrobeActive: false,
          sirenActive: false,
          porchCameraStreaming: true,
          responderAccessGranted: false,
          temporaryAccessPin: '7429',
          lastEventDescription: 'Perimeter secure. Smart deadbolt engaged.'
        });
        setIsCprModalOpen(false);
      }

      setPatientId(targetPt);

      // 2. Trigger Autonomous Triage Cycle
      if (scenarioId !== 'baseline') {
        const cycleRes = await fetch('/api/triage/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: targetPt, acousticHint })
        });

        if (cycleRes.ok) {
          const data = await cycleRes.json();
          setTriage(data.assessment.triageEvaluation);
          setLastAssessment(data.assessment);
          setLastDispatch(data.dispatchReport);

          if (data.dispatchReport?.ringDoorUnlocked) {
            setRingState(prev => ({
              ...prev,
              frontDoorLocked: false,
              responderAccessGranted: true,
              emergencyStrobeActive: true,
              lastEventDescription: 'Emergency Deadbolt Override: Door Unlocked for First Responders.'
            }));
          }

          if (scenarioId === 'stemi_arrest') {
            setIsCprModalOpen(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to run scenario:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle User Alexa Query
  const handleSendQuery = async (query: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/alexa/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, patientId })
      });

      if (res.ok) {
        const data = await res.json();
        setTriage(data.assessment.triageEvaluation);
        setLastAssessment(data.assessment);
        setLastDispatch(data.dispatch);

        if (data.dispatch?.ringDoorUnlocked) {
          setRingState(prev => ({
            ...prev,
            frontDoorLocked: false,
            responderAccessGranted: true,
            emergencyStrobeActive: true,
            lastEventDescription: 'Emergency Deadbolt Override: Door Unlocked for First Responders.'
          }));
        }

        if (data.triageLevel === 1) {
          setIsCprModalOpen(true);
        }

        return data;
      }
    } catch (err) {
      console.error('Failed to query Alexa:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRingLock = () => {
    setRingState(prev => ({
      ...prev,
      frontDoorLocked: !prev.frontDoorLocked,
      lastEventDescription: !prev.frontDoorLocked ? 'Deadbolt engaged manually.' : 'Deadbolt unlocked manually.'
    }));
  };

  return (
    <div className="min-h-screen bg-[#080c16] text-slate-100 p-4 md:p-6 font-sans">
      {/* Top Banner & Header */}
      <header className="clinical-card rounded-2xl p-4 md:p-5 border border-slate-800 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-900/40">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                CuraStrand
                <span className="text-cyan-400 font-mono text-sm font-normal">v1.0.0</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Alexa+ MCP Spec 2025-11-25
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Autonomous Multimodal Clinical Triage & Ambient Crisis Orchestration Framework
            </p>
          </div>
        </div>

        {/* Engine and Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Cognitive Core:</span>
            <span className="text-purple-300 font-semibold">AWS Bedrock + Strands</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Triage Standard:</span>
            <span className="text-emerald-300 font-semibold">Manchester MTS Level 1-5</span>
          </div>

          <a
            href="https://github.com/Arpanthebaap/curastrand"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 transition-colors"
          >
            <Code2 className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      {/* 1-Click Interactive Clinical Benchmark Scenarios */}
      <section className="mb-6">
        <ScenarioRunner
          activeScenario={activeScenario}
          onSelectScenario={handleSelectScenario}
          isLoading={isLoading}
        />
      </section>

      {/* Main Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multimodal Biosignal Telemetry & Acoustic Spectrogram */}
        <div className="lg:col-span-4 space-y-6">
          <VitalsWaveformCanvas vitals={vitals} />
          <AcousticSpectrogram acoustic={acoustic} />
        </div>

        {/* Middle Column: Alexa+ Agent Console & Formal Safety Ledger */}
        <div className="lg:col-span-5 space-y-6">
          <AlexaAgentConsole
            onSendQuery={handleSendQuery}
            isLoading={isLoading}
            lastAssessment={lastAssessment}
            lastDispatch={lastDispatch}
          />
          <SafetyProofLedger triage={triage} assessment={lastAssessment} />
        </div>

        {/* Right Column: Ring Smart Perimeter HUD & Access Dispatch */}
        <div className="lg:col-span-3 space-y-6">
          <RingPerimeterHUD ringState={ringState} onToggleLock={handleToggleRingLock} />

          {/* Active E911 CAD Dispatch Widget */}
          <div className="clinical-card rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <span className="text-xs font-semibold uppercase text-slate-300 flex items-center gap-1.5">
                <Siren className="w-4 h-4 text-rose-400" /> E911 CAD Dispatch
              </span>
              <span className="text-[10px] font-mono text-slate-500">NG911 FHIR</span>
            </div>

            {lastDispatch ? (
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Incident ID:</span>
                  <span className="text-cyan-300 font-bold">{lastDispatch.cadIncidentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-bold">EN ROUTE (ETA 4 min)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Door Passcode:</span>
                  <span className="text-amber-400 font-bold">#7429#</span>
                </div>
                <div className="bg-slate-900 p-2 rounded text-[11px] text-slate-300 mt-2">
                  {lastDispatch.summary}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-mono py-6 text-center">
                CAD dispatch in standby mode. Transmits automatically upon Level 1 or 2 threshold breach.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CPR Metronome Modal */}
      <CPRMetronomeModal
        isOpen={isCprModalOpen}
        onClose={() => setIsCprModalOpen(false)}
        targetBpm={110}
      />
    </div>
  );
};

export default App;
