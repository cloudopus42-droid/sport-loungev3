import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

const router = Router();
const startTime = Date.now();

// GET /api/monitoring/health — server health check
router.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let dbConnected = false;
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      dbConnected = !error || error?.code === 'PGRST116';
    } catch {
      dbConnected = false;
    }

    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    res.json({
      status: 'ok',
      uptime: uptimeSeconds,
      uptimeHuman: formatUptime(uptimeSeconds),
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
        rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
      },
      dbConnected,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

export default router;
