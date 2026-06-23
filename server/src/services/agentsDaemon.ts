/**
 * Shared daemon launcher for cache-purger, health-checker, and omni-fixer agents.
 */
import { fork } from 'child_process';
import path from 'path';
import fs from 'fs';

interface AgentConfig {
  id: string;
  label: string;
  color: string;
  scriptPath: string;
  envVar: string;
}

const AGENTS: AgentConfig[] = [
  { id: 'cache-purger', label: 'CachePurger', color: '#FF9800', scriptPath: 'agents/agents/cache-purger/agent.js', envVar: 'CACHE_PURGER_DISABLED' },
  { id: 'health-checker', label: 'HealthChecker', color: '#E040FB', scriptPath: 'agents/agents/health-checker/agent.js', envVar: 'HEALTH_CHECKER_DISABLED' },
  { id: 'omni-fixer', label: 'OmniFixer', color: '#7C4DFF', scriptPath: 'agents/agents/omni-fixer/agent.js', envVar: 'OMNI_FIXER_DISABLED' },
];

const processes = new Map<string, ReturnType<typeof fork>>();

export function startAgentDaemon(agent: AgentConfig): void {
  if (processes.has(agent.id)) return;
  if (process.env[agent.envVar] === 'true') return;

  const agentPath = path.resolve(__dirname, '../../', agent.scriptPath);
  if (!fs.existsSync(agentPath)) {
    console.log(`${agent.color} [${agent.label}] Script not found at ${agentPath}`);
    return;
  }

  try {
    const proc = fork(agentPath, [], {
      stdio: 'pipe',
      env: { ...process.env, [`${agent.id.toUpperCase().replace('-', '_')}_PARENT`]: 'server' },
    });

    proc.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.log(`${agent.color} [${agent.label}] ${msg}`);
    });
    proc.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.error(`${agent.color} [${agent.label}:ERR] ${msg}`);
    });
    proc.on('exit', (code, signal) => {
      processes.delete(agent.id);
      if (code !== 0 && signal !== 'SIGTERM') {
        setTimeout(() => startAgentDaemon(agent), 5000);
      }
    });
    proc.on('error', () => { processes.delete(agent.id); });

    processes.set(agent.id, proc);
    console.log(`${agent.color} [${agent.label}] Daemon started (PID: ${proc.pid || '?'})`);
  } catch (err: any) {
    console.error(`${agent.color} [${agent.label}] Failed to start:`, err.message);
  }
}

export function startAllHealthAgents(): void {
  for (const agent of AGENTS) {
    startAgentDaemon(agent);
  }
}

export function stopAgentDaemon(id: string): void {
  const proc = processes.get(id);
  if (proc) {
    proc.kill('SIGTERM');
    processes.delete(id);
  }
}

export function stopAllHealthAgents(): void {
  for (const [id] of processes) {
    stopAgentDaemon(id);
  }
}
