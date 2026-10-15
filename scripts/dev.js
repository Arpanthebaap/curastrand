/**
 * CuraStrand Cross-Platform Monorepo Unified Dev Runner
 * Launches MCP Server (3001), Agent Core (3002), and Web HUD (5173) concurrently.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

console.log('================================================================================');
console.log(' STARTING CURASTRAND MULTIMODAL CLINICAL TRIAGE ARCHITECTURE');
console.log('================================================================================\n');

function runService(name, cwd, command, args, color) {
  console.log(`[${name}] Launching in ${cwd}...`);
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: isWindows
  });

  child.on('error', (err) => {
    console.error(`[${name}] Failed to start:`, err.message);
  });

  child.on('close', (code) => {
    console.log(`[${name}] Exited with code ${code}`);
  });

  return child;
}

// 1. Launch MCP Server
const mcp = runService(
  'MCP-SERVER',
  path.join(rootDir, 'packages', 'mcp-server'),
  npxCmd,
  ['tsx', 'src/server.ts']
);

// 2. Launch Agent Core (after 1s delay to let MCP initialize)
setTimeout(() => {
  const agent = runService(
    'AGENT-CORE',
    path.join(rootDir, 'packages', 'agent-core'),
    npxCmd,
    ['tsx', 'src/orchestrator.ts']
  );
}, 1200);

// 3. Launch Web HUD
setTimeout(() => {
  const hud = runService(
    'WEB-HUD',
    path.join(rootDir, 'packages', 'web-hud'),
    npxCmd,
    ['vite', '--port', '5173', '--host']
  );
  console.log('\n>>> All CuraStrand services initialized!');
  console.log('>>> Open your browser at http://localhost:5173 to access the Clinical Command Center.\n');
}, 2200);
