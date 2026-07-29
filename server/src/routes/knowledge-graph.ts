import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: nodes, error: nodesError } = await supabase
      .from('knowledge_nodes')
      .select('*')
      .order('title');

    if (nodesError) { res.status(500).json({ error: nodesError.message }); return; }

    const { data: edges, error: edgesError } = await supabase
      .from('knowledge_edges')
      .select('*');

    if (edgesError) { res.status(500).json({ error: edgesError.message }); return; }

    res.json({ nodes: nodes || [], edges: edges || [] });
  } catch (e) { next(e); }
});

router.get('/node/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: node, error } = await supabase
      .from('knowledge_nodes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) { res.status(404).json({ error: 'Node not found' }); return; }
    res.json(node);
  } catch (e) { next(e); }
});

router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      res.json([]);
      return;
    }

    const { data, error } = await supabase
      .from('knowledge_nodes')
      .select('*')
      .ilike('title', `%${query}%`)
      .order('title');

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (e) { next(e); }
});

router.post('/sync', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nodes, edges } = req.body;
    if (!Array.isArray(nodes)) {
      res.status(400).json({ error: 'nodes array required' });
      return;
    }

    const { error: deleteNodes } = await supabase.from('knowledge_nodes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteNodes) { res.status(500).json({ error: deleteNodes.message }); return; }

    if (nodes.length > 0) {
      const { error: insertNodes } = await supabase.from('knowledge_nodes').insert(nodes);
      if (insertNodes) { res.status(500).json({ error: insertNodes.message }); return; }
    }

    if (Array.isArray(edges) && edges.length > 0) {
      const { error: deleteEdges } = await supabase.from('knowledge_edges').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteEdges) { res.status(500).json({ error: deleteEdges.message }); return; }

      const { error: insertEdges } = await supabase.from('knowledge_edges').insert(edges);
      if (insertEdges) { res.status(500).json({ error: insertEdges.message }); return; }
    }

    res.json({ success: true, nodesCount: nodes.length });
  } catch (e) { next(e); }
});

export default router;
