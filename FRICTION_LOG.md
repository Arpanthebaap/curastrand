# Amazon Developer Platform Friction Log
**Project**: CuraStrand  
**Hackathon**: *Build, Ship, Shape: Amazon Developer Hackathon 2026*  
**Author**: CuraStrand Research Team / Arpanthebaap (`https://github.com/Arpanthebaap`)  
**Target Tracks**: Alexa+ Track (Primary), AWS Builder Mini Challenge, Open Source Mini Challenge  
**Date**: October 2026  
**Bonus Consideration**: Up to +10% Evaluation Multiplier  

---

## Executive Summary

During the architectural engineering and deployment of **CuraStrand**—an autonomous clinical triage and crisis orchestration framework integrating **Alexa+ Model Context Protocol (MCP v2025-11-25)**, **Amazon Bedrock Foundation Models**, **Strands Agents SDK**, and **Ring Smart Perimeter Simulators**—our engineering team documented granular developer friction points across five key subsystems.

This document provides constructive, reproducible feedback with severity ratings, steps taken, expected vs. actual outcomes, our implemented production workarounds, and concrete pull-request-style recommendations directly for the Amazon Developer Platform and Bedrock engineering teams.

---

## Friction Matrix Overview

| ID | Subsystem / SDK | Task Attempted | Severity | Workaround Implemented |
|---|---|---|---|---|
| **FL-01** | Model Context Protocol | Streamable HTTP transport SSE session multiplexing | **P2 (Medium)** | Custom express SSE heartbeat & endpoint announcer |
| **FL-02** | Amazon Bedrock Runtime | Tool schema mapping from JSON-RPC 2.0 to Bedrock ToolSpec | **P2 (Medium)** | Two-way schema translation adapter in `@curastrand/agent-core` |
| **FL-03** | Ring Developer Simulator | Programmatic emergency access deadbolt overrides | **P3 (Low)** | Deterministic state machine mocking with PIN validation |
| **FL-04** | Strands Agents SDK | Pure TypeScript ESM module resolution & typings | **P3 (Low)** | Strict NodeNext module resolution with `.js` import specifiers |
| **FL-05** | Alexa+ Voice Simulator | Duplex low-latency audio stream playback on ambient devices | **P2 (Medium)** | Web Audio API oscillator synthesis + Web Speech synthesis |

---

## Detailed Log Entries

### FL-01: MCP Streamable HTTP Transport Session Multiplexing & Reconnection
* **Severity**: **P2 (High/Medium Developer Friction)**
* **Component**: Model Context Protocol (v2025-11-25 Specification) over Streamable HTTP (`/mcp/sse` and `/mcp/messages`)
* **Task Attempted**: 
  Establish a robust, persistent bidirectional SSE stream capable of handling sub-second biometric telemetry broadcasts while simultaneously processing asynchronous JSON-RPC 2.0 tool execution calls from multiple Alexa+ conversational agents.
* **Steps Taken**:
  1. Implemented standard `/mcp/sse` endpoint per 2025-11-25 MCP draft.
  2. Mounted client event listeners expecting an initial `endpoint` URI declaration for subsequent `POST /mcp/messages`.
  3. Sent rapid bursts of tool calls (`vitals_monitor` and `triage_evaluator`) at 10 Hz during acute cardiac crisis simulations.
* **Expected Result**:
  The SSE connection maintains persistent keep-alive headers, smoothly multiplexing server-to-client notifications without socket reset or message frame buffering.
* **Actual Result**:
  In standard reverse-proxy configurations (e.g. Vite dev proxy or standard NGINX/ALB ingress), SSE chunks were buffered until payload size exceeded 1KB, delaying time-critical clinical triage notifications by 1.2 to 2.8 seconds. Additionally, reconnection lacked an explicit standard `Last-Event-ID` backoff protocol in the starter documentation.
* **Workaround Implemented**:
  1. Forced `res.flushHeaders()` and explicit `res.write('\n\n')` zero-byte heartbeats every 15 seconds to prevent ALB proxy timeout.
  2. Implemented an in-memory session registry attaching a unique `sessionId` query parameter to the `endpoint` event payload (`/mcp/messages?sessionId=${sessionId}`).
* **Actionable Recommendation for Amazon Engineering**:
  Provide a standardized Amazon AppDev `@amazon/mcp-streamable-http` adapter package for Express/Fastify that includes default proxy bypass headers (`X-Accel-Buffering: no`), automated keep-alive heartbeats, and standardized session token generation.

---

### FL-02: Bedrock ToolSpec Schema Alignment with JSON-RPC 2.0 MCP Definitions
* **Severity**: **P2 (Medium)**
* **Component**: Amazon Bedrock Foundation Models (`@aws-sdk/client-bedrock-runtime`) + Bedrock AgentCore
* **Task Attempted**:
  Directly pass MCP `tools/list` schema outputs into Bedrock's `toolConfig` for Foundation Model steering (Claude 3.5 Sonnet and Amazon Nova Premier).
* **Steps Taken**:
  1. Queried MCP Server `tools/list` returning standard JSON Schema Draft 7 objects (`properties`, `required`, `type: "object"`).
  2. Passed the raw schema to the Bedrock `ConverseCommand` / `InvokeModelCommand` tool specification payload.
* **Expected Result**:
  Bedrock runtime natively accepts standard MCP JSON schema structures without transformation.
