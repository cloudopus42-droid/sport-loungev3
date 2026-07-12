import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

// Load env FIRST before any other imports
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import http from 'http';
import { app } from './app';
import { config } from './config/env';
import { connectDB } from './config/db';
import { initSocket } from './socket';
import { startSupportBot } from './services/supportBot';
import { startAdminBot } from './services/adminBot';
import { startOrderScheduler } from './services/orderScheduler';
import { seedSmartFeatures } from './routes/smartFeatures';
import { runMigrations } from './migrate';

async function bootstrap(): Promise<void> {
  // 1. Ensure upload directories exist
  const uploadsDir = path.resolve(__dirname, '../uploads');
  execSync(`mkdir -p "${uploadsDir}"`, { stdio: 'ignore' });
  execSync(`mkdir -p "${path.join(uploadsDir, 'showcases')}"`, { stdio: 'ignore' });

  // 2. Auto-apply SQL migrations
  await runMigrations();

  // 2. Connect to Database (legacy check)
  await connectDB();

  // 3. Seed smart features (background — don't block server start)
  seedSmartFeatures().catch(err => console.warn('⚠️ Smart features seed error:', err));

  // 4. Create HTTP server and init Socket.IO
  const server = http.createServer(app);
  initSocket(server);

  // 3. Listen on PORT
  server.listen(config.port, () => {
    console.log(`\n🚀 SPORT LOUNGE Server running on port ${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   API: http://localhost:${config.port}/api`);
    console.log(`   Health: http://localhost:${config.port}/api/health\n`);

    // Start automated Telegram support bot
    if (process.env.SUPPORT_BOT_ENABLED === 'true' || config.isProduction) {
      try {
        cleanupSupportBot = startSupportBot();
      } catch (err: any) {
        console.error('❌ Failed to start support bot:', err.message);
      }
    } else {
      console.log('🤖 [Support Bot] Disabled in development (set SUPPORT_BOT_ENABLED=true to run locally)');
    }

    // Start admin bot for order management
    startAdminBot().then((cleanup) => {
      cleanupAdminBot = cleanup;
    }).catch((err: any) => {
      console.error('❌ Failed to start admin bot:', err.message);
    });

    // Start background orders delay tracker
    try {
      startOrderScheduler();
    } catch (err: any) {
      console.error('❌ Failed to start order scheduler:', err.message);
    }

    // Auto-pinger to prevent Render.com from sleeping
    if (config.isProduction) {
      console.log('🤖 [Auto-Pinger] Started. Will ping self health check every 10 minutes.');
      setInterval(async () => {
        try {
          const healthUrl = `http://localhost:${config.port}/api/health`;
          const res = await fetch(healthUrl);
          if (res.ok) {
            console.log(`🤖 [Auto-Pinger] Self health check ping successful at ${new Date().toISOString()}`);
          }
        } catch (pingErr: any) {
          console.warn('⚠️ [Auto-Pinger] Self ping failed:', pingErr.message);
        }
      }, 600000); // 10 minutes in ms
    }
  });

  // 4. Graceful shutdown
  let cleanupSupportBot: (() => void) | undefined;
  let cleanupAdminBot: (() => void) | undefined | null;

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    if (cleanupSupportBot) cleanupSupportBot();
    if (cleanupAdminBot) cleanupAdminBot();

    server.close(() => {
      console.log('🔒 HTTP server closed');
    });

    process.exit(0);
  };

  // Global safety nets
  process.on('uncaughtException', (error) => {
    console.error('🚨 [CRITICAL UNCAUGHT EXCEPTION]:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 [CRITICAL UNHANDLED REJECTION AT]:', promise, 'REASON:', reason);
  });

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
