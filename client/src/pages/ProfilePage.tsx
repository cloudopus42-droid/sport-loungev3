import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Calendar, Edit3, Check, X, Clock, Flame, Phone, 
  Camera, Palette, Crown, Sparkles, Trophy, Award, 
  MessageSquare, Star, Heart, ShieldCheck, FileText
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/NotificationToast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Booking, User as UserType } from '@/types';
import { resolveImageUrl } from '@/lib/urls';

const TABLE_OPTIONS = [
  'Стол 1', 'Стол 2', 'Стол 3', 'Стол 4', 'Стол 5',
  'Стол 6', 'Стол 7', 'Стол 8', 'VIP Кабинет 1', 'VIP Кабинет 2',
  'Игровая Зона PC-1', 'Игровая Зона PC-2', 'PlayStation Зона 1', 'PlayStation Зона 2'
];

const LIQUID_BASES = [
  { id: 'water', name: 'На воде', price: 0, emoji: '💧', desc: 'Классическая легкая фильтрация' },
  { id: 'milk', name: 'На молоке', price: 150, emoji: '🥛', desc: 'Пар более плотный и нежный' },
  { id: 'juice', name: 'На соке', price: 200, emoji: '🍹', desc: 'Фруктовые и ягодные оттенки' },
  { id: 'wine', name: 'На вине / Коктейле', price: 450, emoji: '🍷', desc: 'Алкогольная ароматика' },
];

const statusLabels: Record<string, { text: string; color: 'green' | 'yellow' | 'gray' }> = {
  pending: { text: 'Ожидает', color: 'yellow' },
  confirmed: { text: 'Подтверждена', color: 'green' },
  cancelled: { text: 'Отменена', color: 'gray' },
};

