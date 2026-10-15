/**
 * CuraStrand Core Clinical and Protocol Type Definitions
 * Adheres to Model Context Protocol (MCP v2025-11-25) specifications.
 */

export type TriagePriorityLevel = 1 | 2 | 3 | 4 | 5;

export interface ManchesterTriageResult {
  level: TriagePriorityLevel;
  category: 'Immediate' | 'Very Urgent' | 'Urgent' | 'Standard' | 'Non-urgent';
  color: 'Red' | 'Orange' | 'Yellow' | 'Green' | 'Blue';
  targetResponseTimeMinutes: number;
  discriminatorsTriggered: string[];
  vitalSignsFlagged: string[];
  mandatoryActions: string[];
  formalProofHash: string;
}

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
  impactDecelerationG: number; // For fall detection (>4.5G indicates high-impact trauma)
  skinConductanceUs?: number;
  wearableSource: 'bee_wearable' | 'apple_watch' | 'ambient_biosensor';
}

export interface AcousticAnalysisResult {
  audioStreamId: string;
  timestamp: string;
  primaryClassification: 'normal_speech' | 'inspiratory_stridor' | 'agonal_breathing' | 'aphasic_dysarthria' | 'pain_vocalization' | 'silence_unresponsive';
  confidence: number;
  splDecibels: number;
  speechIntelligibilityIndex: number;
  detectedLanguageOrDialect: string;
  transcriptionOrAcousticPhonemes: string;
  urgencyScore: number; // 0.0 - 1.0
}

export interface RingPerimeterState {
  deviceId: string;
  frontDoorLocked: boolean;
  emergencyStrobeActive: boolean;
  sirenActive: boolean;
  porchCameraStreaming: boolean;
  responderAccessGranted: boolean;
  temporaryAccessPin: string;
  lastEventDescription: string;
}

export interface E911CadPacket {
  cadIncidentId: string;
  timestamp: string;
  patientId: string;
  patientName: string;
  address: string;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
  triagePriority: ManchesterTriageResult;
  chiefComplaint: string;
  vitalsTrajectorySummary: string;
  accessInstructions: string;
  responderDoorAccessPin: string;
  dispatchStatus: 'TRANSMITTED' | 'ACKNOWLEDGED' | 'EN_ROUTE';
  estimatedArrivalMinutes: number;
}

export interface CPRMetronomeState {
  isActive: boolean;
  targetBpm: number;
  compressionCount: number;
  currentCadenceGuidance: string;
  audioFeedbackEnabled: boolean;
}

/* MCP v2025-11-25 Protocol Types */
export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpResourceDefinition {
  uri: string;
  name: string;
  mimeType: string;
  description?: string;
}

export interface McpPromptDefinition {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}
