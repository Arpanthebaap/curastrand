export interface PatientVitals {
  patientId: string;
  timestamp: string;
  heartRateBpm: number;
  systolicBp: number;
  diastolicBp: number;
  spO2Percent: number;
  respiratoryRate: number;
  hrvRmssdMs: number;
  ecgRhythm: 'sinus_rhythm' | 'sinus_tachycardia' | 'ventricular_fibrillation' | 'stemi_elevation' | 'asystole' | 'atrial_fibrillation';
  impactDecelerationG: number;
  skinConductanceUs?: number;
  wearableSource: string;
}

export interface AcousticData {
  audioStreamId: string;
  timestamp: string;
  primaryClassification: string;
  confidence: number;
  splDecibels: number;
  speechIntelligibilityIndex: number;
  detectedLanguageOrDialect: string;
  transcriptionOrAcousticPhonemes: string;
  urgencyScore: number;
}

export interface TriageResult {
  level: 1 | 2 | 3 | 4 | 5;
  category: 'Immediate' | 'Very Urgent' | 'Urgent' | 'Standard' | 'Non-urgent';
  color: 'Red' | 'Orange' | 'Yellow' | 'Green' | 'Blue';
  targetResponseTimeMinutes: number;
  discriminatorsTriggered: string[];
  vitalSignsFlagged: string[];
  mandatoryActions: string[];
  formalProofHash: string;
}

export interface RingState {
  deviceId: string;
  frontDoorLocked: boolean;
  emergencyStrobeActive: boolean;
  sirenActive: boolean;
  porchCameraStreaming: boolean;
  responderAccessGranted: boolean;
  temporaryAccessPin: string;
  lastEventDescription: string;
}

export interface CadIncident {
  cadIncidentId: string;
  timestamp: string;
  patientId: string;
  patientName: string;
  address: string;
  chiefComplaint: string;
  triagePriority: TriageResult;
  responderDoorAccessPin: string;
  dispatchStatus: string;
  estimatedArrivalMinutes: number;
}
