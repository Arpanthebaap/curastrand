import { PatientVitals } from '../types.js';
import { SYNTHETIC_EHR_DATABASE } from '../resources/patientEHR.js';

/**
 * State store for active patient vital telemetry.
 */
class VitalsRepository {
  private activeVitals: Map<string, PatientVitals> = new Map();

  constructor() {
    this.seedDefaultVitals();
  }

  private seedDefaultVitals() {
    // Default baseline for Robert Sterling (PT-1001)
    this.activeVitals.set('PT-1001', {
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
      skinConductanceUs: 4.2,
      wearableSource: 'bee_wearable'
    });
  }

  public getVitals(patientId: string): PatientVitals {
    if (!this.activeVitals.has(patientId)) {
      const ehr = SYNTHETIC_EHR_DATABASE[patientId];
      const base = ehr ? ehr.baselineVitals : { restingHeartRate: 75, systolicBp: 120, diastolicBp: 80, spO2Percent: 98 };
      
      this.activeVitals.set(patientId, {
        patientId,
        timestamp: new Date().toISOString(),
        heartRateBpm: base.restingHeartRate,
        systolicBp: base.systolicBp,
        diastolicBp: base.diastolicBp,
        spO2Percent: base.spO2Percent,
        respiratoryRate: 16,
        hrvRmssdMs: 38,
        ecgRhythm: 'sinus_rhythm',
        impactDecelerationG: 1.0,
        skinConductanceUs: 3.5,
        wearableSource: 'bee_wearable'
      });
    }

    return this.activeVitals.get(patientId)!;
  }

  public updateVitals(patientId: string, partial: Partial<PatientVitals>): PatientVitals {
    const current = this.getVitals(patientId);
    const updated: PatientVitals = {
      ...current,
      ...partial,
      patientId,
      timestamp: new Date().toISOString()
    };
    this.activeVitals.set(patientId, updated);
    return updated;
  }
}

export const vitalsRepository = new VitalsRepository();

export const vitalsMonitorToolDefinition = {
  name: 'vitals_monitor',
  description: 'Query and stream high-frequency biometric vitals (ECG, PPG, SpO2, HRV, impact deceleration) from connected wearables (Bee device, Apple Watch) or ambient biosensors.',
  inputSchema: {
    type: 'object',
    properties: {
      patient_id: {
        type: 'string',
        description: 'Unique clinical patient identifier, e.g. PT-1001'
      },
      wearable_source: {
        type: 'string',
        enum: ['bee_wearable', 'apple_watch', 'ambient_biosensor'],
        description: 'Source of the biometric telemetry'
      },
      override_state: {
        type: 'object',
        description: 'Optional partial vitals to simulate emergency crisis dynamics (e.g. ventricular_fibrillation or trauma fall)'
      }
    },
    required: ['patient_id']
  }
};

export function executeVitalsMonitor(args: {
  patient_id: string;
  wearable_source?: 'bee_wearable' | 'apple_watch' | 'ambient_biosensor';
  override_state?: Partial<PatientVitals>;
}): PatientVitals {
  if (args.override_state) {
    return vitalsRepository.updateVitals(args.patient_id, {
      ...args.override_state,
      wearableSource: args.wearable_source || 'bee_wearable'
    });
  }
  return vitalsRepository.getVitals(args.patient_id);
}
