import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Calendar, Edit3, Check, X, Clock, Flame, Phone, 
  Camera, Palette, Crown, Sparkles, Trophy, Award, 
  MessageSquare, Star, Heart, ShieldCheck
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/NotificationToast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Booking, User as UserType } from '@/types';
import { resolveImageUrl } from '@/lib/urls';

const statusLabels: Record<string, { text: string; color: 'green' | 'yellow' | 'gray' }> = {
  pending: { text: 'Ожидает', color: 'yellow' },
  confirmed: { text: 'Подтверждена', color: 'green' },
  cancelled: { text: 'Отменена', color: 'gray' },
};

// Theme accent options
const accentColors = [
  { name: 'Gold', value: '#D4AF37' },
  { name: 'Amber', value: '#FFB800' },
  { name: 'Bronze', value: '#8A6623' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
];

// VIP Card details mapping
const VIP_CARD_THEMES: Record<string, {
  name: string;
  gradient: string;
  border: string;
  glow: string;
  text: string;
  badge: string;
  icon: React.ReactNode;
}> = {
  bronze: {
    name: 'Bronze Elite Passport',
    gradient: 'from-amber-800 via-amber-900 to-yellow-950',
    border: 'border-amber-700/50',
    glow: 'shadow-[0_0_20px_rgba(138,102,35,0.4)]',
    text: 'text-amber-200/80',
    badge: 'bg-amber-800/40 text-amber-200 border-amber-700/30',
    icon: <ShieldCheck className="w-5 h-5 text-amber-400" />
  },
  silver: {
    name: 'Silver Prestige Passport',
    gradient: 'from-slate-400 via-zinc-500 to-slate-600',
    border: 'border-slate-300/40',
    glow: 'shadow-[0_0_20px_rgba(200,200,200,0.3)]',
    text: 'text-slate-200/80',
    badge: 'bg-slate-500/30 text-slate-200 border-slate-400/20',
    icon: <Trophy className="w-5 h-5 text-slate-300" />
  },
  gold: {
    name: 'Gold Sovereign Passport',
    gradient: 'from-yellow-600 via-amber-600 to-yellow-800',
    border: 'border-yellow-400/60',
    glow: 'shadow-[0_0_30px_rgba(212,175,55,0.4)]',
    text: 'text-yellow-100/80',
    badge: 'bg-yellow-600/30 text-yellow-200 border-yellow-500/20',
    icon: <Crown className="w-5 h-5 text-yellow-400 animate-pulse" />
  },
  black: {
    name: 'Black Obsidian Passport',
    gradient: 'from-zinc-900 via-stone-900 to-neutral-950',
    border: 'border-amber-500/30',
    glow: 'shadow-[0_0_35px_rgba(0,0,0,0.8)]',
    text: 'text-amber-100/70',
    badge: 'bg-stone-800/60 text-amber-300 border-amber-500/20',
    icon: <Award className="w-5 h-5 text-amber-500" />
  },
  diamond: {
    name: 'Diamond Nebula Passport',
    gradient: 'from-sky-450 via-indigo-900 to-purple-950',
    border: 'border-purple-400/50',
    glow: 'shadow-[0_0_40px_rgba(192,132,252,0.55)]',
    text: 'text-purple-100/90',
    badge: 'bg-purple-900/40 text-purple-200 border-purple-450/40',
    icon: <Sparkles className="w-5 h-5 text-cyan-300 animate-spin animate-duration-[4000ms]" />
  }
};
const AVATAR_FRAMES = [
  { id: 'none', name: 'Без рамки', style: '' },
  { id: 'sovereign', name: 'Золотое Сияние', style: 'ring-4 ring-accent-gold shadow-[0_0_15px_rgba(212,175,55,0.6)] animate-pulse' },
  { id: 'cyber', name: 'Кибер Неон', style: 'ring-4 ring-accent-cyan shadow-[0_0_20px_rgba(0,242,254,0.6)] animate-pulse' },
  { id: 'amethyst', name: 'Аметист VIP', style: 'ring-4 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse animate-duration-[3000ms]' },
  { id: 'ruby', name: 'Рубиновый Дым', style: 'ring-4 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]' }
];

const STATUS_OPTIONS = [
  '💨 Дымлю на полную',
  '🎮 В режиме киберспорта',
  '👑 VIP Резидент',
  '🔋 Заряжаюсь на победу',
  '💬 Готов к общению'
];

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [hookahStatuses, setHookahStatuses] = useState<Record<string, any>>({});

  // Editable fields
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedAccent, setSelectedAccent] = useState('#D4AF37');
  const [showSettings, setShowSettings] = useState(false);

  // VIP Club data states
  const [membership, setMembership] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loyaltyLogs, setLoyaltyLogs] = useState<any[]>([]);
  const [loadingVIP, setLoadingVIP] = useState(true);

  // Custom Avatar Upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // VIP Card Flipping & QR Pass
  const [isFlipped, setIsFlipped] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Review Dialog states
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // 3D Card Hover Inertia states
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFlipped) return;
    const card = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - card.left - card.width / 2;
    const y = e.clientY - card.top - card.height / 2;
    setRotateX(-y / 10);
    setRotateY(x / 10);
  };

  const handleCardMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  // Custom Avatar Frames and moods
  const [selectedFrameId, setSelectedFrameId] = useState('none');
  const [selectedStatus, setSelectedStatus] = useState('');

  const updatePrefs = (updated: any) => {
    const prefs = {
      bio: editBio,
      phone: editPhone,
      accent: selectedAccent,
      frameId: selectedFrameId,
      statusText: selectedStatus,
      ...updated
    };
    localStorage.setItem('profile_prefs', JSON.stringify(prefs));
  };

  const selectedFrame = AVATAR_FRAMES.find(f => f.id === selectedFrameId) || AVATAR_FRAMES[0];

  // Load saved preferences
  useEffect(() => {
    try {
      const prefs = localStorage.getItem('profile_prefs');
      if (prefs) {
        const p = JSON.parse(prefs);
        setEditBio(p.bio || '');
        setEditPhone(p.phone || '');
        setSelectedAccent(p.accent || '#D4AF37');
        setSelectedFrameId(p.frameId || 'none');
        setSelectedStatus(p.statusText || '');
      }
    } catch {}
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get<Booking[]>('/api/bookings/my');
      setBookings(data);
    } catch {}
    setLoadingBookings(false);
  };

  const fetchVIPClubData = async () => {
    try {
      const { data: mem } = await api.get('/api/memberships/me');
      setMembership(mem);

      const { data: achs } = await api.get('/api/memberships/achievements');
      setAchievements(achs);

      const { data: logs } = await api.get('/api/memberships/loyalty');
      setLoyaltyLogs(logs);
    } catch (err) {
      console.error('Failed to load VIP membership context:', err);
    }
    setLoadingVIP(false);
  };

  useEffect(() => {
    fetchBookings();
    fetchVIPClubData();
  }, []);

  useEffect(() => {
    const fetchStatuses = async () => {
      const active = bookings.filter(b => b.status !== 'cancelled');
      const results: Record<string, any> = {};
      for (const b of active) {
        try { 
          const { data } = await api.get(`/api/bookings/${b._id}/hookah-status`); 
          results[b._id] = data; 
        } catch {}
      }
      setHookahStatuses(results);
    };
    if (bookings.length > 0) fetchStatuses();
    const interval = setInterval(() => { if (bookings.length > 0) fetchStatuses(); }, 10000);
    return () => clearInterval(interval);
  }, [bookings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/auth/profile', { name: editName, phone: editPhone, bio: editBio });
      updatePrefs({ bio: editBio, phone: editPhone });
      const updatedUser: UserType = { ...user!, name: editName, phone: editPhone, bio: editBio };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showToast('Профиль обновлён', 'success');
      setEditing(false);
    } catch { 
      showToast('Ошибка сохранения', 'error'); 
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const { data } = await api.post('/api/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const updatedUser: UserType = { ...user!, avatar: data.user.avatar };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showToast('Аватар успешно обновлён!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка при загрузке аватара', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    try {
      await api.delete(`/api/bookings/${id}`);
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' as const } : b));
      showToast('Заказ отменён', 'success');
    } catch { 
      showToast('Ошибка отмены', 'error'); 
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewBookingId) return;
    setSubmittingReview(true);
    try {
      await api.post('/api/memberships/reviews', {
        bookingId: reviewBookingId,
        rating: reviewRating,
        text: reviewText
      });
      showToast('Спасибо за отзыв! Начислены баллы лояльности.', 'success');
      setReviewBookingId(null);
      setReviewText('');
      setReviewRating(5);
      // Reload bookings and membership card points/levels
      fetchBookings();
      fetchVIPClubData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Не удалось отправить отзыв', 'error');
    }
    setSubmittingReview(false);
  };

  if (!user) return null;

  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Fallback to bronze level if loading or no record
  const levelKey = membership?.memberships?.level || 'bronze';
  const cardTheme = VIP_CARD_THEMES[levelKey] || VIP_CARD_THEMES.bronze;

  // Level Progression calculator
  const getLevelProgress = (xp: number) => {
    if (xp < 500) return { min: 0, max: 500, next: 'Silver Prestige', progress: (xp / 500) * 100, remaining: 500 - xp };
    if (xp < 1500) return { min: 500, max: 1500, next: 'Gold Sovereign', progress: ((xp - 500) / 1000) * 100, remaining: 1500 - xp };
    if (xp < 4000) return { min: 1500, max: 4000, next: 'Black Obsidian', progress: ((xp - 1500) / 2500) * 100, remaining: 4000 - xp };
    if (xp < 10000) return { min: 4000, max: 10000, next: 'Diamond Nebula', progress: ((xp - 4000) / 6000) * 100, remaining: 10000 - xp };
    return { min: 10000, max: 100000, next: 'MAX LEVEL', progress: 100, remaining: 0 };
  };

  const xpProgress = getLevelProgress(membership?.points || 0);

  // Perks list for card back side matching tier level
  const tierPerks: Record<string, string[]> = {
    bronze: ['Скидка 5% на кальяны и ПК', 'Базовое бронирование залов', 'Начисление 1 XP за каждые 10 руб в чеке'],
    silver: ['Скидка 10% на все услуги', 'Доступ в PlayStation Zone (2эт)', 'Начисление 1.2x XP лояльности', 'Приоритет на бронь столов'],
    gold: ['Скидка 15% на всё меню', 'Свободный выбор PRO 600Hz залов', 'Начисление 1.5x XP за визиты', 'Бесплатный кальян в день рождения'],
    black: ['Скидка 20% на весь чек', 'Доступ в закрытые OLED VIP зоны', 'Личный ИИ-сомелье 24/7', 'Круглосуточный консьерж-сервис'],
    diamond: ['Скидка 25% на всё пожизненно', 'Персональная ложа VIP бесплатно', 'Ультра-кэшбэк XP за отзывы (+200 XP)', 'Индивидуальный кальянный мастер']
  };

  const perks = tierPerks[levelKey] || tierPerks.bronze;

  return (
    <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-24">
      {/* 3D Premium VIP Club Membership Card Wrapper */}
      {!loadingVIP && membership && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="perspective-1000 w-full"
        >
          <div className="text-center mb-3 flex items-center justify-between px-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-accent-gold font-bold">Закрытый клуб VIP Resident</span>
            <button 
              onClick={() => setIsFlipped(!isFlipped)} 
              className="text-[10px] text-accent-cyan hover:text-white transition-all bg-white/5 border border-glass-border/30 px-2.5 py-0.5 rounded-full"
            >
              {isFlipped ? 'Показать Карту' : 'Привилегии'}
            </button>
          </div>

          {/* 3D Flippable Card Frame */}
          <div className="relative w-full h-52 sm:h-56 transform-style-3d duration-700" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'none' }}>
            
            {/* FRONT OF THE VIP CARD */}
            <motion.div
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden'
              }}
              onClick={() => setIsFlipped(true)}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${cardTheme.gradient} border ${cardTheme.border} ${cardTheme.glow} p-6 flex flex-col justify-between overflow-hidden cursor-pointer select-none`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none z-0" />

              <div className="flex justify-between items-start z-10">
                <div>
                  <div className="flex items-center gap-2">
                    {cardTheme.icon}
                    <span className="text-sm font-semibold tracking-wider text-white font-display uppercase">{cardTheme.name}</span>
                  </div>
                  <div className={`text-[10px] mt-1 ${cardTheme.text} font-mono tracking-widest`}>
                    MEMBER ID: #{user?.id?.slice(0, 8).toUpperCase() || ''}
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${cardTheme.badge}`}>
                  {membership.memberships?.name}
                </div>
              </div>

              <div className="flex justify-between items-center z-10 my-1">
                <div className="w-10 h-8 rounded-md bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 opacity-80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] border border-yellow-250/20" />
                <div className="text-right">
                  <span className={`text-[9px] block ${cardTheme.text} uppercase tracking-wider font-mono`}>Клубные привилегии</span>
                  <span className="text-white text-base sm:text-lg font-bold font-mono">Скидка {membership.memberships?.discount_percent}%</span>
                </div>
              </div>

              <div className="flex justify-between items-end z-10 border-t border-white/10 pt-3">
                <div>
                  <span className={`text-[9px] block ${cardTheme.text} uppercase tracking-wider`}>Владелец карты</span>
                  <span className="text-white text-sm sm:text-base font-semibold font-display tracking-wide">{user.name}</span>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] block ${cardTheme.text} uppercase tracking-wider`}>Очки лояльности</span>
                  <span className="text-accent-gold text-lg sm:text-xl font-bold font-mono">{membership.points} XP</span>
                </div>
              </div>
            </motion.div>

            {/* BACK OF THE VIP CARD (PERKS LIST) */}
            <div
              style={{
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden'
              }}
              onClick={() => setIsFlipped(false)}
              className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${cardTheme.gradient} border ${cardTheme.border} ${cardTheme.glow} p-6 flex flex-col justify-between overflow-hidden cursor-pointer select-none`}
            >
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />
              <div className="z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 mb-3">
                    <Crown className="w-4.5 h-4.5 text-accent-gold" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Привилегии вашего уровня</span>
                  </div>
                  <ul className="space-y-2 text-[10px] sm:text-xs text-white/80">
                    {perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-accent-gold font-bold">✓</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-[9px] text-white/30 border-t border-white/10 pt-2 text-center">
                  Нажмите на карту для возврата к лицевой стороне
                </div>
              </div>
            </div>
          </div>

          {/* XP Progress Bar & Digital Pass triggers under Card */}
          <div className="mt-4 bg-white/5 p-4 rounded-3xl border border-glass-border/30 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <div className="flex flex-col">
                <span className="text-white/40 uppercase text-[9px] tracking-wider font-bold">Ранг Прогресса</span>
                <span className="text-white font-bold text-sm">{membership.memberships?.name}</span>
              </div>
              <div className="text-right flex flex-col">
                <span className="text-white/40 uppercase text-[9px] tracking-wider font-bold">Следующий ранг</span>
                <span className="text-accent-gold font-bold text-xs">{xpProgress.next}</span>
              </div>
            </div>
            
            <div className="relative w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(212,175,55,0.7)]" 
                style={{ width: `${xpProgress.progress}%` }} 
              />
            </div>

            <div className="flex justify-between items-center text-[10px]">
              <span className="text-white/40 font-mono">{membership.points} XP / {xpProgress.max} XP</span>
              {xpProgress.remaining > 0 ? (
                <span className="text-accent-cyan font-bold">Осталось {xpProgress.remaining} XP до повышения</span>
              ) : (
                <span className="text-accent-gold font-bold">Уровень максимален! 👑</span>
              )}
            </div>

            {/* Digital QR Member key pass button */}
            <div className="pt-2 border-t border-white/5 flex justify-center">
              <button 
                onClick={() => setShowQrModal(true)}
                className="w-full py-2 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border border-accent-gold/30 hover:border-accent-gold/60 text-accent-gold text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-glow-gold/10"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Открыть Цифровой QR Пропуск</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Profile Header — Telegram style */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="p-5 sm:p-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar circle */}
            <div className="relative mb-4">
              {uploadingAvatar ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/5 border border-glass-border flex items-center justify-center text-accent-cyan animate-pulse">
                  <div className="w-6 h-6 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
                </div>
              ) : user?.avatar ? (
                <img 
                  src={resolveImageUrl(user.avatar)} 
                  alt={user.name} 
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-xl ${selectedFrame.style}`} 
                />
              ) : (
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-xl ${selectedFrame.style}`}
                  style={{ background: `linear-gradient(135deg, ${selectedAccent}, ${selectedAccent}88)` }}>
                  {initials}
                </div>
              )}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-glass-bg border border-glass-border flex items-center justify-center text-white/40 hover:text-accent-gold hover:border-accent-gold/40 transition-colors shadow-lg"
                title="Загрузить аватар"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Name */}
            {editing ? (
              <div className="w-full space-y-3">
                <input value={editName} onChange={e => setEditName(e.target.value)} className="glass-input text-sm text-center" placeholder="Имя" autoFocus />
                <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="glass-input text-sm text-center" placeholder="Телефон" />
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="glass-input text-sm text-center resize-none" placeholder="О себе..." rows={2} maxLength={150} />
                <div className="flex gap-2 justify-center">
                  <GlowButton size="sm" onClick={handleSave} loading={saving}><Check className="w-3.5 h-3.5" /> Сохранить</GlowButton>
                  <button onClick={() => { setEditing(false); setEditName(user.name); }}
                    className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 border border-glass-border"><X className="w-3 h-3 inline" /> Отмена</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white">{user.name}</h2>
                {selectedStatus && (
                  <div className="mt-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-semibold text-accent-gold/90 w-fit mx-auto shadow-sm">
                    {selectedStatus}
                  </div>
                )}
                {editBio && <p className="text-xs sm:text-sm text-white/40 mt-1.5 max-w-xs">{editBio}</p>}
                <div className="flex items-center justify-center gap-3 mt-3 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</span>
                  {editPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {editPhone}</span>}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge text={user.role === 'admin' ? 'Админ' : 'Пользователь'} color={user.role === 'admin' ? 'cyan' : 'gray'} size="sm" />
                  <span className="text-[10px] text-white/20">с {new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex gap-2 mt-4 justify-center">
                  <button onClick={() => setEditing(true)}
                    className="px-4 py-1.5 rounded-lg text-xs text-accent-cyan border border-accent-cyan/20 hover:bg-accent-cyan/5 transition-all flex items-center gap-1.5">
                    <Edit3 className="w-3 h-3" /> Редактировать
                  </button>
                  <button onClick={() => setShowSettings(!showSettings)}
                    className="px-4 py-1.5 rounded-lg text-xs text-white/50 border border-glass-border/30 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> Настройки
                  </button>
                </div>
              </>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <GlassCard className="p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2 border-b border-white/5 pb-2">
              <Palette className="w-4 h-4 text-accent-gold" /> Персонализация профиля
            </h3>

            {/* Custom Status */}
            <div>
              <p className="text-xs text-white/40 mb-2">Клубный статус / Настроение</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => {
                    setSelectedStatus(selectedStatus === s ? '' : s);
                    updatePrefs({ statusText: selectedStatus === s ? '' : s });
                  }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
                      selectedStatus === s
                        ? 'bg-accent-gold/15 text-accent-gold border-accent-gold/45 shadow-[0_0_8px_rgba(212,175,55,0.15)]'
                        : 'bg-glass-bg border-glass-border/30 text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Frame */}
            <div>
              <p className="text-xs text-white/40 mb-2">Рамка для аватарки</p>
              <div className="flex flex-wrap gap-1.5">
                {AVATAR_FRAMES.map(f => (
                  <button key={f.id} onClick={() => {
                    setSelectedFrameId(f.id);
                    updatePrefs({ frameId: f.id });
                  }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
                      selectedFrameId === f.id
                        ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/45 shadow-[0_0_8px_rgba(0,242,254,0.15)]'
                        : 'bg-glass-bg border-glass-border/30 text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div>
              <p className="text-xs text-white/40 mb-2">Цвет подложки (без аватара)</p>
              <div className="flex gap-2">
                {accentColors.map(c => (
                  <button key={c.value} onClick={() => {
                    setSelectedAccent(c.value);
                    updatePrefs({ accent: c.value });
                  }}
                    className={`w-7 h-7 rounded-full transition-all ${selectedAccent === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-bg scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c.value }} />
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Achievements system */}
      {!loadingVIP && achievements.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-base sm:text-lg font-display font-semibold text-white mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent-gold" /> Клубные достижения
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((ach) => {
              const IconComp = ach.badge_icon === 'Flame' ? Flame 
                : ach.badge_icon === 'Crown' ? Crown 
                : ach.badge_icon === 'Sparkles' ? Sparkles 
                : MessageSquare;
              return (
                <GlassCard 
                  key={ach.id} 
                  className={`p-3.5 border transition-all ${ach.unlocked 
                    ? 'border-accent-gold/40 bg-accent-gold/5 shadow-[0_0_15px_rgba(212,175,55,0.15)]' 
                    : 'border-glass-border/10 bg-black/20 opacity-60'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${ach.unlocked 
                      ? 'bg-accent-gold/20 border-accent-gold/40 text-accent-gold' 
                      : 'bg-stone-900 border-stone-850 text-stone-600'}`}
                    >
                      <IconComp className={`w-4 h-4 ${ach.unlocked && ach.badge_icon === 'Sparkles' ? 'animate-spin animate-duration-[6000ms]' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-[11px] font-bold text-white truncate">{ach.name}</h4>
                        {ach.unlocked && <span className="text-[8px] text-accent-gold font-bold font-mono">+{ach.points_reward} XP</span>}
                      </div>
                      <p className="text-[9px] text-white/50 leading-tight mt-0.5 line-clamp-2">{ach.description}</p>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* My Orders / Bookings */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h3 className="text-base sm:text-lg font-display font-semibold text-white mb-3 flex items-center gap-2">
          <Flame className="w-4 h-4 text-accent-cyan" /> Мои визиты и заказы
        </h3>

        {loadingBookings ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" /></div>
        ) : bookings.length === 0 ? (
          <GlassCard className="p-6 sm:p-8 text-center">
            <p className="text-xs sm:text-sm text-white/40">У вас пока нет заказов</p>
            <GlowButton className="mt-3" size="sm" onClick={() => window.location.href = '/booking'}>Оформить заказ</GlowButton>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking, i) => {
              const st = statusLabels[booking.status] || statusLabels.pending;
              const hs = hookahStatuses[booking._id];
              return (
                <motion.div key={booking._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}>
                  <GlassCard className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-white">{booking.seatLabel}</span>
                        <Badge text={st.text} color={st.color} size="sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        {booking.status === 'confirmed' && (
                          <button 
                            onClick={() => setReviewBookingId(booking._id)}
                            className="text-[10px] text-accent-gold border border-accent-gold/25 bg-accent-gold/5 px-2 py-0.5 rounded-md hover:bg-accent-gold/15 transition-all flex items-center gap-1 font-semibold"
                          >
                            <Star className="w-2.5 h-2.5 fill-accent-gold" /> Оценить визит
                          </button>
                        )}
                        {booking.status === 'pending' && (
                          <button onClick={() => handleCancelBooking(booking._id)}
                            className="text-[10px] sm:text-xs text-red-400/60 hover:text-red-400">Отменить</button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-white/40">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(booking.date).toLocaleDateString('ru-RU')}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.time}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{booking.guestsCount} чел</span>
                    </div>
                    {(booking as any).hookahMix && (
                      <div className="text-[10px] sm:text-xs text-white/40 mt-1">💨 {(booking as any).hookahMix} • {(booking as any).hookahCount || 1} шт</div>
                    )}

                    {hs && booking.status !== 'cancelled' && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-white/5 border border-glass-border/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-accent-gold animate-bounce animate-duration-1000" />
                            <span className="text-xs font-semibold text-white/95">Приготовление: <span className="text-accent-gold">{hs.hookahStatusLabel}</span></span>
                          </div>
                          {hs.minutesLeft > 0 && <span className="text-[10px] text-white/40">{hs.minutesLeft} мин осталось</span>}
                        </div>
                        
                        {/* Burning Coals indicators */}
                        <div className="flex items-center justify-between gap-3 bg-black/45 p-2.5 rounded-xl border border-glass-border/20 mb-2">
                          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Угли чаши:</div>
                          <div className="flex gap-2.5">
                            {[
                              { minPct: 15, label: 'Сборка' },
                              { minPct: 45, label: 'Разогрев' },
                              { minPct: 80, label: 'Подача' },
                            ].map((coal, idx) => {
                              const active = hs.progressPercent >= coal.minPct;
                              return (
                                <div key={idx} className="flex flex-col items-center gap-1">
                                  <div 
                                    className={`w-5 h-5 rounded-full transition-all duration-700 flex items-center justify-center text-[10px] font-bold ${
                                      active 
                                        ? 'bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 shadow-[0_0_16px_rgba(239,68,68,0.9)] text-black border border-yellow-300/30' 
                                        : 'bg-stone-850 text-stone-500 border border-stone-700/30'
                                    }`}
                                  >
                                    {idx + 1}
                                  </div>
                                  <span className="text-[8px] text-white/30 uppercase tracking-wider">{coal.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="h-1.5 rounded-full bg-stone-900 overflow-hidden">
                          <motion.div className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 shadow-[0_0_10px_rgba(212,175,55,0.7)]"
                            initial={{ width: 0 }} animate={{ width: `${hs.progressPercent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }} />
                        </div>
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Loyalty Transactions Log */}
      {!loadingVIP && loyaltyLogs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-base sm:text-lg font-display font-semibold text-white mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" /> История начислений XP
          </h3>
          <GlassCard className="p-2 sm:p-3 overflow-hidden">
            <div className="max-h-48 overflow-y-auto divide-y divide-glass-border/10 space-y-1.5 pr-1">
              {loyaltyLogs.map((log) => (
                <div key={log.id} className="flex justify-between items-center py-2 text-xs text-white/70">
                  <div className="flex flex-col">
                    <span className="font-medium text-white/90">{log.description}</span>
                    <span className="text-[9px] text-white/30">{new Date(log.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <span className={`font-mono font-bold ${log.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                    {log.type === 'earn' ? '+' : '-'}{log.points_delta} XP
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Review Dialog Modal */}
      <AnimatePresence>
        {reviewBookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewBookingId(null)}
            />

            {/* Modal Box */}
            <motion.div
              className="relative w-full max-w-sm bg-gradient-to-b from-stone-900 to-black border border-glass-border/30 rounded-3xl p-6 shadow-2xl z-10 overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <h3 className="text-base font-bold font-display text-white text-center mb-4 flex items-center justify-center gap-2">
                <Star className="w-5 h-5 text-accent-gold fill-accent-gold" /> Оцените ваш визит
              </h3>
              
              <p className="text-xs text-white/40 text-center mb-5 leading-normal">
                Поделитесь впечатлениями о сервисе и кальянах. За отзыв вы получите <span className="text-accent-gold font-bold">+50 XP</span> лояльности и ачивку!
              </p>

              {/* Stars selector */}
              <div className="flex justify-center gap-3 mb-5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setReviewRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-8 h-8 ${star <= reviewRating 
                        ? 'text-accent-gold fill-accent-gold shadow-glow' 
                        : 'text-stone-750'}`} 
                    />
                  </button>
                ))}
              </div>

              {/* Comment text */}
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Что вам больше всего понравилось? Напишите отзыв..."
                className="w-full h-24 bg-white/5 border border-glass-border/30 rounded-2xl p-3 text-xs text-white placeholder-white/30 resize-none mb-5 focus:outline-none focus:border-accent-gold/60"
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setReviewBookingId(null)}
                  className="px-4 py-2 border border-glass-border rounded-xl text-xs text-white/40 hover:text-white/60"
                >
                  Отмена
                </button>
                <GlowButton
                  onClick={handleSubmitReview}
                  loading={submittingReview}
                  size="sm"
                >
                  Отправить
                </GlowButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cyberpunk QR Digital Pass Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
            />

            {/* Modal Card */}
            <motion.div
              className="relative w-full max-w-sm bg-gradient-to-b from-[#14121f] to-black border border-accent-gold/30 rounded-3xl p-6 shadow-2xl z-10 overflow-hidden text-center"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
            >
              {/* Corner neon elements */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent-gold/40 rounded-tl-3xl pointer-events-none" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent-gold/40 rounded-tr-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent-gold/40 rounded-bl-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent-gold/40 rounded-br-3xl pointer-events-none" />

              {/* Holographic scanning grid background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-0" />
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent-gold/5 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10 space-y-5">
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-accent-gold">
                    <Crown className="w-5 h-5 animate-pulse" />
                    <span className="text-xs uppercase tracking-[0.2em] font-bold">SPORT LOUNGE PASS</span>
                  </div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-mono">ID: #{user.id?.slice(0, 12).toUpperCase()}</p>
                </div>

                {/* QR Code Container with scanning animation */}
                <div className="relative w-44 h-44 mx-auto bg-black/60 border border-accent-gold/20 rounded-2xl p-4 flex items-center justify-center shadow-[inset_0_4px_16px_rgba(0,0,0,0.8)] overflow-hidden">
                  
                  {/* Laser line scanning effect */}
                  <motion.div 
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-gold to-transparent shadow-[0_0_8px_#D4AF37] z-20"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  {/* Simulated detailed QR code vector using inline SVG */}
                  <svg className="w-full h-full text-accent-gold opacity-90" viewBox="0 0 100 100" fill="currentColor">
                    {/* QR Finder patterns */}
                    <path d="M 0,0 H 25 V 25 H 0 Z M 5,5 H 20 V 20 H 5 Z M 9,9 H 16 V 16 H 9 Z" />
                    <path d="M 75,0 H 100 V 25 H 75 Z M 80,5 H 95 V 20 H 80 Z M 84,9 H 91 V 16 H 84 Z" />
                    <path d="M 0,75 H 25 V 100 H 0 Z M 5,80 H 20 V 95 H 5 Z M 9,84 H 16 V 91 H 9 Z" />
                    {/* Small alignment pattern */}
                    <path d="M 70,70 H 85 V 85 H 70 Z M 75,75 H 80 V 80 H 75 Z" />
                    {/* Random QR bits */}
                    <rect x="35" y="5" width="5" height="10" />
                    <rect x="45" y="0" width="10" height="5" />
                    <rect x="60" y="10" width="5" height="15" />
                    <rect x="30" y="20" width="15" height="5" />
                    
                    <rect x="0" y="35" width="10" height="5" />
                    <rect x="15" y="45" width="5" height="10" />
                    <rect x="25" y="30" width="5" height="20" />
                    <rect x="35" y="40" width="15" height="5" />
                    
                    <rect x="50" y="30" width="10" height="10" />
                    <rect x="65" y="35" width="5" height="5" />
                    <rect x="75" y="45" width="15" height="5" />
                    <rect x="85" y="30" width="10" height="10" />

                    <rect x="5" y="60" width="10" height="5" />
                    <rect x="20" y="55" width="5" height="10" />
                    <rect x="35" y="60" width="15" height="5" />
                    <rect x="40" y="50" width="5" height="10" />

                    <rect x="50" y="60" width="20" height="5" />
                    <rect x="55" y="50" width="5" height="10" />
                    <rect x="80" y="55" width="10" height="5" />
                    <rect x="90" y="65" width="5" height="10" />

                    <rect x="30" y="75" width="5" height="10" />
                    <rect x="40" y="80" width="10" height="5" />
                    <rect x="55" y="75" width="5" height="15" />
                    <rect x="65" y="85" width="10" height="5" />
                    
                    <rect x="30" y="90" width="15" height="5" />
                    <rect x="50" y="95" width="10" height="5" />
                    <rect x="70" y="95" width="15" height="5" />
                    <rect x="90" y="90" width="5" height="10" />
                  </svg>
                </div>

                {/* Card member stats inside modal */}
                <div className="bg-white/5 border border-glass-border/30 rounded-2xl p-3.5 space-y-2">
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Имя:</span>
                    <strong className="text-white">{user.name}</strong>
                  </div>
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Статус карты:</span>
                    <strong className="text-accent-gold uppercase tracking-wider">{membership?.memberships?.name || 'BRONZE RESIDENT'}</strong>
                  </div>
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Скидка:</span>
                    <strong className="text-white">{membership?.memberships?.discount_percent || 5}%</strong>
                  </div>
                </div>

                <div className="text-[10px] text-white/30 italic">
                  Покажите этот QR код администратору на ресепшене для авторизации и применения скидки.
                </div>

                {/* Close button */}
                <button
                  onClick={() => setShowQrModal(false)}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-xl transition-all"
                >
                  Закрыть пропуск
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
