import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);


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

import rateLimit from 'express-rate-limit';

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Пожалуйста, попробуйте позже.', status: 429 },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов к auth. Попробуйте позже.', status: 429 },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много загрузок. Попробуйте позже.', status: 429 },
});

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
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/mixes', mixRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/bookings', generalLimiter, bookingRoutes);
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
