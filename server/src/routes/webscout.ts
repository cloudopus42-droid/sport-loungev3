import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import path from 'path';
import fs from 'fs';

const router = Router();

const STATUS_PATH = path.resolve(__dirname, '../../agents/status.json');
const LOG_PATH = path.resolve(__dirname, '../../agents/agents/webscout/log.md');
const CONFIG_PATH = path.resolve(__dirname, '../../agents/agents/webscout/config.json');
const CACHE_DIR = path.resolve(__dirname, '../../agents/agents/webscout/cache');

function readStatus() {
  const def = { totalScrapes: 0, cacheHits: 0, cacheMisses: 0, errors: 0, cycle: 0, lastScan: '-', status: 'offline' };
  try {
    const s = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
    return s.webscout || def;
  } catch { return def; }
}

// GET /api/webscout/status
router.get('/status', auth, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const status = readStatus();
    let recentLog = '';
    try {
      if (fs.existsSync(LOG_PATH)) {
        recentLog = fs.readFileSync(LOG_PATH, 'utf-8').split('\n').filter(Boolean).slice(-30).join('\n');
      }
    } catch {}
    res.json({ ...status, recentLog });
  } catch (error) { next(error); }
});

const updateSchema = z.object({
  enabled: z.boolean(),
  rateLimitPerMin: z.number().min(1).max(120).optional(),
  cacheTtlMs: z.number().min(60000).optional(),
});

// PUT /api/webscout/status
router.put('/status', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = updateSchema.parse(req.body);
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    cfg.enabled = body.enabled;
    if (body.rateLimitPerMin) cfg.rateLimitPerMin = body.rateLimitPerMin;
    if (body.cacheTtlMs) cfg.cacheTtlMs = body.cacheTtlMs;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));

    try {
      const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
      if (!status.webscout) status.webscout = {};
      status.webscout.enabled = body.enabled;
      status.webscout.status = body.enabled ? 'idle' : 'disabled';
      fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));
    } catch {}

    res.json({ success: true, enabled: body.enabled });
  } catch (error) { next(error); }
});

// POST /api/webscout/clear-cache
router.post('/clear-cache', auth, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      for (const f of files) fs.unlinkSync(path.join(CACHE_DIR, f));
    }
    res.json({ success: true, cleared: true });
  } catch (error) { next(error); }
});

export default router;
