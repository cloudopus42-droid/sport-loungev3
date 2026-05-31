-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  avatar TEXT,
  bio TEXT DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица бронирований
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seat_id VARCHAR(50) NOT NULL,
  seat_label VARCHAR(50) NOT NULL,
  seat_zone VARCHAR(50) NOT NULL,
  date VARCHAR(10) NOT NULL, -- YYYY-MM-DD
  time VARCHAR(5) NOT NULL, -- HH:mm
  guests_count INTEGER DEFAULT 1,
  phone VARCHAR(50) NOT NULL,
  hookah_mix TEXT NOT NULL,
  hookah_strength VARCHAR(50) DEFAULT 'medium',
  hookah_count INTEGER DEFAULT 1,
  hookah_status VARCHAR(50) DEFAULT 'accepted',
  hookah_status_updated_at TIMESTAMPTZ DEFAULT now(),
  comment TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица постов соцсети
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица лайков к постам (связь многие-ко-многим)
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- Таблица комментариев к постам
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица кальянных миксов
CREATE TABLE IF NOT EXISTS mixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  flavors TEXT[] DEFAULT '{}',
  strength INTEGER DEFAULT 5,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица промо-акций
CREATE TABLE IF NOT EXISTS promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  discount_percent INTEGER,
  badge_color VARCHAR(50) DEFAULT '#00f2fe',
  priority INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица витрины на главной
CREATE TABLE IF NOT EXISTS showcases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица приглашений (сборов)
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  image_url TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Участники сборов
CREATE TABLE IF NOT EXISTS invitation_participants (
  invitation_id UUID REFERENCES invitations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (invitation_id, user_id)
);

-- Таблица сториз
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url TEXT NOT NULL,
  media_type VARCHAR(50) DEFAULT 'image',
  duration_seconds INTEGER DEFAULT 5,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица конфигурации столов (карта зала)
CREATE TABLE IF NOT EXISTS seat_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seats JSONB NOT NULL DEFAULT '[]',
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_seat_availability ON bookings (seat_id, date, time) WHERE status != 'cancelled';

-- Вставка дефолтного админа (пароль 'admin123', зашифрованный с помощью bcrypt - $2a$12$R.S4Z3N2l/J3G4WpQ7T3kO.BaeU4p.G/O9.YOmOyeCj8O7L5w7t0K)
-- Вы можете поменять его при первом входе
INSERT INTO users (email, password, name, role)
VALUES ('admin@sportlounge.ru', '$2a$12$R.S4Z3N2l/J3G4WpQ7T3kO.BaeU4p.G/O9.YOmOyeCj8O7L5w7t0K', 'Администратор', 'admin')
ON CONFLICT (email) DO NOTHING;
