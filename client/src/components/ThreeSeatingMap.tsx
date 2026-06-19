import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, Gamepad2, Crown, Zap, Sparkles, 
  ArrowLeft, Users, Check
} from 'lucide-react';
import { SEATS, ZONE_COLORS, ZONE_LABELS } from '@/config/seats';
import type { Seat } from '@/types';

// Centers and transforms for zoom-to-zone transitions
const ZONE_TRANSFORMS: Record<string, { scale: number; x: number; y: number; rotateX: number; rotateY: number }> = {
  overview: { scale: 1, x: 0, y: 0, rotateX: 0, rotateY: 0 },
  hall: { scale: 1.6, x: -22, y: 15, rotateX: 0, rotateY: 0 },
  vip: { scale: 3.5, x: 38, y: -22, rotateX: 0, rotateY: 0 },
  ps: { scale: 2.2, x: -22, y: -12, rotateX: 0, rotateY: 0 },
  room: { scale: 3.5, x: 38, y: -34, rotateX: 0, rotateY: 0 },
  pro: { scale: 2.8, x: 18, y: -26, rotateX: 0, rotateY: 0 },
  oled: { scale: 3.2, x: 10, y: -36, rotateX: 0, rotateY: 0 }
};

interface ZonePlate {
  id: string;
  label: string;
  left: string;
  top: string;
  width: string;
  height: string;
  color: string;
  icon: React.ReactNode;
}

const ZONES_LIST: ZonePlate[] = [
  { 
    id: 'hall', 
    label: 'Общий зал', 
    left: '52%', top: '2%', width: '46%', height: '48%', 
    color: '#00f2fe',
    icon: <Monitor className="w-5 h-5 text-[#00f2fe]" /> 
  },
  { 
    id: 'vip', 
    label: 'VIP PS', 
    left: '1%', top: '65%', width: '20%', height: '15%', 
    color: '#d4af37',
    icon: <Crown className="w-5 h-5 text-[#d4af37] animate-pulse" /> 
  },
  { 
    id: 'ps', 
    label: 'PS5 2этаж', 
    left: '52%', top: '53%', width: '46%', height: '22%', 
    color: '#3b82f6',
    icon: <Gamepad2 className="w-5 h-5 text-[#3b82f6]" /> 
  },
  { 
    id: 'room', 
    label: 'PS + ПК', 
    left: '1%', top: '81%', width: '20%', height: '17%', 
    color: '#d4af37',
    icon: <Gamepad2 className="w-5 h-5 text-[#d4af37]" /> 
  },
  { 
    id: 'pro', 
    label: 'PRO 600Hz', 
    left: '22%', top: '71%', width: '28%', height: '13%', 
    color: '#6366f1',
    icon: <Zap className="w-5 h-5 text-[#6366f1]" /> 
  },
  { 
    id: 'oled', 
    label: 'OLED 4K', 
    left: '22%', top: '85%', width: '28%', height: '13%', 
    color: '#06b6d4',
    icon: <Sparkles className="w-5 h-5 text-[#06b6d4]" /> 
  }
];

interface ThreeSeatingMapProps {
  selectedSeat: Seat | null;
  setSelectedSeat: (seat: Seat | null) => void;
  isSeatBooked: (id: string) => boolean;
}

