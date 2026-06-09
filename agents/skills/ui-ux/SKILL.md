# UI/UX Pro Max Skill (адаптировано)
# Источник: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

## Описание
AI-скилл для дизайн-интеллекта: 161 правило дизайн-рассуждений, 67 стилей UI, генератор дизайн-систем.

## Ключевые возможности

### Design System Generator
Автоматическая генерация полной дизайн-системы по описанию проекта:
- Паттерн страницы (Hero-Centric, Dashboard, E-commerce, etc.)
- Стиль UI (Soft UI, Brutalism, Glassmorphism, Neumorphism, etc.)
- Цветовая палитра (5 цветов: primary, secondary, CTA, bg, text)
- Типографическая пара (heading + body)
- Ключевые эффекты и анимации
- Anti-patterns (чего избегать)
- Pre-delivery checklist

### Стиль для Sport Lounge
```
PATTERN: Hero-Centric + Social Proof
STYLE: Liquid Glass (custom Glassmorphism variant)
COLORS:
  Primary:    #1a1a2e (Deep Navy)
  Secondary:  #16213e (Dark Blue)
  Accent:     #e94560 (Coral Red)
  CTA:        #ffd700 (Gold)
  Background: #0f0f1a (Near Black)
  Text:       #eaeaea (Light Gray)
TYPOGRAPHY: Space Grotesk / Inter
EFFECTS: Glass blur, subtle glow, smooth transitions 200-300ms
AVOID: Bright backgrounds, heavy shadows, generic Bootstrap look
```

### Pre-Delivery Checklist
- [ ] No emojis as icons (use Lucide/Heroicons SVG)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Text contrast ≥ 4.5:1
- [ ] Focus states visible for keyboard navigation
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] Loading states (skeleton/spinner)
- [ ] Error states with recovery actions
- [ ] Empty states with call-to-action
