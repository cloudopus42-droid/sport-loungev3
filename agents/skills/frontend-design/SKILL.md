# Frontend Design Skill (адаптировано из Claude Code)
# Источник: https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md

## Описание
Скилл для создания distinctive, production-grade frontend интерфейсов с высоким качеством дизайна. Избегает generic "AI slop" эстетики.

## Design Thinking

Перед кодированием:
1. **Purpose**: Какую проблему решает интерфейс? Кто пользователь?
2. **Tone**: Выбери BOLD направление — brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian
3. **Constraints**: Технические требования (framework, performance, accessibility)
4. **Differentiation**: Что делает это НЕЗАБЫВАЕМЫМ?

## Frontend Aesthetics Guidelines

### Типографика
- Выбирай красивые, уникальные шрифты
- ИЗБЕГАЙ: Arial, generic sans-serif
- Используй: distinctive choices from Google Fonts
- Для Sport Lounge: Space Grotesk (headings) + Inter (body)

### Цвет
- Curated, harmonious палитры
- Избегай generic #ff0000, #00ff00
- Используй HSL для точных оттенков
- Dark mode: bg не чёрный (#000), а deep navy/charcoal

### Анимации
- Subtle, purposeful
- 200-300ms duration
- ease-out для входа, ease-in для выхода
- НЕТ бесцельным bounce/wobble

### Layout
- CSS Grid для page layout
- Flexbox для component layout
- Gap вместо margin между элементами
- Container queries где поддерживается

## Реализация для Sport Lounge

```tsx
// Пример компонента в стиле Liquid Glass
const GlassCard = ({ children, className = '' }) => (
  <div className={`
    backdrop-blur-xl bg-white/5 
    border border-white/10 
    rounded-2xl p-6
    shadow-[0_8px_32px_rgba(0,0,0,0.3)]
    hover:bg-white/8 hover:border-white/20
    transition-all duration-300 ease-out
    ${className}
  `}>
    {children}
  </div>
);
```
