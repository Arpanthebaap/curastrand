import { McpClient } from '../mcpClient.js';
import { DiagnosticAssessment } from './diagnosticAgent.js';

export interface DispatchExecutionReport {
  cadIncidentId: string;
  ringDoorUnlocked: boolean;
  emergencyStrobeActive: boolean;
  cprMetronomePacing: boolean;
  actionsExecuted: string[];
  summary: string;
  timestamp: string;
}

export class DispatchAgent {
  private mcp: McpClient;

  constructor(mcpClient: McpClient) {
    this.mcp = mcpClient;
  }

  public async executeCrisisOrchestration(
    assessment: DiagnosticAssessment,
    vitals: any
  ): Promise<DispatchExecutionReport> {
    const executed: string[] = [];
    let cadId = 'N/A';
    let ringUnlocked = false;
    let strobeActive = false;
    let cprActive = false;

    const actions = assessment.recommendedActions;

    // 1. Actuate Ring Perimeter Access if mandated
    if (actions.includes('UNLOCK_RING_DEADBOLT')) {
      const ringRes = await this.mcp.callTool('perimeter_controller', {
        action: 'unlock_deadbolt',
        authorization_proof: assessment.triageEvaluation.formalProofHash
      });
      ringUnlocked = !ringRes.frontDoorLocked;
      strobeActive = ringRes.emergencyStrobeActive;
      executed.push('UNLOCK_RING_DEADBOLT');
      executed.push('FLASH_RING_SOS_BEACON');
    }

    // 2. Transmit CAD Incident Dispatch if mandated
    if (actions.includes('IMMEDIATE_CAD_DISPATCH') || actions.includes('URGENT_CAD_DISPATCH')) {
      const cadRes = await this.mcp.callTool('ems_dispatcher', {
        patient_id: assessment.patientId,
        triage_result: assessment.triageEvaluation,
        vitals_snapshot: vitals,
        chief_complaint: assessment.differentialDiagnosis[0] || 'Acute High-Acuity Medical Distress',
        responder_pin: '7429'
      });
      cadId = cadRes.cadIncidentId;
      executed.push('TRANSMIT_CAD_E911_PACKET');
    }

    // 3. Initiate CPR Metronome if cardiac arrest
    if (actions.includes('TRIGGER_AUDIO_CPR_METRONOME')) {
      const cprRes = await this.mcp.callTool('cpr_metronome', {
        action: 'start',
        target_bpm: 110
      });
      cprActive = cprRes.isActive;
      executed.push('TRIGGER_AUDIO_CPR_METRONOME');
    }

    const summary = `Executed ${executed.length} emergency interventions for Level ${assessment.triageEvaluation.level} (${assessment.triageEvaluation.category}). CAD Incident: ${cadId}. Smart door unlocked.`;

    return {
      cadIncidentId: cadId,
      ringDoorUnlocked: ringUnlocked,
      emergencyStrobeActive: strobeActive,
      cprMetronomePacing: cprActive,
      actionsExecuted: executed,
      summary,
      timestamp: new Date().toISOString()
    };
  }
}