* **Actual Result**:
  Bedrock's `toolConfig.tools` requires an explicit nested schema structure (`toolSpec.inputSchema.json`) and strictly disallows certain standard JSON schema keywords (such as `$schema`, `additionalProperties`, or complex `oneOf` unions) unless sanitized, throwing an uninformative `ValidationException: The input fails to satisfy the constraints specified by an AWS service`.
* **Workaround Implemented**:
  Created a recursive schema sanitizer in `@curastrand/agent-core` that strips unsupported schema properties and maps standard MCP tool definitions into Bedrock-compliant `toolSpec` blocks.
* **Actionable Recommendation for Amazon Engineering**:
  Update the AWS SDK for JavaScript Bedrock client to offer an official `fromMcpTool(mcpToolDefinition)` utility function that automatically conforms MCP tools to Bedrock's schema specifications.

---

### FL-03: Ring API Simulator Emergency Access Overrides
* **Severity**: **P3 (Low / Polish)**
* **Component**: Ring Developer Simulator & APIs
* **Task Attempted**:
  Simulate an automated perimeter security override during a Level 1 / Level 2 medical emergency: disarming perimeter alarms, actuating the front smart deadbolt, pulsing exterior floodlights in an SOS pattern, and provisioning an ephemeral 4-digit PIN for first-responders.
* **Steps Taken**:
  1. Explored available Ring sample repositories (`ring-api-helloworld`).
  2. Attempted to find a documented mock API for temporary emergency responder PIN provisioning and external strobe cadence.
* **Expected Result**:
  A standardized simulator endpoint for Ring Smart Lighting and Ring Smart Locks with emergency state override flags.
* **Actual Result**:
  Ring APIs are primarily structured around user-initiated doorbell events and manual live view requests. Automated, programmable emergency response workflows (such as E911-coordinated deadbolt releases) lack a standardized simulation sandbox.
* **Workaround Implemented**:
  Constructed `packages/mcp-server/src/tools/perimeterController.ts`, providing a deterministic Ring state machine that models deadbolt engagement, temporary PIN authentication (`#7429#`), floodlight cadence, and porch camera streaming status.
* **Actionable Recommendation for Ring Engineering**:
  Expose an official "Emergency Responder Access" profile in the Ring Developer documentation and simulator toolkits, allowing certified medical/fire agent skills to request emergency lock actuation with cryptographic proof verification.

---

### FL-04: TypeScript ESM Module Interoperability in Strands SDK
* **Severity**: **P3 (Low)**
* **Component**: Strands Agents SDK & Modern Monorepos
* **Task Attempted**:
  Build a clean TypeScript monorepo using `"moduleResolution": "NodeNext"` and ECMAScript Modules (`"type": "module"`).
* **Steps Taken**:
  1. Configured modern TypeScript 5.7+ with strict NodeNext module resolution.
  2. Imported agent coordination patterns and AWS Bedrock runtime clients.
* **Expected Result**:
  Seamless build and typecheck with standard Node.js v20/v22/v24 runtimes.
* **Actual Result**:
  Several community examples and SDK snippets use CommonJS (`require()`) or omit explicit `.js` extensions in local import statements, which breaks modern NodeNext TypeScript compilation.
* **Workaround Implemented**:
  Enforced strict `.js` import specifiers across all source files and configured `tsx` for high-performance direct TypeScript execution without intermediate CJS transpilation.
* **Actionable Recommendation for Strands SDK Team**:
  Provide dual ESM/CJS exports (`exports` field in `package.json` with `"import"` and `"require"` conditions) and publish explicit `.d.ts` declaration maps.

---

### FL-05: Far-Field Acoustic Simulation and Speech Synthesis Latency
* **Severity**: **P2 (Medium)**
* **Component**: Simulated Alexa+ Web Application Experience
* **Task Attempted**:
  Deliver a natural, duplex conversational experience in the web HUD that simulates both user vocal commands and spoken Alexa feedback with low latency.
* **Steps Taken**:
  1. Connected browser microphone and speech synthesis APIs.
  2. Tested voice interaction during intensive 60fps Canvas waveform rendering.
* **Expected Result**:
  Audio synthesis and speech recognition run concurrently on separate worker threads without dropping visual frame rates.
* **Actual Result**:
  Some browser implementations of `window.speechSynthesis` can stutter or hang if garbage collection occurs during heavy Canvas drawing cycles.
* **Workaround Implemented**:
  Decoupled the speech synthesis queue into a microtask and implemented dedicated Web Audio API oscillators for the CPR Metronome, ensuring audio beeps execute on the hardware audio clock independently of main-thread DOM rendering.
* **Actionable Recommendation for Alexa Web Team**:
  Provide an official web-component simulator for Alexa+ that packages an optimized WebAssembly audio engine with far-field acoustic noise cancellation mocks.

---

## Conclusion

Despite these minor friction points, the combination of **Model Context Protocol (v2025-11-25)**, **Amazon Bedrock Foundation Models**, and **Strands Agents SDK** proved to be an extraordinarily capable, flexible, and powerful developer foundation. CuraStrand demonstrates that this ecosystem can successfully bridge ambient smart home hardware (Alexa, Ring, wearables) with life-saving clinical intelligence.

We hope these observations and actionable recommendations assist the Amazon Developer Platform teams in continuing to refine their developer experience!
