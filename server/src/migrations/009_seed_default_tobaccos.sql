DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM mixes LIMIT 1) THEN
    INSERT INTO mixes (name, manufacturer, description, flavors, strength, status, weight_grams) VALUES
      ('Base', 'Darkside', 'Классическая крепкая линейка с насыщенным вкусом', ARRAY['Базилик', 'Мята', 'Грейпфрут'], 8, 'active', 50),
      ('Banana', 'Must Have', 'Сладкий банановый вкус с кремовыми нотками', ARRAY['Банан', 'Крем', 'Ваниль'], 6, 'active', 50),
      ('Watermelon', 'Element', 'Освежающий арбузный микс для летнего настроения', ARRAY['Арбуз', 'Мята', 'Лёд'], 5, 'active', 100),
      ('Kiwi', 'Black Burn', 'Кислинка киви с лёгкой сладостью', ARRAY['Киви', 'Крыжовник', 'Лайм'], 7, 'active', 100),
      ('Peach', 'Tangiers', 'Премиальный персиковый вкус с долгим послевкусием', ARRAY['Персик', 'Абрикос', 'Мёд'], 9, 'active', 50),
      ('Mango', 'Duft', 'Тропический манго с лёгкими цветочными нотками', ARRAY['Манго', 'Маракуйя', 'Цветы'], 4, 'active', 50);
  END IF;
END $$;
