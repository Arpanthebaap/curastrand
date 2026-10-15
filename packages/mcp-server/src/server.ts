import express, { Request, Response } from 'express';
import cors from 'cors';
import { vitalsMonitorToolDefinition, executeVitalsMonitor, vitalsRepository } from './tools/vitalsMonitor.js';
import { acousticAnalyzerToolDefinition, executeAcousticAnalyzer } from './tools/acousticAnalyzer.js';
import { triageEvaluatorToolDefinition, executeTriageEvaluator } from './tools/triageEvaluator.js';
import { perimeterControllerToolDefinition, executePerimeterController, ringPerimeterManager } from './tools/perimeterController.js';
import { emsDispatcherToolDefinition, executeEmsDispatcher, emsDispatchService } from './tools/emsDispatcher.js';
import { cprMetronomeToolDefinition, executeCprMetronome, cprMetronomeService } from './tools/cprMetronome.js';
import { SYNTHETIC_EHR_DATABASE } from './resources/patientEHR.js';
import { MANCHESTER_TRIAGE_DISCRIMINATORS } from './resources/triageProtocols.js';
import { McpToolDefinition, McpResourceDefinition } from './types.js';

const app = express();
const PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3001;

app.use(cors());
app.use(express.json());

// Registry of MCP tools
const ALL_TOOLS: Record<string, { definition: McpToolDefinition; handler: (args: any) => any }> = {
  vitals_monitor: {
    definition: vitalsMonitorToolDefinition,
    handler: executeVitalsMonitor
  },
  acoustic_analyzer: {
    definition: acousticAnalyzerToolDefinition,
    handler: executeAcousticAnalyzer
  },
  triage_evaluator: {
    definition: triageEvaluatorToolDefinition,
    handler: executeTriageEvaluator
  },
  perimeter_controller: {
    definition: perimeterControllerToolDefinition,
    handler: executePerimeterController
  },
  ems_dispatcher: {
    definition: emsDispatcherToolDefinition,
    handler: executeEmsDispatcher
  },
  cpr_metronome: {
    definition: cprMetronomeToolDefinition,
    handler: executeCprMetronome
  }
};

// Registry of MCP resources
const ALL_RESOURCES: McpResourceDefinition[] = [
  {
    uri: 'patient://ehr/list',
    name: 'Patient Health Records Registry',
    mimeType: 'application/json',
    description: 'Index of available on-device synthesized patient medical baseline profiles.'
  },
  {
    uri: 'protocols://clinical/manchester_triage',
    name: 'Manchester Triage System Formal Discriminator Matrix',
    mimeType: 'application/json',
    description: 'Deterministic clinical decision tables for ESI & MTS Level 1-5 triage validation.'
  }
];

// Active SSE client connections
const sseClients: Set<Response> = new Set();

function broadcastEvent(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// -------------------------------------------------------------
// MCP Spec v2025-11-25 Streamable HTTP Endpoints
// -------------------------------------------------------------

/**
 * GET /mcp/sse
 * Server-Sent Events stream for asynchronous protocol events.
 */
app.get('/mcp/sse', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sessionId = `mcp-session-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  sseClients.add(res);

  // Send initial endpoint announcement
  res.write(`event: endpoint\ndata: /mcp/messages?sessionId=${sessionId}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

/**
 * POST /mcp/messages
 * JSON-RPC 2.0 message handler over Streamable HTTP transport.
 */
app.post('/mcp/messages', (req: Request, res: Response) => {
  const { jsonrpc, id, method, params } = req.body;

  if (jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: id || null,
      error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' }
    });
  }

  try {
    switch (method) {
      case 'initialize': {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2025-11-25',
            serverInfo: {
              name: 'curastrand-mcp-server',
              version: '1.0.0'
            },
            capabilities: {
              tools: {},
              resources: {},
              prompts: {}
            }
          }
        });
      }

      case 'tools/list': {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: Object.values(ALL_TOOLS).map(t => t.definition)
          }
        });
      }

      case 'tools/call': {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        const toolEntry = ALL_TOOLS[toolName];

        if (!toolEntry) {
          return res.status(404).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Tool not found: ${toolName}` }
          });
        }

        const executionResult = toolEntry.handler(toolArgs);
        
        // Broadcast telemetry update via SSE
        broadcastEvent('tool_executed', {
          tool: toolName,
          arguments: toolArgs,
          result: executionResult,
          timestamp: new Date().toISOString()
        });

        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(executionResult, null, 2)
              }
            ]
          }
        });
      }

      case 'resources/list': {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            resources: ALL_RESOURCES
          }
        });
      }

      case 'resources/read': {
        const uri: string = params?.uri;
        if (uri === 'patient://ehr/list') {
          return res.json({
            jsonrpc: '2.0',
            id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(SYNTHETIC_EHR_DATABASE, null, 2)
                }
              ]
            }
          });
        } else if (uri.startsWith('patient://ehr/')) {
          const ptId = uri.replace('patient://ehr/', '');
          const record = SYNTHETIC_EHR_DATABASE[ptId];
          return res.json({
            jsonrpc: '2.0',
            id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(record || { error: 'Patient not found' }, null, 2)
                }
              ]
            }
          });
        } else if (uri === 'protocols://clinical/manchester_triage') {
          return res.json({
            jsonrpc: '2.0',
            id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(MANCHESTER_TRIAGE_DISCRIMINATORS, null, 2)
                }
              ]
            }
          });
        } else {
          return res.status(404).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Resource not found: ${uri}` }
          });
        }
      }

      case 'ping': {
        return res.json({ jsonrpc: '2.0', id, result: {} });
      }

      default: {
        return res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        });
      }
    }
  } catch (err: any) {
    return res.status(500).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: err?.message || 'Internal error' }
    });
  }
});

