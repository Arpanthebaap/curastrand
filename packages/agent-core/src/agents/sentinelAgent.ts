import { McpClient } from '../mcpClient.js';

export interface AnomalyAlert {
  patientId: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'NORMAL';
  reasons: string[];
  vitals: any;
  acoustic: any;
}

export class SentinelAgent {
  private mcp: McpClient;

  constructor(mcpClient: McpClient) {
    this.mcp = mcpClient;
  }

  public async evaluateBiosignalStream(patientId: string, acousticHint?: string): Promise<AnomalyAlert> {
    const vitals = await this.mcp.callTool('vitals_monitor', { patient_id: patientId });
    const acoustic = await this.mcp.callTool('acoustic_analyzer', {
      audio_stream_id: `stream-${patientId}`,
      detected_utterance: acousticHint || ''
    });

    const reasons: string[] = [];
    let severity: AnomalyAlert['severity'] = 'NORMAL';

    // Lethal anomalies
    if (vitals.ecgRhythm === 'ventricular_fibrillation' || vitals.ecgRhythm === 'asystole') {
      reasons.push(`Lethal cardiac rhythm: ${vitals.ecgRhythm}`);
      severity = 'CRITICAL';
    }

    if (acoustic.primaryClassification === 'agonal_breathing') {
      reasons.push('Acoustic agonal breathing pattern detected (respiratory arrest warning)');
      severity = 'CRITICAL';
    }

    if (vitals.impactDecelerationG > 4.0) {
      reasons.push(`High deceleration impact vector detected (${vitals.impactDecelerationG}G)`);
      if (severity !== 'CRITICAL') severity = 'CRITICAL';
    }

    // High acuity warning anomalies
    if (vitals.ecgRhythm === 'stemi_elevation') {
      reasons.push('ST-Segment Elevation vector (acute coronary occlusion)');
      if (severity !== 'CRITICAL') severity = 'CRITICAL';
    }

    if (vitals.spO2Percent < 90) {
      reasons.push(`Critical hypoxemia: SpO2 at ${vitals.spO2Percent}%`);
      if (severity !== 'CRITICAL') severity = 'CRITICAL';
    }

    if (acoustic.primaryClassification === 'inspiratory_stridor') {
      reasons.push('Laryngeal stridor / upper airway compromise');
      if (severity !== 'CRITICAL') severity = 'CRITICAL';
    }

    if (acoustic.primaryClassification === 'aphasic_dysarthria') {
      reasons.push('Speech dysarthria / asymmetric vocal tract paralysis (suspected CVA)');
      if (severity !== 'CRITICAL') severity = 'CRITICAL';
    }

    if (reasons.length > 0 && severity === 'NORMAL') {
      severity = 'WARNING';
    }

    return {
      patientId,
      timestamp: new Date().toISOString(),
      severity,
      reasons,
      vitals,
      acoustic
    };
  }
}
