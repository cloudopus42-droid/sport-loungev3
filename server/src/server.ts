import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
import path from 'path';

// Load env FIRST before any other imports that depend on it
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import fs from 'fs';

import { config } from './config/env';
import { connectDB } from './config/db';
import { initSocket } from './socket';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Route imports
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import mixRoutes from './routes/mixes';
import promoRoutes from './routes/promos';
import storyRoutes from './routes/stories';
import invitationRoutes from './routes/invitations';
import bookingRoutes from './routes/bookings';
import showcaseRoutes from './routes/showcases';
import seatRoutes from './routes/seats';
import aiRoutes from './routes/ai';
import membershipRoutes from './routes/memberships';
import { startSupportBot } from './services/supportBot';

// Custom lightweight memory-based API Rate Limiter
const rateLimits: Record<string, { count: number; resetTime: number }> = {};

function rateLimitMiddleware(limit: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Convert array-type header back to simple string if needed
    const clientIp = Array.isArray(ip) ? ip[0] : ip;

    if (!rateLimits[clientIp] || rateLimits[clientIp].resetTime <= now) {
      rateLimits[clientIp] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }
    
    rateLimits[clientIp].count++;
    
    if (rateLimits[clientIp].count > limit) {
      res.status(429).json({
        error: 'Слишком много запросов. Пожалуйста, попробуйте позже.',
        status: 429,
      });
      return;
    }
    
    next();
  };
}

async function bootstrap(): Promise<void> {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Create Express app
  const app = express();

  // 3. Apply middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Allow Google Maps iframe
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: true, // Allow any origin (mobile access via IP)
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestLogger);

  // 4. Ensure uploads directory exists and serve static files
  const uploadsDir = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
  }

  app.use('/uploads', express.static(uploadsDir));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 5. Mount routes (with security rate limits applied on sensitive endpoints)
  app.use('/api/auth', rateLimitMiddleware(15, 60000), authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/mixes', mixRoutes);
  app.use('/api/promos', promoRoutes);
  app.use('/api/stories', storyRoutes);
  app.use('/api/invitations', invitationRoutes);
  app.use('/api/bookings', rateLimitMiddleware(10, 60000), bookingRoutes);
  app.use('/api/showcases', showcaseRoutes);
  app.use('/api/seats', seatRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/memberships', membershipRoutes);

  // 6. SPA fallback — serve client/dist/index.html for non-API routes
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  const indexHtmlPath = path.join(clientDistPath, 'index.html');

  if (fs.existsSync(indexHtmlPath)) {
    // Serve static files with custom cache control to prevent index.html cache lock
    app.use(express.static(clientDistPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || path.basename(filePath) === 'index.html') {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.sendFile(indexHtmlPath);
    });
    console.log('📄 Serving SPA from client/dist');
  }

  // 7. Error handler middleware (must be last)
  app.use(errorHandler);

  // 8. Create HTTP server and init Socket.IO
  const server = http.createServer(app);
  initSocket(server);

  // 9. Listen on PORT
  server.listen(config.port, () => {
    console.log(`\n🚀 SPORT LOUNGE Server running on port ${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   API: http://localhost:${config.port}/api`);
    console.log(`   Health: http://localhost:${config.port}/api/health\n`);

    // Start automated Telegram support bot
    try {
      startSupportBot();
    } catch (err: any) {
      console.error('❌ Failed to start support bot:', err.message);
    }
  });

  // 10. Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    server.close(() => {
      console.log('🔒 HTTP server closed');
    });

    // Supabase uses HTTP/REST via client, so there are no persistent database connections to close on exit.

    process.exit(0);
  };

  // Global safety nets for uncaught exceptions and unhandled promise rejections
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
