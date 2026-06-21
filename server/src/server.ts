import dotenv from 'dotenv';
import path from 'path';

// Load env FIRST before any other imports
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import http from 'http';
import { app } from './app';
import { config } from './config/env';
import { connectDB } from './config/db';
import { initSocket } from './socket';
import { startSupportBot } from './services/supportBot';
import { startOrderScheduler } from './services/orderScheduler';
import { seedSmartFeatures } from './routes/smartFeatures';

async function bootstrap(): Promise<void> {
  // 1. Connect to Database
  await connectDB();

  // 2. Seed smart features
  await seedSmartFeatures();

  // 3. Create HTTP server and init Socket.IO
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
        startSupportBot();
      } catch (err: any) {
        console.error('❌ Failed to start support bot:', err.message);
      }
    } else {
      console.log('🤖 [Support Bot] Disabled in development (set SUPPORT_BOT_ENABLED=true to run locally)');
    }

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
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

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
