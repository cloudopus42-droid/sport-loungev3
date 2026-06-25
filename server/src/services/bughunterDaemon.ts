import { fork } from 'child_process';
import path from 'path';

let daemonProcess: ReturnType<typeof fork> | null = null;

export function startBugHunterDaemon(): void {
  if (daemonProcess) {
    console.log('🤖 [BugHunter] Daemon already running');
    return;
  }

  // Check if env allows
  if (process.env.BUGHUNTER_DISABLED === 'true') {
    console.log('🤖 [BugHunter] Disabled via BUGHUNTER_DISABLED env');
    return;
  }

  const agentPath = path.resolve(__dirname, '../../../agents/agents/bughunter/agent.js');

  try {
    daemonProcess = fork(agentPath, [], {
      stdio: 'pipe',
      env: { ...process.env, BUGHUNTER_PARENT: 'server' },
    });

    daemonProcess.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.log(`🤖 [BugHunter] ${msg}`);
    });

    daemonProcess.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.error(`🤖 [BugHunter:ERR] ${msg}`);
    });

    daemonProcess.on('exit', (code, signal) => {
      console.log(`🤖 [BugHunter] Process exited (code=${code}, signal=${signal})`);
      daemonProcess = null;

      // Auto-restart if not intentional shutdown
      if (code !== 0 && signal !== 'SIGTERM') {
        console.log('🤖 [BugHunter] Auto-restarting in 5s...');
        setTimeout(startBugHunterDaemon, 5000);
      }
    });

    daemonProcess.on('error', (err) => {
      console.error('🤖 [BugHunter] Process error:', err.message);
      daemonProcess = null;
    });

    console.log('🤖 [BugHunter] Daemon started (PID: ' + (daemonProcess.pid || '?') + ')');
  } catch (err: any) {
    console.error('🤖 [BugHunter] Failed to start daemon:', err.message);
    daemonProcess = null;
  }
}

export function stopBugHunterDaemon(): void {
  if (daemonProcess) {
    daemonProcess.kill('SIGTERM');
    daemonProcess = null;
    console.log('🤖 [BugHunter] Daemon stopped');
  }
}

export function triggerBugHunterScan(): void {
  if (daemonProcess) {
    daemonProcess.kill('SIGUSR2');
    console.log('🤖 [BugHunter] Manual scan triggered');
  }
}
