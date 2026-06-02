import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Activity, Box, Database, Zap, Settings, Command
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import { showToast } from '@/components/NotificationToast';

type Mix = any;

const LIQUID_BASES = [
  { id: 'water', name: 'На воде', price: 0, desc: 'Классическая фильтрация' },
  { id: 'milk', name: 'На молоке', price: 150, desc: 'Плотный пар' },
  { id: 'juice', name: 'На соке', price: 200, desc: 'Фруктовые ноты' },
  { id: 'wine', name: 'На вине', price: 450, desc: 'Особая ароматика' },
];

const TABLE_OPTIONS = [
  'Стол 1', 'Стол 2', 'Стол 3', 'VIP Кабинет 1', 'Игровая Зона 1'
];

export function BookingPage() {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  
  const [selectedMix, setSelectedMix] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [liquidBase, setLiquidBase] = useState('water');
  const [specialNotes, setSpecialNotes] = useState('');
  const [seatLabel, setSeatLabel] = useState(TABLE_OPTIONS[0]);

  const [masterCalled, setMasterCalled] = useState(false);

  const [timeText, setTimeText] = useState('15:00');
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    setLoading(true);
    api.get<Mix[]>('/api/mixes')
      .then(res => setMixes(res.data || []))
      .catch(() => showToast('Ошибка сети', 'error'))
      .finally(() => setLoading(false));

    const savedOrderId = localStorage.getItem('current_order_id');
    if (savedOrderId && isAuthenticated) {
      fetchOrderStatus(savedOrderId);
    }

    try {
      const saved = localStorage.getItem('my_saved_mix');
      if (saved) {
        // Do something if needed
      }
    } catch (e) {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:updated', (data: any) => {
      const savedId = localStorage.getItem('current_order_id');
      if (data && data.id === savedId) {
        setActiveOrder(data);
        if (data.status === 'done') showToast('Ваш заказ готов!', 'success');
      }
    });
    return () => { socket.off('order:updated'); };
  }, [socket]);

  useEffect(() => {
    if (!activeOrder) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }
    const tick = () => {
      const diff = new Date(activeOrder.promisedDeliveryTime).getTime() - Date.now();
      if (activeOrder.status === 'done') {
        setTimeText('COMPLETED');
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        return;
      }
      if (diff <= 0) setTimeText('DELAYED...');
      else {
        const m = Math.floor(diff / 1000 / 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeText(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    };
    tick();
    timerIntervalRef.current = setInterval(tick, 1000);
    const pollInterval = setInterval(() => fetchOrderStatus(activeOrder.id), 8000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      clearInterval(pollInterval);
    };
  }, [activeOrder]);

  const fetchOrderStatus = (id: string) => {
    api.get(`/api/orders/${id}/status`)
      .then(res => setActiveOrder(res.data))
      .catch(() => {
        localStorage.removeItem('current_order_id');
        setActiveOrder(null);
      });
  };

  const handleMixSelect = (mix: Mix) => {
    if (!isAuthenticated) { showToast('Авторизуйтесь', 'error'); return; }
    setSelectedMix(mix);
    setShowConfirmModal(true);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMix) return;
    setLoading(true);
    try {
      const isCustom = selectedMix.isCustom;
      const res = await api.post('/api/orders', {
        mix_id: isCustom ? null : selectedMix.id,
        liquid_id: liquidBase,
        notes: specialNotes,
        seat_id: seatLabel.replace(/\s+/g, '-').toLowerCase(),
        seat_label: seatLabel,
        seat_zone: 'hall',
      });
      setActiveOrder(res.data);
      localStorage.setItem('current_order_id', res.data.id);
      setShowConfirmModal(false);
      showToast('Заказ принят!', 'success');
    } catch (err) {
      showToast('Ошибка', 'error');
    } finally { setLoading(false); }
  };

  const handleCallMaster = async () => {
    if (!activeOrder) return;
    setLoading(true);
    try {
      await api.post(`/api/orders/${activeOrder.id}/request-master`);
      setMasterCalled(true);
      showToast('Мастер вызван', 'success');
    } catch (err) {
      showToast('Ошибка вызова', 'error');
    } finally { setLoading(false); }
  };

  // Helper mapping stages progress
  const stages = [
    { id: 'accepted', label: 'Accepted', desc: 'System Initialized' },
    { id: 'preparing', label: 'Processing', desc: 'Material Selection' },
    { id: 'roasting', label: 'Compiling', desc: 'Thermal Activation' },
    { id: 'delivering', label: 'Deploying', desc: 'Transit to Zone' },
    { id: 'done', label: 'Active', desc: 'Session Running' },
  ];

  return (
    <div className="relative min-h-[90vh] bg-[#030108] text-white overflow-hidden rounded-[2rem] border border-[#a855f7]/20 shadow-[0_0_80px_rgba(168,85,247,0.15)] flex flex-col md:flex-row mb-20 font-sans">
      
      {/* Abstract Map Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Stylized World/Network Map Nodes */}
          <g stroke="rgba(168,85,247,0.5)" strokeWidth="1" fill="none">
            <circle cx="20%" cy="30%" r="4" fill="#a855f7" className="animate-pulse" />
            <circle cx="45%" cy="60%" r="6" fill="#a855f7" className="animate-pulse" style={{animationDelay: '1s'}} />
            <circle cx="70%" cy="40%" r="3" fill="#a855f7" className="animate-pulse" style={{animationDelay: '0.5s'}} />
            <circle cx="80%" cy="80%" r="5" fill="#a855f7" className="animate-pulse" style={{animationDelay: '1.5s'}} />
            <path d="M 20% 30% L 45% 60% L 70% 40% L 80% 80%" strokeDasharray="4,4" className="animate-[dash_20s_linear_infinite]" />
          </g>
        </svg>
      </div>

      {/* Radial Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#a855f7] opacity-[0.07] blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#4c1d95] opacity-[0.1] blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-[280px] border-r border-[#a855f7]/10 bg-[#06020c]/60 backdrop-blur-2xl p-6 flex flex-col z-10 relative">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a855f7] to-[#4c1d95] flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            <Command className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-widest text-sm uppercase">NEXUS Core</span>
        </div>

        <nav className="space-y-2 flex-1">
          {[
            { icon: Activity, label: 'Dashboard', active: true },
            { icon: Box, label: 'Products' },
            { icon: Database, label: 'Analytics' },
            { icon: Zap, label: 'Developers' },
          ].map((item, i) => (
            <button key={i} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active ? 'bg-[#a855f7]/15 text-white border border-[#a855f7]/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}>
              <item.icon className={`w-4 h-4 ${item.active ? 'text-[#a855f7]' : ''}`} />
              <span className="text-xs font-semibold tracking-wide uppercase">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-[#a855f7]/10">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:text-white transition-all">
            <Settings className="w-4 h-4" />
            <span className="text-xs font-semibold tracking-wide uppercase">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <main className="flex-1 p-6 lg:p-10 z-10 relative flex flex-col h-full overflow-y-auto custom-scrollbar">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-light tracking-tight mb-2">Cross-Border <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#a855f7] to-[#d946ef]">Finance</span></h1>
            <p className="text-white/40 text-sm tracking-wide">Manage your global transactions and infrastructure.</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="px-4 py-2 rounded-full border border-[#a855f7]/20 bg-[#a855f7]/5 text-xs font-mono text-[#a855f7]">STATUS: ONLINE</div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Left Column: Mixes (Products) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Available Modules</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mixes.map((mix, idx) => (
                <motion.div
                  key={mix.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative p-5 rounded-2xl bg-[#0a0514]/80 border border-[#a855f7]/20 hover:border-[#a855f7]/50 transition-all cursor-pointer backdrop-blur-md overflow-hidden"
                  onClick={() => handleMixSelect(mix)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#a855f7]/10 flex items-center justify-center border border-[#a855f7]/20">
                        <Database className="w-4 h-4 text-[#a855f7]" />
                      </div>
                      <span className="text-xs font-mono text-white/30 group-hover:text-[#a855f7]/80 transition-colors">{mix.strength}/10</span>
                    </div>
                    <h4 className="font-bold text-sm tracking-wide mb-1">{mix.name}</h4>
                    <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{mix.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: Active Order (System Status) */}
          <div className="lg:col-span-5 h-full">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">System Telemetry</h3>
            
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0a0514] to-[#06020c] border border-[#a855f7]/20 relative overflow-hidden h-full min-h-[400px]">
              {/* Decorative circuit lines */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMjAgTDIwIDIwIEwyMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDE2OCwgODUsIDI0NywgMC4yKSIvPjwvc3ZnPg==')] opacity-50"></div>

              {!activeOrder ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
                  <Activity className="w-12 h-12 text-[#a855f7]" />
                  <p className="text-xs uppercase tracking-widest font-bold">No Active Operations</p>
                  <p className="text-[10px] text-white/40 max-w-[200px]">Select a module from the left to deploy a new instance.</p>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <p className="text-[10px] text-[#a855f7] uppercase tracking-widest font-bold mb-1">Time to deployment</p>
                      <h2 className="text-4xl font-mono font-light tracking-tighter">{timeText}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Target Node</p>
                      <p className="text-sm font-bold uppercase">{activeOrder.seatLabel}</p>
                    </div>
                  </div>

                  <div className="flex-1 relative pl-2 space-y-6">
                    <div className="absolute left-[20px] top-4 bottom-4 w-px bg-gradient-to-b from-[#a855f7] to-transparent"></div>
                    
                    {stages.map((stage, idx) => {
                      const stagesList = stages.map(s => s.id);
                      const currentIdx = stagesList.indexOf(activeOrder.status);
                      const targetIdx = idx;
                      const isCompleted = currentIdx > targetIdx;
                      const isActive = currentIdx === targetIdx;
                      
                      return (
                        <div key={stage.id} className={`flex items-start gap-4 relative transition-all duration-500 ${isCompleted || isActive ? 'opacity-100' : 'opacity-30'}`}>
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#0a0514] z-10 ${isActive ? 'border-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.5)]' : isCompleted ? 'border-[#a855f7] text-[#a855f7]' : 'border-white/20 text-white/20'}`}>
                            {isCompleted ? <Check className="w-3 h-3" /> : <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#a855f7] animate-pulse' : 'bg-transparent'}`}></div>}
                          </div>
                          <div className="pt-1.5">
                            <h5 className={`text-xs uppercase tracking-widest font-bold ${isActive ? 'text-[#a855f7]' : 'text-white'}`}>{stage.label}</h5>
                            <p className="text-[10px] text-white/40 mt-1 font-mono">{stage.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button 
                    onClick={handleCallMaster}
                    disabled={masterCalled}
                    className="mt-6 w-full py-3 rounded-xl border border-[#a855f7]/30 bg-[#a855f7]/10 hover:bg-[#a855f7]/20 text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    {masterCalled ? 'Support Ticket Opened' : 'Request Manual Override'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && selectedMix && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0a0514] border border-[#a855f7]/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-[#a855f7] to-transparent opacity-50"></div>
              
              <h3 className="text-lg font-light tracking-wide mb-6">Deploy Instance: <span className="font-bold text-[#a855f7]">{selectedMix.name}</span></h3>
              
              <form onSubmit={handleOrderSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Target Node (Table)</label>
                  <select value={seatLabel} onChange={e => setSeatLabel(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-[#a855f7] focus:outline-none transition-colors">
                    {TABLE_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-[#0a0514]">{opt}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Base Framework</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LIQUID_BASES.map(base => (
                      <button
                        key={base.id} type="button" onClick={() => setLiquidBase(base.id)}
                        className={`text-left p-3 rounded-xl border transition-all ${liquidBase === base.id ? 'border-[#a855f7] bg-[#a855f7]/10' : 'border-white/10 hover:border-white/30'}`}
                      >
                        <div className="text-xs font-bold">{base.name}</div>
                        <div className="text-[9px] text-white/40 mt-1">{base.price > 0 ? `+${base.price} ₽` : 'Included'}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Configuration Flags</label>
                  <textarea value={specialNotes} onChange={e => setSpecialNotes(e.target.value)} placeholder="Enter custom parameters..." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs h-20 resize-none focus:border-[#a855f7] focus:outline-none transition-colors" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition-all">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all">
                    {loading ? 'Processing...' : 'Deploy'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.4); }
        @keyframes dash { to { stroke-dashoffset: -100; } }
      `}</style>
    </div>
  );
}