export function ThreeSeatingMap({ selectedSeat, setSelectedSeat, isSeatBooked }: ThreeSeatingMapProps) {
  const [activeZone, setActiveZone] = useState<string>('overview');
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

  // Sync selected seat's zone to activeZone for focus
  useEffect(() => {
    if (selectedSeat && activeZone === 'overview') {
      setActiveZone(selectedSeat.zone);
    }
  }, [selectedSeat]);

  const handleZoneClick = (zoneId: string) => {
    setActiveZone(zoneId);
  };

  const handleSeatClick = (seat: Seat) => {
    const booked = isSeatBooked(seat.id);
    if (booked) return;

    // Select/deselect seat immediately from anywhere (including general overview)
    setSelectedSeat(selectedSeat?.id === seat.id ? null : seat);

    if (activeZone === 'overview') {
      setActiveZone(seat.zone);
    }
  };

  return (
    <div className="space-y-4">
      {/* Zone selection controls */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-white/5 border border-glass-border/30 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveZone('overview')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeZone === 'overview'
              ? 'bg-accent-gold text-black shadow-glow-gold'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          🗺️ Общий обзор
        </button>
        {Object.entries(ZONE_LABELS).map(([zone, label]) => (
          <button
            key={zone}
            type="button"
            onClick={() => setActiveZone(zone)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              activeZone === zone
                ? 'bg-white/10 text-white border-accent-gold/40 shadow-sm'
                : 'text-white/50 border-transparent hover:text-white/80 hover:bg-white/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main 2.5D Holographic Map Frame */}
      <div className="relative w-full aspect-[16/10] bg-[#08060e] rounded-3xl border border-glass-border/40 overflow-hidden shadow-[inset_0_4px_32px_rgba(0,0,0,0.95)] perspective-1000">
        
        {/* Holographic grids / lines in background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:3%_5%] pointer-events-none z-0" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-transparent to-black/85 pointer-events-none z-0" />

        {/* 2.5D Animated Map Container */}
        <motion.div
          className="w-full h-full relative transform-style-3d origin-center"
          animate={{
            scale: ZONE_TRANSFORMS[activeZone]?.scale || 1,
            x: `${ZONE_TRANSFORMS[activeZone]?.x || 0}%`,
            y: `${ZONE_TRANSFORMS[activeZone]?.y || 0}%`,
            rotateX: ZONE_TRANSFORMS[activeZone]?.rotateX || 0,
            rotateY: ZONE_TRANSFORMS[activeZone]?.rotateY || 0,
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          {/* Floor outline walls (decorative isometric look) */}
          <div className="absolute inset-[3%] border border-white/[0.03] rounded-3xl pointer-events-none z-0" />
          
          {/* Zone Floor Plates */}
          {ZONES_LIST.map((zone) => {
            const isOverview = activeZone === 'overview';
            const isHovered = hoveredZone === zone.id;

            return (
              <div
                key={zone.id}
                style={{
                  position: 'absolute',
                  left: zone.left,
                  top: zone.top,
                  width: zone.width,
                  height: zone.height,
                }}
                className="z-10 group"
              >
                {/* Visual zone rectangle */}
                <motion.div
                  onClick={() => isOverview && handleZoneClick(zone.id)}
                  onMouseEnter={() => isOverview && setHoveredZone(zone.id)}
                  onMouseLeave={() => isOverview && setHoveredZone(null)}
                  className={`w-full h-full rounded-2xl border transition-all duration-300 relative flex flex-col items-center justify-center p-3 select-none ${
                    isOverview
                      ? 'cursor-pointer bg-white/[0.01] hover:bg-white/[0.04]'
                      : 'pointer-events-none border-transparent bg-transparent'
                  }`}
                  animate={{
                    borderColor: isOverview
                      ? isHovered
                        ? '#d4af37'
                        : zone.color + '40'
                      : 'rgba(255,255,255,0.02)',
                    boxShadow: isOverview && isHovered
                      ? `0 0 15px ${zone.color}25`
                      : 'none',
                  }}
                >
                  {/* Neon indicator dots in corner */}
                  {isOverview && (
                    <div className="absolute top-2.5 right-2.5 flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: zone.color }} />
                    </div>
                  )}

                  {/* Room labels inside overview */}
                  <AnimatePresence>
                    {isOverview && (
                      <motion.div 
                        className="flex flex-col items-center gap-1.5 text-center pointer-events-none"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-md">
                          {zone.icon}
                        </div>
                        <h4 className="text-[10px] font-bold text-white tracking-wide uppercase mt-1">{zone.label}</h4>
                        <span className="text-[8px] text-white/40">{ZONE_LABELS[zone.id]}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            );
          })}

          {/* Seat Layout (Desks / Couches) */}
          {SEATS.map((seat) => {
            const booked = isSeatBooked(seat.id);
            const selected = selectedSeat?.id === seat.id;
            const inActiveZone = activeZone === seat.zone;
            const isOverview = activeZone === 'overview';

            // Show and allow interaction if it's in the zoomed-in zone, or keep dimmed in overview
            const displayMode = isOverview ? 'overview' : inActiveZone ? 'active' : 'dimmed';
            
            if (displayMode === 'dimmed') return null;

            const zoneConfig = ZONE_COLORS[seat.zone] || { text: '#FFFFFF', bg: 'rgba(255,255,255,0.1)' };
            const isPs = seat.id.includes('ps') || seat.zone === 'vip' || seat.zone === 'ps' || seat.id.includes('room-ps');

            return (
              <motion.button
                key={seat.id}
                onClick={() => handleSeatClick(seat)}
                onMouseEnter={() => setHoveredSeat(seat)}
                onMouseLeave={() => setHoveredSeat(null)}
                style={{
                  position: 'absolute',
                  left: `${seat.x}%`,
                  top: `${seat.y}%`,
                  width: `${seat.width}%`,
                  height: `${seat.height}%`,
                }}
                className={`absolute z-20 flex flex-col items-center justify-center rounded-xl border text-[9px] font-bold transition-all transform -translate-x-1/2 -translate-y-1/2 shadow-lg ${
                  booked
                    ? 'bg-[#1e0a0a]/80 border-red-500/25 text-red-500/30 cursor-not-allowed'
                    : selected
                    ? 'bg-[#1a0f07] border-[#d4af37] text-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)] z-30 scale-105'
                    : 'bg-[#100e17]/95 text-white/60 hover:text-white'
                }`}
                animate={{
                  borderColor: booked
                    ? 'rgba(239, 68, 68, 0.2)'
                    : selected
                    ? '#d4af37'
                    : displayMode === 'overview'
                    ? zoneConfig.text + '30'
                    : zoneConfig.text + '70',
                  scale: selected ? 1.06 : hoveredSeat?.id === seat.id && !booked ? 1.04 : 1,
                  boxShadow: selected
                    ? '0 0 15px rgba(212,175,55,0.25)'
                    : hoveredSeat?.id === seat.id && !booked
                    ? `0 0 12px ${zoneConfig.text}25`
                    : 'none',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                {/* Interactive visual layout inside seat box */}
                <div className="w-full h-full flex flex-col items-center justify-center px-1 overflow-hidden relative">
                  
                  {/* Subtle pulsing background for selected seat */}
                  {selected && (
                    <span className="absolute inset-0 bg-yellow-500/5 animate-pulse rounded-xl" />
                  )}

                  {/* Hardware Icon */}
                  {displayMode !== 'overview' && (
                    <div className="opacity-80 scale-95 mb-0.5">
                      {isPs ? <Gamepad2 className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                    </div>
                  )}

                  {/* Seat Label */}
                  <span className="truncate max-w-full tracking-wide">
                    {displayMode === 'overview' ? seat.label.replace('ПК ', '').replace('PS5 ', '') : seat.label}
                  </span>

                  {/* Seat Capacity (only in zoomed mode) */}
                  {displayMode !== 'overview' && (
                    <span className="text-[7px] text-white/40 font-normal mt-0.5 flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5" /> {seat.capacity}
                    </span>
                  )}
                  
                  {/* Selected checkmark */}
                  {selected && (
                    <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#d4af37] flex items-center justify-center text-black">
                      <Check className="w-1.5 h-1.5 stroke-[4]" />
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Floating spatial UI overlay */}
        <div className="absolute top-4 left-4 pointer-events-none select-none z-30">
          <div className="text-[9px] tracking-[0.2em] text-accent-gold font-bold bg-black/60 border border-white/5 px-2 py-0.5 rounded-md backdrop-blur-md w-fit">
            SPORT LOUNGE DIGITAL TWIN
          </div>
          <h2 className="text-base font-display font-bold text-white mt-1.5 drop-shadow-md">
            {activeZone === 'overview' ? 'Общий план зала' : ZONE_LABELS[activeZone]}
          </h2>
          {hoveredSeat ? (
            <div className="text-[10px] text-white/50 mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ZONE_COLORS[hoveredSeat.zone].text }} />
              <span>Наведение: <strong className="text-white">{hoveredSeat.label}</strong> (до {hoveredSeat.capacity} гостей)</span>
            </div>
          ) : selectedSeat ? (
            <div className="text-[10px] text-white/50 mt-0.5 flex items-center gap-1">
              <Check className="w-3 h-3 text-accent-gold" />
              <span>Выбран: <strong className="text-accent-gold">{selectedSeat.label}</strong></span>
            </div>
          ) : activeZone === 'overview' ? (
            <div className="text-[9px] text-white/40 mt-0.5 font-light">Нажмите на отдел, чтобы приблизиться к нему</div>
          ) : (
            <div className="text-[9px] text-white/40 mt-0.5 font-light">Выберите свободное место для бронирования</div>
          )}
        </div>

        {/* Back to overview button floating */}
        {activeZone !== 'overview' && (
          <div className="absolute bottom-4 right-4 z-30">
            <button
              onClick={() => setActiveZone('overview')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#12101a]/90 border border-glass-border hover:border-accent-gold hover:text-accent-gold transition-all shadow-lg flex items-center gap-1.5 text-white backdrop-blur-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Назад к обзору</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ThreeSeatingMap;