// Theme accent options
const accentColors = [
  { name: 'Gold', value: '#B08D57' },
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
    gradient: 'from-[#0D0F13] via-[#13161C] to-[#0D0F13]',
    border: 'border-accent-gold/40',
    glow: 'shadow-elevated',
    text: 'text-accent-gold',
    badge: 'bg-accent-gold/20 text-accent-gold border-accent-gold/30',
    icon: <Crown className="w-5 h-5 text-accent-gold" />
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
    name: 'Royal Burgundy Passport',
    gradient: 'from-red-950 via-[#4A0010] to-stone-900',
    border: 'border-red-800/50',
    glow: 'shadow-[0_0_40px_rgba(128,0,32,0.6)]',
    text: 'text-red-200/90',
    badge: 'bg-red-900/40 text-red-300 border-red-800/40',
    icon: <Sparkles className="w-5 h-5 text-accent-gold" />
  }
};
const AVATAR_FRAMES = [
  { id: 'none', name: 'Без рамки', style: '' },
  { id: 'sovereign', name: 'Золотое Сияние', style: 'ring-2 ring-accent-gold/40' },
  { id: 'burgundy', name: 'Бургунди', style: 'ring-2 ring-[#8B3A3A]/40' },
  { id: 'goldburst', name: 'Золотой Всплеск', style: 'ring-2 ring-accent-gold/60' },
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
  const [activeTab, setActiveTab] = useState<'visits' | 'mixes'>('visits');

  // Repeat order modal states
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [repeatBooking, setRepeatBooking] = useState<any | null>(null);
  const [repeatSeatLabel, setRepeatSeatLabel] = useState(TABLE_OPTIONS[0]);
  const [repeatLiquidBase, setRepeatLiquidBase] = useState('water');
  const [repeatSpecialNotes, setRepeatSpecialNotes] = useState('');
  const [repeatPhone, setRepeatPhone] = useState(user?.phone || '');
  const [submittingRepeat, setSubmittingRepeat] = useState(false);

  // User preferences states
  const [preferences, setPreferences] = useState<{ topFlavors: string[]; topMixes: string[] } | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const handleRepeatMix = (booking: any) => {
    const parts = (booking.hookahMix || '').split(' | ');
    let liquidBase = 'water';
    if (parts.length >= 2) {
      const baseName = parts[1];
      if (baseName.includes('молок')) liquidBase = 'milk';
      else if (baseName.includes('сок')) liquidBase = 'juice';
      else if (baseName.includes('вин') || baseName.includes('Коктейл')) liquidBase = 'wine';
    }

    setRepeatBooking(booking);
    setRepeatLiquidBase(liquidBase);
    setRepeatPhone(user?.phone || booking.phone || '');
    setRepeatSpecialNotes(booking.comment || '');
    setShowRepeatModal(true);
  };

  const handleSubmitRepeatOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repeatBooking) return;

    if (!repeatPhone || repeatPhone.trim().length < 5) {
      showToast('Укажите корректный номер телефона!', 'error');
      return;
    }

    setSubmittingRepeat(true);
    try {
      const notesString = repeatBooking.hookahMix 
        ? `${repeatBooking.hookahMix}${repeatSpecialNotes ? ` | Пожелания: ${repeatSpecialNotes}` : ''}`
        : repeatSpecialNotes;

      const res = await api('/api/orders', {
        method: 'POST',
        body: {
          mix_id: null,
          liquid_id: repeatLiquidBase,
          notes: notesString,
          seat_id: repeatSeatLabel.replace(/\s+/g, '-').toLowerCase(),
          seat_label: repeatSeatLabel,
          seat_zone: repeatSeatLabel.includes('VIP') ? 'vip' : repeatSeatLabel.includes('PC') ? 'pro' : 'hall',
        },
      });

      showToast('Заказ принят! Мастера уже собирают его 💨', 'success');
      setShowRepeatModal(false);
      
      localStorage.setItem('current_order_id', res.id);
      navigationTimeoutRef.current = setTimeout(() => {
        window.location.href = `${import.meta.env.BASE_URL}booking`;
      }, 1000);

    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка при оформлении заказа', 'error');
    } finally {
      setSubmittingRepeat(false);
    }
  };

  // Editable fields
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedAccent, setSelectedAccent] = useState('#B08D57');
  const [showSettings, setShowSettings] = useState(false);

  // VIP Club data states
  const [membership, setMembership] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loyaltyLogs, setLoyaltyLogs] = useState<any[]>([]);
  const [loadingVIP, setLoadingVIP] = useState(true);

  // Custom Avatar Upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Liquid Glass customization states
  const [blurVal, setBlurVal] = useState(40);
  const [opacityVal, setOpacityVal] = useState(0.72);

  const handleBlurChange = (val: number) => {
    setBlurVal(val);
    localStorage.setItem('glass_blur', val.toString());
    document.documentElement.style.setProperty('--glass-blur', `${val}px`);
  };

  const handleOpacityChange = (val: number) => {
    setOpacityVal(val);
    localStorage.setItem('glass_opacity', val.toString());
    document.documentElement.style.setProperty('--glass-opacity', val.toString());
  };

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
        setSelectedAccent(p.accent || '#B08D57');
        setSelectedFrameId(p.frameId || 'none');
        setSelectedStatus(p.statusText || '');
      }

      const savedBlur = localStorage.getItem('glass_blur');
      if (savedBlur) setBlurVal(Number(savedBlur));

      const savedOpacity = localStorage.getItem('glass_opacity');
      if (savedOpacity) setOpacityVal(Number(savedOpacity));
    } catch {}
  }, []);

  const fetchBookingsRef = useRef<AbortController | null>(null);
  const fetchVIPClubDataRef = useRef<AbortController | null>(null);
  const fetchPreferencesRef = useRef<AbortController | null>(null);

  const fetchBookings = async () => {
    fetchBookingsRef.current?.abort();
    const ac = new AbortController();
    fetchBookingsRef.current = ac;
    try {
      const data = await api<Booking[]>('/api/bookings/my', { signal: ac.signal });
      if (ac.signal.aborted) return;
      setBookings(data);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }
    setLoadingBookings(false);
  };

  const fetchVIPClubData = async () => {
    fetchVIPClubDataRef.current?.abort();
    const ac = new AbortController();
    fetchVIPClubDataRef.current = ac;
    try {
      const mem = await api('/api/memberships/me', { signal: ac.signal });
      if (ac.signal.aborted) return;
      setMembership(mem);

      const achs = await api('/api/memberships/achievements', { signal: ac.signal });
      if (ac.signal.aborted) return;
      setAchievements(achs);

      const logs = await api('/api/memberships/loyalty', { signal: ac.signal });
      if (ac.signal.aborted) return;
      setLoyaltyLogs(logs);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Failed to load VIP membership context:', err);
    }
    setLoadingVIP(false);
  };

  const fetchPreferences = async () => {
    fetchPreferencesRef.current?.abort();
    const ac = new AbortController();
    fetchPreferencesRef.current = ac;
    try {
      const data = await api('/api/users/me/preferences', { signal: ac.signal });
      if (ac.signal.aborted) return;
      setPreferences(data);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Failed to load user preferences:', err);
    }
    setLoadingPrefs(false);
  };

  useEffect(() => {
    fetchBookings();
    fetchVIPClubData();
    fetchPreferences();
    return () => {
      fetchBookingsRef.current?.abort();
      fetchVIPClubDataRef.current?.abort();
      fetchPreferencesRef.current?.abort();
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
    };
  }, []);

  // Keep track of notified booking ready alerts (synchronized with localStorage)
  const [notifiedReady, setNotifiedReady] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('notified_bookings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const ac = new AbortController();
    const fetchStatuses = async () => {
      const active = bookings.filter(b => b.status !== 'cancelled');
      const results: Record<string, any> = {};
      for (const b of active) {
        try { 
          const data = await api(`/api/bookings/${b._id}/hookah-status`, { signal: ac.signal }); 
          if (ac.signal.aborted) return;
          results[b._id] = data; 
          
          if (data.hookahStatus === 'ready' && !notifiedReady.includes(b._id)) {
            const updated = [...notifiedReady, b._id];
            setNotifiedReady(updated);
            try {
              localStorage.setItem('notified_bookings', JSON.stringify(updated));
            } catch (err) {
              console.error('Failed to sync notified_bookings:', err);
            }
            
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-200.wav');
            audio.volume = 0.55;
            audio.play().catch(() => {});
            
            showToast('Ваш кальян готов! Приятного покура! 💨', 'success');

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('SPORT LOUNGE', {
                  body: 'Ваш кальян готов! Приятного покура! 💨',
                  icon: '/icon-192.png'
                });
              } catch (err) {
                console.warn('Native notification alert fail:', err);
              }
            }
          }
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
        }
      }
      setHookahStatuses(results);
    };
    if (bookings.length > 0) fetchStatuses();
    const interval = setInterval(() => { if (bookings.length > 0) fetchStatuses(); }, 10000);
    return () => { clearInterval(interval); ac.abort(); };
  }, [bookings, notifiedReady]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api('/api/auth/profile', { method: 'PUT', body: { name: editName, phone: editPhone, bio: editBio } });
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
      const data = await api('/api/auth/avatar', {
        method: 'POST',
        body: formData,
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
      await api(`/api/bookings/${id}`, { method: 'DELETE' });
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
      await api('/api/memberships/reviews', {
        method: 'POST',
        body: {
          bookingId: reviewBookingId,
          rating: reviewRating,
          text: reviewText
        }
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
              className="text-[10px] text-accent-gold hover:text-white transition-all bg-white/5 border border-glass-border/30 px-2.5 py-0.5 rounded-full"
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
                className="h-full rounded-full bg-accent-gold" 
                style={{ width: `${xpProgress.progress}%` }} 
              />
            </div>

            <div className="flex justify-between items-center text-[10px]">
              <span className="text-white/40 font-mono">{membership.points} XP / {xpProgress.max} XP</span>
              {xpProgress.remaining > 0 ? (
                <span className="text-accent-gold font-bold">Осталось {xpProgress.remaining} XP до повышения</span>
              ) : (
                <span className="text-accent-gold font-bold">Уровень максимален! 👑</span>
              )}
            </div>

            {/* Digital QR Member key pass button */}
            <div className="pt-2 border-t border-white/5 flex justify-center">
              <button 
                onClick={() => setShowQrModal(true)}
                className="w-full py-2 bg-accent-gold/5 border border-accent-gold/20 hover:border-accent-gold/40 text-accent-gold text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
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
        <GlassCard variant="premium" className="p-5 sm:p-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar circle */}
            <div className="relative mb-4">
              {uploadingAvatar ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/5 border border-glass-border flex items-center justify-center text-accent-gold animate-pulse">
                  <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
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
                  <Badge text={user.role === 'admin' ? 'Админ' : 'Пользователь'} color={user.role === 'admin' ? 'gold' : 'gray'} size="sm" />
                  <span className="text-[10px] text-white/20">с {new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex gap-2 mt-4 justify-center">
                  <button onClick={() => setEditing(true)}
                    className="px-4 py-1.5 rounded-lg text-xs text-accent-gold border border-accent-gold/20 hover:bg-accent-gold/5 transition-all flex items-center gap-1.5">
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
          <GlassCard variant="premium" className="p-4 sm:p-5 space-y-4">
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
                        ? 'bg-accent-gold/15 text-accent-gold border-accent-gold/45'
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
                        ? 'bg-accent-gold/15 text-accent-gold border-accent-gold/45 shadow-[0_0_8px_rgba(0,242,254,0.15)]'
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

            {/* Glassmorphism settings */}
            <div className="border-t border-white/5 pt-3 mt-3 space-y-4">
              <p className="text-xs uppercase tracking-wider text-accent-gold font-bold">Настройки Жидкого Стекла (Liquid Glass)</p>
              
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-white/60">Размытие заднего фона (Blur)</span>
                  <span className="text-accent-gold font-mono">{blurVal}px</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={blurVal} 
                  onChange={(e) => handleBlurChange(Number(e.target.value))}
                  className="w-full accent-accent-gold bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-white/60">Прозрачность стекла (Opacity)</span>
                  <span className="text-accent-gold font-mono">{Math.round(opacityVal * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.01"
                  value={opacityVal} 
                  onChange={(e) => handleOpacityChange(Number(e.target.value))}
                  className="w-full accent-accent-gold bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Favorite Hookah Preferences */}
      {!loadingPrefs && preferences && (preferences.topFlavors.length > 0 || preferences.topMixes.length > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.08 }}
          className="space-y-3"
        >
          <h3 className="text-base sm:text-lg font-display font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-gold" /> Картотека ваших вкусов
          </h3>
          <GlassCard className="p-4 sm:p-5 border border-accent-gold/20 bg-black/45 space-y-4">
            {preferences.topFlavors.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block font-bold">Любимые табачные ноты:</span>
                <div className="flex flex-wrap gap-2">
                  {preferences.topFlavors.map((flavor, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 rounded-full text-xs font-semibold text-accent-gold bg-accent-gold/10 border border-accent-gold/30 flex items-center gap-1 transition-transform hover:scale-105"
                    >
                      <span>💨</span>
                      <span>{flavor}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {preferences.topMixes.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block font-bold">Популярные у вас миксы:</span>
                <div className="space-y-2.5">
                  {preferences.topMixes.map((mixName, index) => (
                    <div key={index} className="flex flex-col space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/80 font-medium">{mixName}</span>
                        <span className="text-[10px] font-mono text-accent-gold font-bold">Любимый выбор #{index + 1}</span>
                      </div>
                      <div className="relative w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full rounded-full bg-accent-gold" 
                          style={{ width: `${85 - index * 20}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                    ? 'border-accent-gold/40 bg-accent-gold/5' 
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
          <Flame className="w-4 h-4 text-accent-gold" /> Мои визиты и заказы
        </h3>

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-glass-border/10 pb-3 mb-4 select-none">
          <button 
            onClick={() => setActiveTab('visits')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'visits'
                ? 'bg-accent-gold/15 text-accent-gold border-accent-gold/45 shadow-[0_0_12px_rgba(0,242,254,0.15)]'
                : 'bg-glass-bg border-glass-border/30 text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Бронирования и визиты
          </button>
          <button 
            onClick={() => setActiveTab('mixes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'mixes'
                ? 'bg-accent-gold/15 text-accent-gold border-accent-gold/45'
                : 'bg-glass-bg border-glass-border/30 text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Мои миксы 💨
          </button>
        </div>

        {loadingBookings ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div>
            {activeTab === 'visits' ? (
              // VISITS TAB
              bookings.filter(b => b.seatLabel !== 'Микс-билет' && !b.seatId?.startsWith('MIX-')).length === 0 ? (
                <GlassCard className="p-6 sm:p-8 text-center">
                  <p className="text-xs sm:text-sm text-white/40">У вас пока нет бронирований столов</p>
                  <GlowButton className="mt-3" size="sm" onClick={() => window.location.href = import.meta.env.BASE_URL}>Забронировать стол</GlowButton>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {bookings.filter(b => b.seatLabel !== 'Микс-билет' && !b.seatId?.startsWith('MIX-')).map((booking, i) => {
                    const st = statusLabels[booking.status] || statusLabels.pending;
                    const hs = hookahStatuses[booking._id];
                    return (
                      <motion.div key={booking._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
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
                                <motion.div className="h-full rounded-full bg-accent-gold"
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
              )
            ) : (
              // MIXES TAB
              bookings.filter(b => b.seatLabel === 'Микс-билет' || b.seatId?.startsWith('MIX-')).length === 0 ? (
                <GlassCard className="p-6 sm:p-8 text-center">
                  <p className="text-xs sm:text-sm text-white/40">У вас пока нет сохраненных миксов</p>
                  <GlowButton className="mt-3" size="sm" onClick={() => window.location.href = `${import.meta.env.BASE_URL}booking`}>Создать новый микс</GlowButton>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bookings.filter(b => b.seatLabel === 'Микс-билет' || b.seatId?.startsWith('MIX-')).map((booking, i) => {
                    return (
                      <motion.div key={booking._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <GlassCard className="p-4 border border-accent-gold/20 flex flex-col justify-between h-full hover:border-accent-gold/40 transition-colors">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-mono text-accent-gold font-bold tracking-widest">{booking.seatId}</span>
                              <span className="text-[9px] text-white/30">{new Date(booking.date).toLocaleDateString('ru-RU')}</span>
                            </div>
                            
                            {(booking as any).hookahMix && (
                              <div className="space-y-2 mt-2">
                                <div className="text-xs text-white font-semibold flex items-center gap-1.5">
                                  <Flame className="w-3.5 h-3.5 text-accent-gold" />
                                  <span>Детали рецепта</span>
                                </div>
                                <div className="text-[11px] text-white/70 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-glass-border/10 space-y-1">
                                  {(booking as any).hookahMix.split(' | ').map((line: string, idx: number) => {
                                    if (line.startsWith('Mix: ')) {
                                      return (
                                        <div key={idx} className="mt-1 pt-1 border-t border-white/5 text-accent-gold">
                                          <strong>Вкусы:</strong> {line.replace('Mix: ', '')}
                                        </div>
                                      );
                                    }
                                    return <div key={idx}>{line}</div>;
                                  })}
                                  {booking.comment && (
                                    <div className="text-[10px] text-white/50 italic mt-1 font-light">
                                      "{booking.comment}"
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                            <button
                              onClick={() => handleRepeatMix(booking)}
                              className="w-full py-2 bg-gradient-to-r from-accent-gold/10 to-amber-500/10 border border-accent-gold/30 hover:border-accent-gold/60 text-accent-gold text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Flame className="w-3.5 h-3.5 text-accent-gold animate-pulse" />
                              <span>Повторить микс</span>
                            </button>
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>
              )
            )}
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
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-gold to-transparent z-20"
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

      {/* CONFIRM REPEAT ORDER MODAL */}
      <AnimatePresence>
        {showRepeatModal && repeatBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-md w-full mafia-panel p-6 shadow-2xl space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-1 relative pb-3 border-b border-[#d4af37]/20">
                <span className="text-[9px] uppercase tracking-widest text-[#d4af37] font-bold block mb-1">
                  ПОВТОРЕНИЕ РИТУАЛА
                </span>
                <h3 className="text-lg font-display font-light text-white uppercase tracking-wider">
                  Повторить заказ кальяна
                </h3>
              </div>

              {/* Mix details summary */}
              <div className="bg-black/35 p-3 rounded-xl border border-glass-border/10 text-xs text-white/70 space-y-1.5">
                <div className="text-[10px] text-accent-gold font-bold uppercase tracking-wider">Повторяемый микс:</div>
                <div className="font-light leading-relaxed">{repeatBooking.hookahMix}</div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitRepeatOrder} className="space-y-4">
                
                {/* Table Choice */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/50 block font-medium uppercase tracking-wider">
                    🛋️ Куда подать кальян?
                  </label>
                  <select
                    value={repeatSeatLabel}
                    onChange={(e) => setRepeatSeatLabel(e.target.value)}
                    className="w-full px-3 py-2 text-xs mafia-input font-bold"
                    required
                  >
                    {TABLE_OPTIONS.map(opt => (
                      <option key={opt} value={opt} className="bg-[#120b06] text-white font-bold">{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Liquid Base choice */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/50 block font-medium uppercase tracking-wider">
                    💧 Жидкость в колбе:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {LIQUID_BASES.map((base) => (
                      <button
                        key={base.id}
                        type="button"
                        onClick={() => setRepeatLiquidBase(base.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          repeatLiquidBase === base.id
                            ? 'border-[#d4af37] bg-amber-950/25'
                            : 'border-white/5 bg-black/35 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{base.emoji}</span>
                          <span className="text-[11px] font-bold text-white">{base.name}</span>
                        </div>
                        <p className="text-[9px] text-white/40 mt-0.5 leading-none">
                          {base.price > 0 ? `+${base.price} ₽` : 'Бесплатно'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/50 block font-medium uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#d4af37]" /> Номер телефона:
                  </label>
                  <input
                    type="tel"
                    value={repeatPhone}
                    onChange={(e) => setRepeatPhone(e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    className="w-full px-3 py-2.5 text-xs mafia-input font-mono"
                    required
                  />
                </div>

                {/* Comment / notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/50 block font-medium uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#d4af37]" /> Дополнительные пожелания:
                  </label>
                  <textarea
                    value={repeatSpecialNotes}
                    onChange={(e) => setRepeatSpecialNotes(e.target.value)}
                    placeholder="Например: Побольше льда / Сделайте покрепче..."
                    className="w-full px-3 py-2 text-xs mafia-input min-h-[60px] resize-none"
                    rows={2}
                  />
                </div>

                {/* Totals */}
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                  <span className="text-white/40 uppercase tracking-widest">Итого к оплате:</span>
                  <span className="text-base font-bold text-[#d4af37] font-mono">
                    {1200 + (LIQUID_BASES.find(b => b.id === repeatLiquidBase)?.price || 0)} ₽
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRepeatModal(false)}
                    className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRepeat}
                    className="flex-1 py-2.5 text-xs font-bold rounded-xl gold-antique-btn"
                  >
                    {submittingRepeat ? 'Отправка...' : 'Отправить заказ'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