// -------------------------------------------------------------
// Direct Diagnostic & Simulation REST Endpoints
// -------------------------------------------------------------

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'curastrand-mcp-server',
    mcpProtocol: '2025-11-25',
    activeTools: Object.keys(ALL_TOOLS),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/vitals/:id', (req: Request, res: Response) => {
  res.json(vitalsRepository.getVitals(req.params.id));
});

app.get('/api/ring/status', (req: Request, res: Response) => {
  res.json(ringPerimeterManager.getState());
});

app.get('/api/dispatches', (req: Request, res: Response) => {
  res.json(emsDispatchService.getAllDispatches());
});

app.get('/api/cpr/status', (req: Request, res: Response) => {
  res.json(cprMetronomeService.getState());
});

/**
 * Benchmark Scenario Preloader for 1-Click Reproducibility
 */
app.post('/api/scenario/load', (req: Request, res: Response) => {
  const { scenarioId } = req.body;

  switch (scenarioId) {
    case 'stemi_arrest': {
      // Scenario 1: Hyperacute STEMI & Sudden Ventricular Fibrillation (Robert Sterling)
      vitalsRepository.updateVitals('PT-1001', {
        heartRateBpm: 198,
        systolicBp: 58,
        diastolicBp: 34,
        spO2Percent: 82,
        respiratoryRate: 6,
        hrvRmssdMs: 8,
        ecgRhythm: 'ventricular_fibrillation',
        impactDecelerationG: 1.2
      });
      break;
    }

    case 'geriatric_fall': {
      // Scenario 2: Severe Fall with Intracranial Impact & Dysarthria (Elena Rostova)
      vitalsRepository.updateVitals('PT-1002', {
        heartRateBpm: 118,
        systolicBp: 188,
        diastolicBp: 104,
        spO2Percent: 93,
        respiratoryRate: 24,
        hrvRmssdMs: 14,
        ecgRhythm: 'atrial_fibrillation',
        impactDecelerationG: 5.8 // Severe mechanical trauma > 4.5G
      });
      break;
    }

    case 'pediatric_anaphylaxis': {
      // Scenario 3: Biphasic Stridor & Hypoxia (Maya Patel)
      vitalsRepository.updateVitals('PT-1004', {
        heartRateBpm: 162,
        systolicBp: 80,
        diastolicBp: 48,
        spO2Percent: 84,
        respiratoryRate: 38,
        hrvRmssdMs: 12,
        ecgRhythm: 'sinus_tachycardia',
        impactDecelerationG: 1.0
      });
      break;
    }

    case 'multilingual_stroke': {
      // Scenario 4: Cross-cultural acute aphasic stroke (Minh Nguyen)
      vitalsRepository.updateVitals('PT-1003', {
        heartRateBpm: 92,
        systolicBp: 204,
        diastolicBp: 116,
        spO2Percent: 95,
        respiratoryRate: 18,
        hrvRmssdMs: 22,
        ecgRhythm: 'sinus_rhythm',
        impactDecelerationG: 1.1
      });
      break;
    }

    case 'baseline':
    default: {
      vitalsRepository.updateVitals('PT-1001', {
        heartRateBpm: 72,
        systolicBp: 128,
        diastolicBp: 82,
        spO2Percent: 98,
        respiratoryRate: 16,
        hrvRmssdMs: 42,
        ecgRhythm: 'sinus_rhythm',
        impactDecelerationG: 0.98
      });
      ringPerimeterManager.executeAction('lock_deadbolt');
      cprMetronomeService.control('stop');
      break;
    }
  }

  broadcastEvent('scenario_loaded', { scenarioId, timestamp: new Date().toISOString() });
  res.json({ success: true, scenarioId, vitals: vitalsRepository.getVitals('PT-1001') });
});

app.listen(PORT, () => {
  console.log(`[CuraStrand MCP Server] Running on http://localhost:${PORT}`);
  console.log(`[CuraStrand MCP Server] MCP Streamable HTTP endpoint: /mcp/messages (spec v2025-11-25)`);
  console.log(`[CuraStrand MCP Server] MCP SSE event stream: /mcp/sse`);
});

export default app;
