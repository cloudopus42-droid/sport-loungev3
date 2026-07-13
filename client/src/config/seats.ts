export const WORKING_HOURS = 'Круглосуточно 24/7';

export const CONTACT = {
  address: 'г. Чебоксары, ул. Гагарина 40а',
  telegram: 'NHSC_founder',
  telegramUrl: 'https://t.me/NHSC_founder',
};

export interface Seat {
  id: string;
  label: string;
  zone: string;
  zoneLabel: string;
}

export const ZONES = [
  { id: 'vip3pc', label: 'VIP Комната (3 ПК)', icon: '🖥️' },
  { id: 'vip5pc', label: 'VIP Комната (5 ПК)', icon: '🖥️' },
  { id: 'vip11pc', label: 'VIP Комната (11 ПК)', icon: '🖥️' },
  { id: 'vip5oled', label: 'VIP Комната (5 OLED PC)', icon: '✨' },
  { id: 'bigps', label: 'Общий зал Big PS', icon: '🎮' },
  { id: 'smallps', label: 'Общий зал Small PS', icon: '🎮' },
] as const;

export type ZoneId = typeof ZONES[number]['id'];

export const SEATS: Seat[] = [
  // VIP 3 ПК
  { id: 'vip3pc-1', label: 'VIP 3ПК — Место 1', zone: 'vip3pc', zoneLabel: 'VIP (3 ПК)' },
  { id: 'vip3pc-2', label: 'VIP 3ПК — Место 2', zone: 'vip3pc', zoneLabel: 'VIP (3 ПК)' },
  { id: 'vip3pc-3', label: 'VIP 3ПК — Место 3', zone: 'vip3pc', zoneLabel: 'VIP (3 ПК)' },
  // VIP 5 ПК
  { id: 'vip5pc-1', label: 'VIP 5ПК — Место 1', zone: 'vip5pc', zoneLabel: 'VIP (5 ПК)' },
  { id: 'vip5pc-2', label: 'VIP 5ПК — Место 2', zone: 'vip5pc', zoneLabel: 'VIP (5 ПК)' },
  { id: 'vip5pc-3', label: 'VIP 5ПК — Место 3', zone: 'vip5pc', zoneLabel: 'VIP (5 ПК)' },
  { id: 'vip5pc-4', label: 'VIP 5ПК — Место 4', zone: 'vip5pc', zoneLabel: 'VIP (5 ПК)' },
  { id: 'vip5pc-5', label: 'VIP 5ПК — Место 5', zone: 'vip5pc', zoneLabel: 'VIP (5 ПК)' },
  // VIP 11 ПК
  { id: 'vip11pc-1', label: 'VIP 11ПК — Место 1', zone: 'vip11pc', zoneLabel: 'VIP (11 ПК)' },
  { id: 'vip11pc-2', label: 'VIP 11ПК — Место 2', zone: 'vip11pc', zoneLabel: 'VIP (11 ПК)' },
  { id: 'vip11pc-3', label: 'VIP 11ПК — Место 3', zone: 'vip11pc', zoneLabel: 'VIP (11 ПК)' },
  { id: 'vip11pc-4', label: 'VIP 11ПК — Место 4', zone: 'vip11pc', zoneLabel: 'VIP (11 ПК)' },
  { id: 'vip11pc-5', label: 'VIP 11ПК — Место 5', zone: 'vip11pc', zoneLabel: 'VIP (11 ПК)' },
  { id: 'vip11pc-6', label: 'VIP 11ПК — Место 6', zone: 'vip11pc', zoneLabel: 'VIP (11 ПК)' },
  { id: 'vip11pc-7', label: 'VIP 11ПК — Место 7', zone: 'vip11pc', zoneLabel: 'VIP (11 ПК)' },
  { id: 'vip11pc-8', label: 'VIP 11ПК — Место 8', zone: 'vip11pc', zoneLabel: 'VIP (11 ПК)' },
  { id: 'vip11pc-9', label: 'VIP 11ПК — Место 9', zone: 'vip11pc', zoneLabel: 'VIP (11 ПК)' },
  { id: 'vip11pc-10', label: 'VIP 11ПК — Место 10', zone: 'vip11pc', zoneLabel: 'VIP (11 ПК)' },
  { id: 'vip11pc-11', label: 'VIP 11ПК — Место 11', zone: 'vip11pc', zoneLabel: 'VIP (11 ПК)' },
  // VIP 5 OLED PC
  { id: 'vip5oled-1', label: 'VIP OLED — Место 1', zone: 'vip5oled', zoneLabel: 'VIP (5 OLED)' },
  { id: 'vip5oled-2', label: 'VIP OLED — Место 2', zone: 'vip5oled', zoneLabel: 'VIP (5 OLED)' },
  { id: 'vip5oled-3', label: 'VIP OLED — Место 3', zone: 'vip5oled', zoneLabel: 'VIP (5 OLED)' },
  { id: 'vip5oled-4', label: 'VIP OLED — Место 4', zone: 'vip5oled', zoneLabel: 'VIP (5 OLED)' },
  { id: 'vip5oled-5', label: 'VIP OLED — Место 5', zone: 'vip5oled', zoneLabel: 'VIP (5 OLED)' },
  // Общий зал Big PS
  { id: 'bigps-1', label: 'Big PS — Стол 1', zone: 'bigps', zoneLabel: 'Общий зал (Big PS)' },
  { id: 'bigps-2', label: 'Big PS — Стол 2', zone: 'bigps', zoneLabel: 'Общий зал (Big PS)' },
  { id: 'bigps-3', label: 'Big PS — Стол 3', zone: 'bigps', zoneLabel: 'Общий зал (Big PS)' },
  { id: 'bigps-4', label: 'Big PS — Стол 4', zone: 'bigps', zoneLabel: 'Общий зал (Big PS)' },
  // Общий зал Small PS
  { id: 'smallps-1', label: 'Small PS — Стол 1', zone: 'smallps', zoneLabel: 'Общий зал (Small PS)' },
  { id: 'smallps-2', label: 'Small PS — Стол 2', zone: 'smallps', zoneLabel: 'Общий зал (Small PS)' },
  { id: 'smallps-3', label: 'Small PS — Стол 3', zone: 'smallps', zoneLabel: 'Общий зал (Small PS)' },
  { id: 'smallps-4', label: 'Small PS — Стол 4', zone: 'smallps', zoneLabel: 'Общий зал (Small PS)' },
];
