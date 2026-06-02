import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
import path from 'path';

// Load env FIRST before any other imports that depend on it
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger';

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
import invoiceRoutes from './routes/invoices';
import orderRoutes from './routes/orders';

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

const app = express();

// Apply middleware
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

// Ensure uploads directory exists and serve static files
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
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
app.use('/api/invoices', invoiceRoutes);
app.use('/api/orders', orderRoutes);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// SPA fallback — serve client/dist/index.html for non-API routes
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const indexHtmlPath = path.join(clientDistPath, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(clientDistPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html') || path.basename(filePath) === 'index.html') {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.sendFile(indexHtmlPath);
  });
}

// Error handler middleware (must be last)
app.use(errorHandler);

export { app };
