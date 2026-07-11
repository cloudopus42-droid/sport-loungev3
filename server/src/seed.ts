import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { supabase } from './config/supabase';

async function retryDb<T>(fn: () => any, attempts: number = 4): Promise<T> {
  let lastError: any = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      const result = await fn();
      if (result && result.error) throw result.error;
      return result?.data as T;
    } catch (err: any) {
      lastError = err;
      console.warn(`⚠️ Supabase connection attempt ${i}/${attempts} failed:`, err.message || err);
      if (i < attempts) {
        await new Promise(r => setTimeout(r, i * 2000));
      }
    }
  }
  throw lastError;
}

async function seed(): Promise<void> {
  try {
    console.log('🌱 Starting Supabase Seeding...');

    // 1. Очищаем таблицы (в обратном порядке связей)
    console.log('🗑️  Cleaning up tables...');
    await retryDb(() => supabase.from('post_likes').delete().neq('post_id', '00000000-0000-0000-0000-000000000000'));
    await retryDb(() => supabase.from('post_comments').delete().neq('post_id', '00000000-0000-0000-0000-000000000000'));
    await retryDb(() => supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    await retryDb(() => supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    await retryDb(() => supabase.from('mixes').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    await retryDb(() => supabase.from('promos').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    await retryDb(() => supabase.from('showcases').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    await retryDb(() => supabase.from('invitation_participants').delete().neq('invitation_id', '00000000-0000-0000-0000-000000000000'));
    await retryDb(() => supabase.from('invitations').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    await retryDb(() => supabase.from('stories').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    await retryDb(() => supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    console.log('✅ Tables cleaned');

    // 2. Создаем пользователей
    console.log('👤 Hashing passwords and creating users...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('password123', 12);

    const admin = await retryDb<{ id: string }>(() => supabase
      .from('users')
      .insert({
        email: 'admin@sportlounge.ru',
        password: adminPassword,
        name: 'Администратор',
        role: 'admin',
      })
      .select('id')
      .single()
    );
    console.log(`  ✅ Admin created (admin@sportlounge.ru / admin123)`);

    const user1 = await retryDb<{ id: string }>(() => supabase
      .from('users')
      .insert({
        email: 'ivan@example.com',
        password: userPassword,
        name: 'Иван Петров',
        role: 'user',
        phone: '+79998887766'
      })
      .select('id')
      .single()
    );
    console.log(`  ✅ User 1 created: ivan@example.com`);

    const user2 = await retryDb<{ id: string }>(() => supabase
      .from('users')
      .insert({
        email: 'maria@example.com',
        password: userPassword,
        name: 'Мария Сидорова',
        role: 'user',
      })
      .select('id')
      .single()
    );
    console.log(`  ✅ User 2 created: maria@example.com`);

    // 3. Создаем посты
    console.log('📝 Creating posts...');
    const posts = await retryDb<any[]>(() => supabase
      .from('posts')
      .insert([
        {
          title: 'Открытие нового зала',
          description: 'Мы рады представить вам наш обновлённый VIP зал с панорамным видом на город!',
          image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600',
          likes: 15,
          author_id: admin.id,
        },
        {
          title: 'Новинки в меню',
          description: 'Попробуйте наши фирменные коктейли и закуски, разработанные нашим шеф-поваром',
          image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=600',
          likes: 23,
          author_id: admin.id,
        },
        {
          title: 'Вечер живой музыки',
          description: 'Каждую пятницу в SPORT LOUNGE — живая музыка от лучших исполнителей города',
          image_url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600',
          likes: 42,
          author_id: admin.id,
        },
      ])
      .select('id')
    );
    console.log(`  ✅ Created ${posts?.length} posts`);

    // 4. Создаем миксы
    console.log('🍃 Creating hookah mixes...');
    const mixes = await retryDb<any[]>(() => supabase
      .from('mixes')
      .insert([
        {
          name: 'Base',
          manufacturer: 'Darkside',
          description: 'Классическая крепкая линейка с насыщенным вкусом',
          flavors: ['Базилик', 'Мята', 'Грейпфрут'],
          strength: 8,
          status: 'active',
        },
        {
          name: 'Banana',
          manufacturer: 'Must Have',
          description: 'Сладкий банановый вкус с кремовыми нотками',
          flavors: ['Банан', 'Крем', 'Ваниль'],
          strength: 6,
          status: 'active',
        },
        {
          name: 'Watermelon',
          manufacturer: 'Element',
          description: 'Освежающий арбузный микс для летнего настроения',
          flavors: ['Арбуз', 'Мята', 'Лёд'],
          strength: 5,
          status: 'active',
        },
        {
          name: 'Kiwi',
          manufacturer: 'Black Burn',
          description: 'Кислинка киви с лёгкой сладостью',
          flavors: ['Киви', 'Крыжовник', 'Лайм'],
          strength: 7,
          status: 'active',
        },
        {
          name: 'Peach',
          manufacturer: 'Tangiers',
          description: 'Премиальный персиковый вкус с долгим послевкусием',
          flavors: ['Персик', 'Абрикос', 'Мёд'],
          strength: 9,
          status: 'active',
        },
        {
          name: 'Mango',
          manufacturer: 'Duft',
          description: 'Тропический манго с лёгкими цветочными нотками',
          flavors: ['Манго', 'Маракуйя', 'Цветы'],
          strength: 4,
          status: 'active',
        },
      ])
      .select('id')
    );
    console.log(`  ✅ Created ${mixes?.length} mixes`);

    // 5. Создаем промо-акции
    console.log('🎉 Creating promos...');
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const promos = await retryDb<any[]>(() => supabase
      .from('promos')
      .insert([
        {
          title: 'Happy Hours — скидка 30%',
          description: 'Каждый будний день с 14:00 до 18:00 скидка 30% на все кальяны!',
          discount_percent: 30,
          badge_color: '#00f2fe',
          priority: 10,
          start_date: now.toISOString(),
          end_date: nextMonth.toISOString(),
          is_active: true,
        },
        {
          title: 'День рождения в SPORT LOUNGE',
          description: 'Отпразднуйте день рождения у нас и получите бесплатный кальян для именинника + скидку 20% для всей компании!',
          discount_percent: 20,
          badge_color: '#ff6b6b',
          priority: 8,
          is_active: true,
        },
      ])
      .select('id')
    );
    console.log(`  ✅ Created ${promos?.length} promos`);

    // 6. Создаем сториз
    console.log('📸 Creating stories...');
    const stories = await retryDb<any[]>(() => supabase
      .from('stories')
      .insert([
        {
          media_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600',
          media_type: 'image',
          duration_seconds: 5,
          sort_order: 1,
          is_active: true,
        },
        {
          media_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=600',
          media_type: 'image',
          duration_seconds: 5,
          sort_order: 2,
          is_active: true,
        },
      ])
      .select('id')
    );
    console.log(`  ✅ Created ${stories?.length} stories`);

    // 7. Создаем приглашения (сборы)
    console.log('💌 Creating invitations...');
    const eventDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const invitations = await retryDb<any[]>(() => supabase
      .from('invitations')
      .insert([
        {
          title: 'Кальянный баттл',
          description: 'Турнир среди кальянных мастеров! Приходите болеть за участников или зарегистрируйтесь сами. Призы и подарки для всех!',
          date_time: eventDate.toISOString(),
          location: 'SPORT LOUNGE, Основной зал',
          max_participants: 100,
          current_participants: 10,
          status: 'published',
        },
      ])
      .select('id')
    );
    console.log(`  ✅ Created ${invitations?.length} invitations`);

    console.log('\n🎉 Supabase Database Seeded Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Admin login: admin@sportlounge.ru / admin123`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
