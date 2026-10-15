import express, { Request, Response } from 'express';
import cors from 'cors';
import { mcpClient, McpClient } from './mcpClient.js';
import { SentinelAgent, AnomalyAlert } from './agents/sentinelAgent.js';
import { DiagnosticAgent, DiagnosticAssessment } from './agents/diagnosticAgent.js';
import { DispatchAgent, DispatchExecutionReport } from './agents/dispatchAgent.js';

export interface FullTriageCycleResult {
  alert: AnomalyAlert;
  assessment: DiagnosticAssessment;
  dispatchReport?: DispatchExecutionReport;
  cycleDurationMs: number;
  timestamp: string;
}

export class CuraStrandOrchestrator {
  private mcp: McpClient;
  public sentinel: SentinelAgent;
  public diagnostic: DiagnosticAgent;
  public dispatch: DispatchAgent;

  constructor(client: McpClient = mcpClient) {
    this.mcp = client;
    this.sentinel = new SentinelAgent(client);
    this.diagnostic = new DiagnosticAgent(client);
    this.dispatch = new DispatchAgent(client);
  }

  public async runFullTriageCycle(
    patientId: string,
    acousticHint?: string,
    userQuery?: string
  ): Promise<FullTriageCycleResult> {
    const startTime = Date.now();

    // 1. Sentinel stream evaluation
    const alert = await this.sentinel.evaluateBiosignalStream(patientId, acousticHint);

    // 2. Multimodal Diagnostic Reasoning & Formal Safety Verification
    const assessment = await this.diagnostic.assessEmergency(
      patientId,
      alert.vitals,
      alert.acoustic,
      userQuery
    );

    // 3. Autonomous Crisis Dispatch Orchestration if Level 1 or 2
    let dispatchReport: DispatchExecutionReport | undefined;
    if (assessment.triageEvaluation.level <= 2) {
      dispatchReport = await this.dispatch.executeCrisisOrchestration(assessment, alert.vitals);
    }

    const duration = Date.now() - startTime;

    return {
      alert,
      assessment,
      dispatchReport,
      cycleDurationMs: duration,
      timestamp: new Date().toISOString()
    };
  }
}

export const orchestrator = new CuraStrandOrchestrator();

// -------------------------------------------------------------
// Orchestrator HTTP Bridge for Web HUD Simulator
// -------------------------------------------------------------

const app = express();
const PORT = process.env.AGENT_PORT ? parseInt(process.env.AGENT_PORT, 10) : 3002;

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'curastrand-agent-core',
    mode: process.env.AWS_ACCESS_KEY_ID ? 'AWS_BEDROCK_CONNECTED' : 'LOCAL_NEURAL_ENGINE',
    timestamp: new Date().toISOString()
  });
});

/**
 * Run autonomous triage cycle on demand
 */
app.post('/api/triage/run', async (req: Request, res: Response) => {
  try {
    const { patientId = 'PT-1001', acousticHint, userQuery } = req.body;
    const result = await orchestrator.runFullTriageCycle(patientId, acousticHint, userQuery);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Triage cycle failed' });
  }
});

/**
 * Handle simulated Alexa+ voice / text interactive dialogues
 */
app.post('/api/alexa/query', async (req: Request, res: Response) => {
  try {
    const { query, patientId = 'PT-1001' } = req.body;
    const result = await orchestrator.runFullTriageCycle(patientId, query, query);
    
    // Construct natural spoken Alexa response
    const triage = result.assessment.triageEvaluation;
    let spokenResponse = '';
    
    if (triage.level === 1) {
      spokenResponse = `Emergency Alert. I have detected critical signs of cardiac or respiratory distress. Paramedics have been dispatched immediately. Your front door has been unlocked for first responders, and emergency floodlights are flashing. If the patient is not breathing, start CPR now.`;
    } else if (triage.level === 2) {
      spokenResponse = `Urgent Medical Warning. Critical symptoms consistent with ${result.assessment.differentialDiagnosis[0]} detected. Emergency dispatch has been alerted, and your front door has been unlocked for responders. Stay calm and remain seated.`;
    } else {
      spokenResponse = `I am continuously monitoring your vital signs. Heart rate and blood pressure are within safe ranges. If you experience sudden chest discomfort or shortness of breath, let me know immediately.`;
    }

    res.json({
      alexaResponse: spokenResponse,
      triageLevel: triage.level,
      color: triage.color,
      triageCategory: triage.category,
      assessment: result.assessment,
      dispatch: result.dispatchReport,
      durationMs: result.cycleDurationMs
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Query failed' });
  }
});

app.listen(PORT, () => {
  console.log(`[CuraStrand Agent Core] Running on http://localhost:${PORT}`);
  console.log(`[CuraStrand Agent Core] Connected to MCP Server on http://localhost:3001`);
});

export default app;
