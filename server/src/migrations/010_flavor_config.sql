-- 010_flavor_config.sql
-- Add admin-configurable fields to mixes table for order form display

ALTER TABLE mixes ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '';
ALTER TABLE mixes ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Основные';
ALTER TABLE mixes ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '';

-- Update the existing seeded mixes with appropriate emojis and categories
UPDATE mixes SET emoji = '🍏', category = 'Фрукты', color = '#4CAF50' WHERE name = 'Darkside Base';
UPDATE mixes SET emoji = '🍌', category = 'Фрукты', color = '#FF9800' WHERE name = 'Must Have Банан';
UPDATE mixes SET emoji = '🍉', category = 'Фрукты', color = '#4CAF50' WHERE name = 'Element Арбуз';
UPDATE mixes SET emoji = '🫐', category = 'Ягоды', color = '#673AB7' WHERE name = 'Black Burn Черника';
UPDATE mixes SET emoji = '🍋', category = 'Фрукты', color = '#FFEB3B' WHERE name = 'Satyr Лимон';
UPDATE mixes SET emoji = '🧊', category = 'Свежие', color = '#00BCD4' WHERE name = 'Cloud9 Мята';
