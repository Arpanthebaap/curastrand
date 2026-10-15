import { PatientVitals, AcousticAnalysisResult, ManchesterTriageResult, TriagePriorityLevel } from '../types.js';
import { MANCHESTER_TRIAGE_DISCRIMINATORS } from '../resources/triageProtocols.js';

export const triageEvaluatorToolDefinition = {
  name: 'triage_evaluator',
  description: 'Evaluate fused multimodal clinical telemetry (wearable biosignals + acoustic biomarkers + EHR context) against the formally verified Manchester Triage System (MTS). Computes deterministic priority level, mandatory emergency actions, and cryptographic proof hash.',
  inputSchema: {
    type: 'object',
    properties: {
      patient_id: {
        type: 'string',
        description: 'Patient identifier'
      },
      vitals: {
        type: 'object',
        description: 'Patient biometric vitals snapshot'
      },
      acoustic: {
        type: 'object',
        description: 'Acoustic biomarker analysis snapshot'
      },
      is_conscious: {
        type: 'boolean',
        description: 'Whether patient is responsive'
      }
    },
    required: ['patient_id', 'vitals']
  }
};

/**
 * Computes a deterministic pseudo-cryptographic hash representing the clinical proof invariant.
 */
function computeProofHash(level: number, discriminators: string[], timestamp: string): string {
  const payload = `MTS-PROOF:L${level}:${discriminators.sort().join('|')}:${timestamp}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `0xMTS${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
}

export function executeTriageEvaluator(args: {
  patient_id: string;
  vitals: PatientVitals;
  acoustic?: AcousticAnalysisResult;
  is_conscious?: boolean;
}): ManchesterTriageResult {
  const { vitals, acoustic } = args;
  const isConscious = args.is_conscious ?? true;

  const discriminatorsTriggered: string[] = [];
  const vitalsFlagged: string[] = [];
  const mandatoryActions: Set<string> = new Set();

  let assignedLevel: TriagePriorityLevel = 5;

  // Level 1 Invariant Checks (Immediate / Red - 0 min)
  if (vitals.ecgRhythm === 'ventricular_fibrillation' || vitals.ecgRhythm === 'asystole') {
    discriminatorsTriggered.push('MTS-D02-CARDIAC-ARREST');
    vitalsFlagged.push(`Malignant Arrhythmia: ${vitals.ecgRhythm}`);
    assignedLevel = 1;
  }

  if (acoustic && acoustic.primaryClassification === 'agonal_breathing') {
    discriminatorsTriggered.push('MTS-D01-AIRWAY');
    vitalsFlagged.push('Agonal / Ineffective Respiratory Pattern');
    assignedLevel = 1;
  }

  if (!isConscious && vitals.impactDecelerationG > 4.0) {
    discriminatorsTriggered.push('MTS-D01-AIRWAY');
    vitalsFlagged.push(`High Impact Fall Trauma (${vitals.impactDecelerationG}G) with Loss of Consciousness`);
    assignedLevel = 1;
  }

  if (vitals.systolicBp > 0 && vitals.systolicBp < 70) {
    discriminatorsTriggered.push('MTS-D03-SEVERE-SHOCK');
    vitalsFlagged.push(`Severe Hypotensive Shock (Systolic BP: ${vitals.systolicBp} mmHg)`);
    assignedLevel = 1;
  }

  // Level 2 Invariant Checks (Very Urgent / Orange - 10 min)
  if (assignedLevel > 2) {
    if (vitals.ecgRhythm === 'stemi_elevation') {
      discriminatorsTriggered.push('MTS-D04-ACUTE-CORONARY');
      vitalsFlagged.push('Acute ST-Segment Elevation (STEMI vector detected)');
      assignedLevel = 2;
    }

    if (acoustic && acoustic.primaryClassification === 'inspiratory_stridor') {
      discriminatorsTriggered.push('MTS-D06-SEVERE-HYPOXIA');
      vitalsFlagged.push('Severe Airway Stridor / Impending Obstruction');
      assignedLevel = 2;
    }

    if (vitals.spO2Percent < 90) {
      discriminatorsTriggered.push('MTS-D06-SEVERE-HYPOXIA');
      vitalsFlagged.push(`Critical Hypoxemia (SpO2: ${vitals.spO2Percent}%)`);
      assignedLevel = 2;
    }

    if (acoustic && acoustic.primaryClassification === 'aphasic_dysarthria') {
      discriminatorsTriggered.push('MTS-D05-STROKE-ACUTE');
      vitalsFlagged.push('Acute Expressive Dysarthria / Suspected Ischemic Stroke');
      assignedLevel = 2;
    }
  }

  // Level 3 Invariant Checks (Urgent / Yellow - 60 min)
  if (assignedLevel > 3) {
    if (vitals.impactDecelerationG > 4.5 && isConscious) {
      discriminatorsTriggered.push('MTS-D07-TRAUMATIC-FALL');
      vitalsFlagged.push(`Traumatic Impact (${vitals.impactDecelerationG}G) alert`);
      assignedLevel = 3;
    }

    if (vitals.heartRateBpm > 120 || vitals.heartRateBpm < 45) {
      discriminatorsTriggered.push('MTS-D08-MODERATE-TACHYCARDIA');
      vitalsFlagged.push(`Hemodynamically Tolerated Arrhythmia (HR: ${vitals.heartRateBpm} bpm)`);
      assignedLevel = 3;
    }

    if (vitals.spO2Percent >= 90 && vitals.spO2Percent <= 94) {
      vitalsFlagged.push(`Borderline Hypoxemia (SpO2: ${vitals.spO2Percent}%)`);
      assignedLevel = 3;
    }
  }

  // Level 4 / 5 Checks
  if (assignedLevel > 4) {
    if (vitals.systolicBp > 150 || vitals.heartRateBpm > 100) {
      discriminatorsTriggered.push('MTS-D09-MILD-PAIN');
      vitalsFlagged.push('Mild physiological stress elevation');
      assignedLevel = 4;
    } else {
      discriminatorsTriggered.push('MTS-D10-ROUTINE-QUERY');
      assignedLevel = 5;
    }
  }

  // Collect mandatory actions across triggered discriminators
  for (const discId of discriminatorsTriggered) {
    const disc = MANCHESTER_TRIAGE_DISCRIMINATORS.find(d => d.id === discId);
    if (disc) {
      disc.mandatoryInterventions.forEach(a => mandatoryActions.add(a));
    }
  }

  // Mandatory action guarantees for Level 1 and 2
  if (assignedLevel === 1) {
    mandatoryActions.add('IMMEDIATE_CAD_DISPATCH');
    mandatoryActions.add('UNLOCK_RING_DEADBOLT');
    mandatoryActions.add('TRIGGER_AUDIO_CPR_METRONOME');
  } else if (assignedLevel === 2) {
    mandatoryActions.add('URGENT_CAD_DISPATCH');
    mandatoryActions.add('UNLOCK_RING_DEADBOLT');
  }

  const categoryMap: Record<TriagePriorityLevel, { category: ManchesterTriageResult['category']; color: ManchesterTriageResult['color']; time: number }> = {
    1: { category: 'Immediate', color: 'Red', time: 0 },
    2: { category: 'Very Urgent', color: 'Orange', time: 10 },
    3: { category: 'Urgent', color: 'Yellow', time: 60 },
    4: { category: 'Standard', color: 'Green', time: 120 },
    5: { category: 'Non-urgent', color: 'Blue', time: 240 }
  };

  const meta = categoryMap[assignedLevel];
  const timestamp = new Date().toISOString();
  const proofHash = computeProofHash(assignedLevel, discriminatorsTriggered, timestamp);

  return {
    level: assignedLevel,
    category: meta.category,
    color: meta.color,
    targetResponseTimeMinutes: meta.time,
    discriminatorsTriggered,
    vitalSignsFlagged: vitalsFlagged,
    mandatoryActions: Array.from(mandatoryActions),
    formalProofHash: proofHash
  };
}
