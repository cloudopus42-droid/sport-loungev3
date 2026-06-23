import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import path from 'path';
import fs from 'fs';

const router = Router();
const STATUS_PATH = path.resolve(__dirname, '../../agents/status.json');

const AGENT_IDS = ['cache-purger', 'health-checker', 'omni-fixer', 'webscout', 'bughunter'];

function readAllAgentStatuses() {
  try {
    const s = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
    const result: Record<string, any> = {};
    for (const id of AGENT_IDS) {
      if (s[id]) result[id] = s[id];
    }
    return result;
  } catch {
    return {};
  }
}

// GET /api/agents/status — Admin: get all agents' health
router.get('/status', auth, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = readAllAgentStatuses();
    res.json(agents);
  } catch (error) { next(error); }
});

// GET /api/agents/status/:agentId — Admin: get specific agent
router.get('/status/:agentId', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = readAllAgentStatuses();
    const agent = agents[req.params.agentId];
    if (!agent) {
      res.status(404).json({ error: 'Агент не найден' });
      return;
    }
    res.json(agent);
  } catch (error) { next(error); }
});

export default router;
