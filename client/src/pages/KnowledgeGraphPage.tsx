import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Network, ExternalLink } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import api from '@/lib/api';

type Node = {
  id: string;
  title: string;
  content: string;
  path: string;
  node_type: string;
  tags: string[];
};

type Edge = {
  id: string;
  source_id: string;
  target_id: string;
  relationship: string;
};

type GraphData = {
  nodes: Node[];
  edges: Edge[];
};

const NODE_COLORS: Record<string, string> = {
  note: '#a78bfa',
  tag: '#22c55e',
  concept: '#3b82f6',
  product: '#f59e0b',
  recipe: '#ef4444',
};

export function KnowledgeGraphPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    api.get<GraphData>('/api/knowledge-graph')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredNodes = data?.nodes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const renderGraph = useCallback(() => {
    if (!data || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const nodePositions: Record<string, { x: number; y: number }> = {};
    const centerX = w / 2;
    const centerY = h / 2;

    data.nodes.forEach((node, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      const radius = Math.min(w, h) * 0.3;
      nodePositions[node.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });

    ctx.clearRect(0, 0, w, h);

    data.edges.forEach(edge => {
      const source = nodePositions[edge.source_id];
      const target = nodePositions[edge.target_id];
      if (!source || !target) return;
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    data.nodes.forEach(node => {
      const pos = nodePositions[node.id];
      if (!pos) return;
      const radius = node.id === selectedNode?.id ? 8 : 5;
      const color = NODE_COLORS[node.node_type] || '#a78bfa';

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (node.id === selectedNode?.id) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(node.title, pos.x + radius + 4, pos.y + 3);
    });
  }, [data, selectedNode]);

  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  useEffect(() => {
    const handleResize = () => renderGraph();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderGraph]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-6 max-w-6xl mx-auto space-y-6"
    >
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-accent-gold font-bold flex items-center justify-center gap-1.5">
          <Network className="w-4 h-4" /> БАЗА ЗНАНИЙ
        </span>
        <h1 className="text-3xl font-display font-light text-white uppercase tracking-wider">
          Knowledge <span className="gradient-text font-semibold italic">Graph</span>
        </h1>
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по узлам графа..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-glass-border/60 text-sm text-white placeholder:text-white/30 focus:border-accent-gold/40 focus:outline-none transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="w-6 h-6 rounded-full border-2 border-accent-gold border-t-transparent animate-spin" />
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="w-full h-[400px] cursor-pointer"
                onClick={(e) => {
                  if (!data) return;
                  const rect = canvasRef.current!.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;

                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;
                  let closest: Node | null = null;
                  let closestDist = Infinity;

                  data.nodes.forEach((node, i) => {
                    const angle = (i / data.nodes.length) * Math.PI * 2;
                    const radius = Math.min(rect.width, rect.height) * 0.3;
                    const nx = centerX + Math.cos(angle) * radius;
                    const ny = centerY + Math.sin(angle) * radius;
                    const dist = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2);
                    if (dist < 15 && dist < closestDist) {
                      closestDist = dist;
                      closest = node;
                    }
                  });

                  setSelectedNode(closest);
                }}
              />
            )}
          </GlassCard>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
          <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
            {search ? `Найдено: ${filteredNodes.length}` : `Всего узлов: ${data?.nodes.length || 0}`}
          </p>
          {filteredNodes.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => setSelectedNode(node)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedNode?.id === node.id
                  ? 'border-accent-gold/40 bg-accent-gold/5'
                  : 'border-glass-border/20 bg-white/[0.02] hover:border-accent-gold/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: NODE_COLORS[node.node_type] || '#a78bfa' }}
                />
                <p className="text-xs font-semibold text-white truncate">{node.title}</p>
              </div>
              <p className="text-[10px] text-white/40 mt-1 line-clamp-2">{node.content}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {selectedNode && (
        <GlassCard className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: NODE_COLORS[selectedNode.node_type] || '#a78bfa' }}
                />
                <h3 className="text-lg font-bold text-white">{selectedNode.title}</h3>
              </div>
              <span className="text-[10px] text-white/40 uppercase tracking-wider mt-1 block">
                {selectedNode.node_type} {selectedNode.tags?.length ? `• ${selectedNode.tags.join(', ')}` : ''}
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-white/30" />
          </div>
          <p className="text-sm text-white/60 whitespace-pre-wrap">{selectedNode.content}</p>
        </GlassCard>
      )}
    </motion.div>
  );
}
