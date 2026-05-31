import type { Seat } from '@/types';

// ==========================================================
// SPORT LOUNGE — Компьютерный клуб + Кальянная
// Seating map based on owner's floor plans
// ==========================================================

// --- MAIN HALL (1 этаж) — 31 ПК общий зал + ряды справа ---
export const SEATS: Seat[] = [
  // Общий зал — 31 ПК (левая большая зона)
  // Row 8 (top right)
  { id: 'pc-hall-8a', label: 'ПК 8-1', zone: 'hall', x: 55, y: 3, width: 20, height: 4, capacity: 1 },
  { id: 'pc-hall-8b', label: 'ПК 8-2', zone: 'hall', x: 76, y: 3, width: 20, height: 4, capacity: 1 },
  // Row 7
  { id: 'pc-hall-7a', label: 'ПК 7-1', zone: 'hall', x: 55, y: 9, width: 20, height: 4, capacity: 1 },
  { id: 'pc-hall-7b', label: 'ПК 7-2', zone: 'hall', x: 76, y: 9, width: 20, height: 4, capacity: 1 },
  // Row 6
  { id: 'pc-hall-6a', label: 'ПК 6-1', zone: 'hall', x: 55, y: 16, width: 20, height: 4, capacity: 1 },
  { id: 'pc-hall-6b', label: 'ПК 6-2', zone: 'hall', x: 76, y: 16, width: 20, height: 4, capacity: 1 },
  // Row 5
  { id: 'pc-hall-5a', label: 'ПК 5-1', zone: 'hall', x: 72, y: 24, width: 12, height: 4, capacity: 1 },
  { id: 'pc-hall-5b', label: 'ПК 5-2', zone: 'hall', x: 85, y: 24, width: 12, height: 4, capacity: 1 },
  // Row 4
  { id: 'pc-hall-4a', label: 'ПК 4-1', zone: 'hall', x: 78, y: 31, width: 10, height: 4, capacity: 1 },
  { id: 'pc-hall-4b', label: 'ПК 4-2', zone: 'hall', x: 89, y: 31, width: 8, height: 4, capacity: 1 },
  // Row 3
  { id: 'pc-hall-3a', label: 'ПК 3-1', zone: 'hall', x: 82, y: 38, width: 8, height: 4, capacity: 1 },
  { id: 'pc-hall-3b', label: 'ПК 3-2', zone: 'hall', x: 91, y: 38, width: 6, height: 4, capacity: 1 },
  // Row 2
  { id: 'pc-hall-2a', label: 'ПК 2-1', zone: 'hall', x: 82, y: 45, width: 8, height: 4, capacity: 1 },
  { id: 'pc-hall-2b', label: 'ПК 2-2', zone: 'hall', x: 91, y: 45, width: 6, height: 4, capacity: 1 },

  // --- PS VIP (большая комната с PS у основного зала) ---
  { id: 'vip-ps-1', label: 'VIP PS 1', zone: 'vip', x: 2, y: 70, width: 18, height: 10, capacity: 4 },

  // --- 2 этаж: 4 PlayStation ---
  { id: 'ps-floor2-1', label: 'PS5 2эт-1', zone: 'ps', x: 55, y: 55, width: 20, height: 8, capacity: 2 },
  { id: 'ps-floor2-2', label: 'PS5 2эт-2', zone: 'ps', x: 76, y: 55, width: 20, height: 8, capacity: 2 },
  { id: 'ps-floor2-3', label: 'PS5 2эт-3', zone: 'ps', x: 55, y: 64, width: 20, height: 8, capacity: 2 },
  { id: 'ps-floor2-4', label: 'PS5 2эт-4', zone: 'ps', x: 76, y: 64, width: 20, height: 8, capacity: 2 },

  // --- Маленькая комната PS + 4ПК ---
  { id: 'room-ps-4pc', label: 'PS+4ПК', zone: 'room', x: 2, y: 82, width: 18, height: 8, capacity: 5 },

  // --- Коридор комнат ---
  // 3 ПК 600Hz
  { id: 'room-3pc-600', label: '3ПК 600Hz', zone: 'pro', x: 22, y: 75, width: 15, height: 8, capacity: 3 },
  // 5 ПК 600Hz
  { id: 'room-5pc-600', label: '5ПК 600Hz', zone: 'pro', x: 38, y: 75, width: 18, height: 8, capacity: 5 },
  // 11 ПК
  { id: 'room-11pc', label: '11 ПК', zone: 'hall', x: 55, y: 78, width: 22, height: 10, capacity: 11 },
  // 5 ПК OLED
  { id: 'room-5pc-oled', label: '5ПК OLED', zone: 'oled', x: 38, y: 85, width: 18, height: 10, capacity: 5 },
];

