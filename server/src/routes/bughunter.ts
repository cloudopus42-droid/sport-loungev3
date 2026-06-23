import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import path from 'path';
import fs from 'fs';

const router = Router();

interface BugHunterStatus {
  enabled: boolean;
  active: boolean;
  cycle: number;
  found: number;
  fixed: number;
  escalated: number;
  lastScan: string;
  daemonPid: number | null;
  logSize: number;
}

const STATUS_PATH = path.resolve(__dirname, '../../agents/status.json');
const LOG_PATH = path.resolve(__dirname, '../../agents/agents/bughunter/log.md');
const CONFIG_PATH = path.resolve(__dirname, '../../agents/agents/bughunter/config.json');

function readAgentStatus(): BugHunterStatus {
  const defaultStatus: BugHunterStatus = {
    enabled: false,
    active: false,
    cycle: 0,
    found: 0,
    fixed: 0,
    escalated: 0,
    lastScan: '-',
    daemonPid: null,
    logSize: 0,
  };

  try {
    // Read config for enabled
    let enabled = false;
    try {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      enabled = cfg.enabled ?? false;
    } catch {}

    // Read status
    const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
    const bh = status.bughunter || {};
    return {
      enabled,
      active: bh.status === 'working' || bh.status === 'idle',
      cycle: bh.cycle ?? 0,
      found: bh.found ?? 0,
      fixed: bh.fixed ?? 0,
      escalated: bh.escalated ?? 0,
      lastScan: bh.lastScan ?? '-',
      daemonPid: bh.pid ?? null,
      logSize: 0,
    };
  } catch {
    return defaultStatus;
  }
}

// GET /api/bughunter/status — Admin: get BugHunter agent status
router.get('/status', auth, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const status = readAgentStatus();

    // Get log size
    try {
      if (fs.existsSync(LOG_PATH)) {
        status.logSize = fs.statSync(LOG_PATH).size;
      }
    } catch {}

    // Get recent log entries (last 20 lines)
    let recentLog = '';
    try {
      if (fs.existsSync(LOG_PATH)) {
        const content = fs.readFileSync(LOG_PATH, 'utf-8');
        const lines = content.split('\n').filter(Boolean);
        const lastLines = lines.slice(-30).join('\n');
        recentLog = lastLines;
      }
    } catch {}

    // Check if daemon is actually running (via status.json presence + bg agent)
    const { data: feature } = await supabase
      .from('smart_features')
      .select('enabled, config')
      .eq('feature_key', 'bughunter_agent')
      .single();

    res.json({
      ...status,
      featureEnabled: feature?.enabled ?? false,
      config: feature?.config ?? {},
      recentLog,
    });
  } catch (error) {
    next(error);
  }
});

const updateConfigSchema = z.object({
  enabled: z.boolean(),
  scanIntervalMs: z.number().min(10000).max(600000).optional(),
  confidenceThreshold: z.number().min(50).max(100).optional(),
});

// PUT /api/bughunter/status — Admin: toggle agent on/off
router.put('/status', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = updateConfigSchema.parse(req.body);

    // Update local config
    try {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      cfg.enabled = body.enabled;
      if (body.scanIntervalMs) cfg.scanIntervalMs = body.scanIntervalMs;
      if (body.confidenceThreshold) cfg.confidenceThreshold = body.confidenceThreshold;
      cfg.updatedAt = new Date().toISOString();
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
    } catch (err: any) {
      res.status(500).json({ error: 'Не удалось обновить конфиг агента', detail: err.message });
      return;
    }

    // Update feature flag in DB
    const { data: feature } = await supabase
      .from('smart_features')
      .select('id')
      .eq('feature_key', 'bughunter_agent')
      .single();

    if (feature) {
      await supabase
        .from('smart_features')
        .update({ enabled: body.enabled, updated_at: new Date().toISOString() })
        .eq('id', feature.id);
    }

    // Update agent status
    try {
      const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
      if (!status.bughunter) status.bughunter = {};
      status.bughunter.enabled = body.enabled;
      status.bughunter.status = body.enabled ? 'idle' : 'disabled';
      status.bughunter.lastScan = timestamp();
      fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));
    } catch {}

    res.json({ success: true, enabled: body.enabled });
  } catch (error) {
    next(error);
  }
});

// GET /api/bughunter/log — Admin: get full log
router.get('/log', auth, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!fs.existsSync(LOG_PATH)) {
      res.json({ log: '', size: 0 });
      return;
    }
    const content = fs.readFileSync(LOG_PATH, 'utf-8');
    res.json({ log: content, size: content.length });
  } catch (error) {
    next(error);
  }
});

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 16);
}

export default router;
