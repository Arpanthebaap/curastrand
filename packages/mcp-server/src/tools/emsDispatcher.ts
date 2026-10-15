import { E911CadPacket, ManchesterTriageResult, PatientVitals } from '../types.js';
import { SYNTHETIC_EHR_DATABASE } from '../resources/patientEHR.js';

class EmsDispatchService {
  private activeDispatches: Map<string, E911CadPacket> = new Map();

  public createDispatch(args: {
    patient_id: string;
    triage_result: ManchesterTriageResult;
    vitals_snapshot: PatientVitals;
    chief_complaint: string;
    responder_pin?: string;
  }): E911CadPacket {
    const ehr = SYNTHETIC_EHR_DATABASE[args.patient_id] || {
      fullName: 'Unknown Patient',
      address: '742 Evergreen Terrace, Seattle, WA',
      gps: { latitude: 47.6062, longitude: -122.3321 },
      activeMedications: [],
      allergies: [],
      chronicConditions: []
    };

    const incidentId = `CAD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const pin = args.responder_pin || '7429';

    const packet: E911CadPacket = {
      cadIncidentId: incidentId,
      timestamp: new Date().toISOString(),
      patientId: args.patient_id,
      patientName: ehr.fullName,
      address: ehr.address,
      gpsCoordinates: ehr.gps,
      triagePriority: args.triage_result,
      chiefComplaint: args.chief_complaint,
      vitalsTrajectorySummary: `HR: ${args.vitals_snapshot.heartRateBpm} bpm, BP: ${args.vitals_snapshot.systolicBp}/${args.vitals_snapshot.diastolicBp}, SpO2: ${args.vitals_snapshot.spO2Percent}%, Rhythm: ${args.vitals_snapshot.ecgRhythm}, Impact: ${args.vitals_snapshot.impactDecelerationG}G`,
      accessInstructions: `Ring Smart Deadbolt Autonomously Unlocked. Emergency Exterior Strobe Active. Keypad Backup PIN: #${pin}#. Patient Allergies: ${ehr.allergies.join(', ') || 'NKDA'}. Current Meds: ${ehr.activeMedications.join('; ')}.`,
      responderDoorAccessPin: pin,
      dispatchStatus: 'EN_ROUTE',
      estimatedArrivalMinutes: args.triage_result.level === 1 ? 4 : 8
    };

    this.activeDispatches.set(incidentId, packet);
    return packet;
  }

  public getDispatch(incidentId: string): E911CadPacket | undefined {
    return this.activeDispatches.get(incidentId);
  }

  public getAllDispatches(): E911CadPacket[] {
    return Array.from(this.activeDispatches.values());
  }
}

export const emsDispatchService = new EmsDispatchService();

export const emsDispatcherToolDefinition = {
  name: 'ems_dispatcher',
  description: 'Transmit an official pre-arrival Computer-Aided Dispatch (CAD) telemetry packet to municipal 911 / EMS dispatch systems via NG911/FHIR protocol. Includes full clinical vitals trajectory, patient EHR history, allergies, and Ring smart entry access PIN.',
  inputSchema: {
    type: 'object',
    properties: {
      patient_id: {
        type: 'string',
        description: 'Patient identifier, e.g. PT-1001'
      },
      triage_result: {
        type: 'object',
        description: 'Manchester Triage evaluation output object'
      },
      vitals_snapshot: {
        type: 'object',
        description: 'Latest biometric vitals'
      },
      chief_complaint: {
        type: 'string',
        description: 'Concise emergency summary for first-responder mobile display'
      },
      responder_pin: {
        type: 'string',
        description: 'Ring access backup PIN'
      }
    },
    required: ['patient_id', 'triage_result', 'vitals_snapshot', 'chief_complaint']
  }
};

export function executeEmsDispatcher(args: {
  patient_id: string;
  triage_result: ManchesterTriageResult;
  vitals_snapshot: PatientVitals;
  chief_complaint: string;
  responder_pin?: string;
}): E911CadPacket {
  return emsDispatchService.createDispatch(args);
}
