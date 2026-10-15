# CuraStrand Architectural Specification & Technical Blueprint

This document details the software architecture, data models, network protocol interactions, and multi-agent lifecycle events comprising the **CuraStrand** framework.

---

## 1. High-Level Subsystem Interaction

CuraStrand is structured into three discrete runtime tiers communicating via standardized protocols:

```
[ Ambient Sensors ]                [ Model Context Protocol ]                  [ Multi-Agent Core ]
  Wearable Telemetry  ──────────▶    GET /mcp/sse (Stream)       ───────────▶   Sentinel Agent
  Far-field Audio    ──────────▶    POST /mcp/messages (JSON-RPC) ───────────▶   Diagnostic Agent (Bedrock)
  Perimeter Camera   ──────────▶    tools/call, resources/read   ───────────▶   Safety Governor (Formal MTS)
                                                                                Dispatch Agent (Ring / E911)
```

---

## 2. Emergency Triage Sequence Diagram

The following sequence diagram details the end-to-end execution flow during a sudden cardiac crisis:

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient (Robert Sterling)
    participant Wearable as Bee / Apple Watch
    participant Audio as Alexa Far-Field Mic
    participant MCP as CuraStrand MCP Server
    participant Agent as CuraStrand Agent Core
    participant Bedrock as Amazon Bedrock (Claude 3.5)
    participant Governor as Safety Governor (MTS Proof)
    participant Ring as Ring Smart Lock
    participant EMS as 911 CAD Dispatch

    Note over Patient,Wearable: Sudden Out-of-Hospital Cardiac Arrest
    Wearable->>MCP: Stream ECG: ventricular_fibrillation, SpO2: 82%
    Audio->>MCP: Acoustic frame: agonal_breathing (SII: 0.22)
    MCP->>Agent: Broadcast tool_executed event via SSE
    Agent->>Agent: SentinelAgent flags CRITICAL anomaly
    Agent->>MCP: tools/call (triage_evaluator)
    MCP-->>Agent: MTS Level 1 (Immediate Red, 0 min response)
    Agent->>Bedrock: Synthesize multimodal clinical reasoning
    Bedrock-->>Agent: Propose differential diagnosis & actions
    Agent->>Governor: Formal Invariant Verification Gate
    Governor-->>Agent: Invariants Verified (0.00% False Negative Proof)
    Agent->>MCP: tools/call (perimeter_controller: unlock_deadbolt)
    MCP->>Ring: Actuate Smart Deadbolt + Flash Exterior SOS Strobe
    Agent->>MCP: tools/call (ems_dispatcher: transmit_cad)
    MCP->>EMS: Transmit HL7/FHIR E911 Packet with Door PIN #7429#
    Agent->>MCP: tools/call (cpr_metronome: start, 110 BPM)
    Agent->>Patient: Spoken Alexa Audio: "Paramedics dispatched. Start CPR now."
```

---

## 3. Data Flow & Security Model

### 3.1 Patient Privacy & Local Context
* Patient health records (EHR) and biometric baselines are stored on-device in `packages/mcp-server/src/resources/patientEHR.ts`.
* In local neural simulation mode, all inference occurs 100% on-premises with zero outbound network egress.
* In AWS Bedrock mode, patient names and identifiers are pseudonymized using ephemeral session hashes (`PT-1001`).

### 3.2 Formal Safety Verification Pipeline
The Safety Governor enforces non-bypassable invariants before any tool execution:
```
LLM Proposed Action ──▶ [ Safety Governor ] ──┬── Passed ──▶ Execute Tool
                             ▲                │
                     Formal Invariants        └── Failed ──▶ Intercept & Force Level 1 Override
```

---

## 4. Port Allocations & Development Topology

| Service | Port | Description |
|---|---|---|
| **MCP Streamable HTTP Server** | `3001` | Hosts `/mcp/messages` (JSON-RPC) & `/mcp/sse` |
| **Agent Core Orchestrator** | `3002` | Multi-agent execution loop and `/api/alexa/query` bridge |
| **Web HUD Command Center** | `5173` | React 19 + Vite simulated Alexa+ clinical interface |

---

## 5. Extensibility: Adding Custom Tools

To add an MCP tool, implement the handler and definition in `packages/mcp-server/src/tools/` and register it in `ALL_TOOLS` inside `packages/mcp-server/src/server.ts`.
