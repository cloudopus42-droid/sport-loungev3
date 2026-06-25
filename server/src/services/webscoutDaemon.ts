import { fork } from 'child_process';
import path from 'path';

let daemonProcess: ReturnType<typeof fork> | null = null;

export function startWebScoutDaemon(): void {
  if (daemonProcess) { return; }
  if (process.env.WEBSCOUT_DISABLED === 'true') { return; }

  const agentPath = path.resolve(__dirname, '../../../agents/agents/webscout/agent.js');
  if (!require('fs').existsSync(agentPath)) {
    console.log('🕷️ [WebScout] Agent script not found at', agentPath);
    return;
  }

  try {
    daemonProcess = fork(agentPath, [], {
      stdio: 'pipe',
      env: { ...process.env, WEBSCOUT_PARENT: 'server' },
    });

    daemonProcess.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.log(`🕷️ [WebScout] ${msg}`);
    });
    daemonProcess.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.error(`🕷️ [WebScout:ERR] ${msg}`);
    });
    daemonProcess.on('exit', (code, signal) => {
      daemonProcess = null;
      if (code !== 0 && signal !== 'SIGTERM') {
        setTimeout(startWebScoutDaemon, 5000);
      }
    });
    daemonProcess.on('error', () => { daemonProcess = null; });
    console.log('🕷️ [WebScout] Daemon started (PID: ' + (daemonProcess.pid || '?') + ')');
  } catch (err: any) {
    console.error('🕷️ [WebScout] Failed to start:', err.message);
  }
}

export function stopWebScoutDaemon(): void {
  if (daemonProcess) {
    daemonProcess.kill('SIGTERM');
    daemonProcess = null;
  }
}
