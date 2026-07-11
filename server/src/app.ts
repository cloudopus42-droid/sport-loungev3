import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
import path from 'path';

// Load env FIRST before any other imports that depend on it
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger';

import { Router } from 'express';
import { errorHandler } from './middleware/errorHandler';
import { errorMonitor } from './middleware/errorMonitor';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { logSwallowedError } from './utils/logError';

// Route imports
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import mixRoutes from './routes/mixes';
import promoRoutes from './routes/promos';
import storyRoutes from './routes/stories';
import invitationRoutes from './routes/invitations';
import bookingRoutes from './routes/bookings';
import showcaseRoutes from './routes/showcases';
import aiRoutes from './routes/ai';
import tobaccoRoutes from './routes/tobacco';
import knowledgeGraphRoutes from './routes/knowledge-graph';
import membershipRoutes from './routes/memberships';
import invoiceRoutes from './routes/invoices';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import restockRoutes from './routes/restock';
import smartFeaturesRoutes from './routes/smartFeatures';
import inventoryRoutes from './routes/inventory';
import menuRoutes from './routes/menu';
import { supabase } from './config/supabase';
import pagesRoutes from './routes/pages';
import telegramRoutes from './routes/telegram';
import adminLogRoutes from './routes/adminLog';

const app = express();

// Apply middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Encoding', 'ETag'],
  })
);

// Brotli/gzip compression with optimal settings
app.use(compression({
  level: 6,
  threshold: 256,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// ETag support for all API responses
app.set('etag', 'strong');

app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));
app.use(requestLogger);

// Serve static uploads (dirs created in server.ts bootstrap)
const uploadsDir = path.resolve(__dirname, '../uploads');

app.use('/uploads', express.static(uploadsDir, {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  },
}));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/api/auth/login', rateLimiter(10, 60000));
app.use('/api/auth/register', rateLimiter(5, 60000));
app.use('/api/auth/google', rateLimiter(10, 60000));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/mixes', mixRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/showcases', showcaseRoutes);
app.use('/api/ai', aiRoutes);

const flavorsRouter = Router();
flavorsRouter.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('mixes').select('id, name, flavor, is_active, price').eq('is_active', true).order('name');
    if (error) { logSwallowedError('flavors:list', error); res.json([]); return; }
    res.json((data || []).map((m: any) => ({ id: m.id, name: m.flavor || m.name, category: 'Основные', is_active: m.is_active !== false, price_value: m.price })));
  } catch (e) { next(e); }
});
app.use('/api/flavors', flavorsRouter);

app.use('/api/tobacco', tobaccoRoutes);
app.use('/api/knowledge-graph', knowledgeGraphRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restock', restockRoutes);
app.use('/api/smart-features', smartFeaturesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/admin/logs', adminLogRoutes);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// SPA fallback — serve client/dist/index.html for non-API routes
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const indexHtmlPath = path.join(clientDistPath, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(clientDistPath, {
    setHeaders: (res, filePath) => {
      const basename = path.basename(filePath);
      if (filePath.endsWith('.html') || basename === 'index.html') {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      } else if (basename === 'sw.js' || basename === 'version.json') {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
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

// Error monitor middleware (captures errors before final handler)
app.use(errorMonitor);

// Error handler middleware (must be last)
app.use(errorHandler);

export { app };