// Zone config
export const ZONE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  hall: { bg: 'rgba(0, 242, 254, 0.10)', border: 'rgba(0, 242, 254, 0.30)', text: '#00f2fe', glow: '' },
  vip: { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.40)', text: '#a855f7', glow: '' },
  ps: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.35)', text: '#3b82f6', glow: '' },
  room: { bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.35)', text: '#fbbf24', glow: '' },
  pro: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.30)', text: '#ef4444', glow: '' },
  oled: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)', text: '#10b981', glow: '' },
};

export const ZONE_LABELS: Record<string, string> = {
  hall: '🖥 Общий зал',
  vip: '👑 VIP PS',
  ps: '🎮 PlayStation (2эт)',
  room: '🎮 PS + ПК',
  pro: '⚡ PRO 600Hz',
  oled: '✨ OLED 4K',
};

export const WORKING_HOURS = 'Круглосуточно 24/7';

export const CONTACT = {
  address: 'г. Чебоксары, ул. Гагарина 40а',
  telegram: 'NHSC_founder',
  telegramUrl: 'https://t.me/NHSC_founder',
};

// Predefined hookah flavors
export const HOOKAH_FLAVORS = [
  { name: 'Двойное яблоко', category: 'Фрукты', emoji: '🍏' },
  { name: 'Манго-Маракуйя', category: 'Фрукты', emoji: '🥭' },
  { name: 'Персик-Лайм', category: 'Фрукты', emoji: '🍑' },
  { name: 'Грейпфрут-Мята', category: 'Фрукты', emoji: '🍊' },
  { name: 'Арбуз-Дыня', category: 'Фрукты', emoji: '🍉' },
  { name: 'Виноград-Ягоды', category: 'Фрукты', emoji: '🍇' },
  { name: 'Клубника-Мята', category: 'Ягоды', emoji: '🍓' },
  { name: 'Черника-Ежевика', category: 'Ягоды', emoji: '🫐' },
  { name: 'Малина-Личи', category: 'Ягоды', emoji: '🫐' },
  { name: 'Банан-Шоколад', category: 'Десерт', emoji: '🍌' },
  { name: 'Кокос-Ваниль', category: 'Десерт', emoji: '🥥' },
  { name: 'Лимон-Имбирь', category: 'Пряные', emoji: '🍋' },
  { name: 'Мята-Айс', category: 'Свежие', emoji: '🧊' },
  { name: 'Кактус-Фрост', category: 'Свежие', emoji: '🌵' },
  { name: 'Ледяной грейпфрут', category: 'Свежие', emoji: '❄️' },
  { name: 'Sport Mix (авторский)', category: 'Авторские', emoji: '🔥' },
  { name: 'Чебоксарский закат', category: 'Авторские', emoji: '🌅' },
  { name: 'Lounge Premium', category: 'Авторские', emoji: '💎' },
];

export const FLAVOR_CATEGORIES = ['Все', 'Фрукты', 'Ягоды', 'Десерт', 'Пряные', 'Свежие', 'Авторские'];
