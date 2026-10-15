/**
 * CuraStrand Manchester Triage System (MTS) Formal Specifications
 * Standard clinical flow charts and discriminator hierarchy.
 */

export interface TriageDiscriminator {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
  description: string;
  mandatoryInterventions: string[];
}

export const MANCHESTER_TRIAGE_DISCRIMINATORS: TriageDiscriminator[] = [
  // Priority 1 - Immediate (Red) - Target Time: 0 minutes
  {
    id: 'MTS-D01-AIRWAY',
    name: 'Airway Compromise / Agonal Respiration',
    level: 1,
    description: 'Threat to airway, complete obstruction, stridor with exhaustion, or agonal breathing gasps.',
    mandatoryInterventions: ['IMMEDIATE_CAD_DISPATCH', 'UNLOCK_RING_DEADBOLT', 'TRIGGER_AUDIO_CPR_METRONOME', 'NOTIFY_EMS_AIRWAY_CODE']
  },
  {
    id: 'MTS-D02-CARDIAC-ARREST',
    name: 'Ventricular Fibrillation / Pulseless Arrest',
    level: 1,
    description: 'Sudden loss of pulse, ventricular fibrillation rhythm, or asystole with unresponsiveness.',
    mandatoryInterventions: ['IMMEDIATE_CAD_DISPATCH', 'UNLOCK_RING_DEADBOLT', 'TRIGGER_AUDIO_CPR_METRONOME', 'ALERT_NEIGHBORHOOD_AED']
  },
  {
    id: 'MTS-D03-SEVERE-SHOCK',
    name: 'Profound Hypoperfusion / Shock State',
    level: 1,
    description: 'Systolic BP < 70 mmHg (adult) or extreme tachycardia > 160 with severe altered mental status.',
    mandatoryInterventions: ['IMMEDIATE_CAD_DISPATCH', 'UNLOCK_RING_DEADBOLT', 'PREPARE_FLUID_RESUSCITATION']
  },

  // Priority 2 - Very Urgent (Orange) - Target Time: 10 minutes
  {
    id: 'MTS-D04-ACUTE-CORONARY',
    name: 'Ischemic ST-Elevation / Severe Crushing Angina',
    level: 2,
    description: 'Acute substernal chest pressure with ST elevation or diaphoresis in high-risk CAD patient.',
    mandatoryInterventions: ['URGENT_CAD_DISPATCH', 'UNLOCK_RING_DEADBOLT', 'ASPIRIN_INSTRUCTION_CHECK', 'TRANSMIT_12_LEAD_ECG']
  },
  {
    id: 'MTS-D05-STROKE-ACUTE',
    name: 'Acute Neurological Deficit / CVA (<4.5 hrs window)',
    level: 2,
    description: 'Sudden facial droop, unilateral hemiparesis, sudden speech dysarthria or receptive aphasia.',
    mandatoryInterventions: ['STROKE_CODE_CAD_DISPATCH', 'LOG_LAST_KNOWN_WELL_TIME', 'UNLOCK_RING_DEADBOLT']
  },
  {
    id: 'MTS-D06-SEVERE-HYPOXIA',
    name: 'Severe Oxygen Desaturation (SpO2 < 90%)',
    level: 2,
    description: 'SpO2 drops below 90% in ambient air with tachypnea (>28 bpm) or acute respiratory distress.',
    mandatoryInterventions: ['URGENT_CAD_DISPATCH', 'POSITIONING_INSTRUCTION', 'UNLOCK_RING_DEADBOLT']
  },

  // Priority 3 - Urgent (Yellow) - Target Time: 60 minutes
  {
    id: 'MTS-D07-TRAUMATIC-FALL',
    name: 'High Deceleration Fall Without Intracranial Deficit',
    level: 3,
    description: 'Mechanical fall with impact > 4.5G but patient remains alert and oriented without focal neuro signs.',
    mandatoryInterventions: ['FAMILY_NOTIFY_CALL', 'MONITOR_SPINE_STABILIZATION', 'STANDBY_EMS_DISPATCH']
  },
  {
    id: 'MTS-D08-MODERATE-TACHYCARDIA',
    name: 'Symptomatic Tachycardia (HR 120-150 bpm)',
    level: 3,
    description: 'Elevated rate without hypotension or altered sensorium.',
    mandatoryInterventions: ['CONTINUOUS_VITALS_STREAMING', 'RESTING_POSTURE_GUIDANCE']
  },

  // Priority 4 - Standard (Green) - Target Time: 120 minutes
  {
    id: 'MTS-D09-MILD-PAIN',
    name: 'Low-Acuity Musculoskeletal Pain or Minor Abrasion',
    level: 4,
    description: 'Isolated superficial injury with stable vitals.',
    mandatoryInterventions: ['FIRST_AID_PROTOCOL_DISPLAY', 'PRIMARY_CARE_FOLLOWUP']
  },

  // Priority 5 - Non-urgent (Blue) - Target Time: 240 minutes
  {
    id: 'MTS-D10-ROUTINE-QUERY',
    name: 'Routine Health Inquiry / Medication Check',
    level: 5,
    description: 'No physiological derangement or acute symptoms.',
    mandatoryInterventions: ['STANDARD_HEALTH_EDUCATION']
  }
];
