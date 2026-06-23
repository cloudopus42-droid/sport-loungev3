import { motion } from 'framer-motion';
import { Cookie, Shield, Database, Eye } from 'lucide-react';

export function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 24 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent-gold/10 flex items-center justify-center">
            <Cookie className="w-6 h-6 text-accent-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">Политика использования куки</h1>
            <p className="text-sm text-white/40">Последнее обновление: 24 июня 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-white/70 leading-relaxed">
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-accent-gold" />
              <h2 className="text-base font-heading font-semibold text-white">Что такое куки?</h2>
            </div>
            <p>Куки — это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении сайта. Они помогают сайту запоминать ваши действия и настройки.</p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-accent-gold" />
              <h2 className="text-base font-heading font-semibold text-white">Типы куки</h2>
            </div>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Необходимые</strong> — обеспечивают базовую функциональность сайта (авторизация, корзина). Всегда включены.</li>
              <li><strong className="text-white">Аналитические</strong> — помогают анализировать, как пользователи взаимодействуют с сайтом.</li>
              <li><strong className="text-white">Функциональные</strong> — запоминают ваши предпочтения (язык, тема).</li>
              <li><strong className="text-white">Рекламные</strong> — используются для показа персонализированной рекламы.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-accent-gold" />
              <h2 className="text-base font-heading font-semibold text-white">Сторонние сервисы</h2>
            </div>
            <p>Мы используем следующие сторонние сервисы, которые могут устанавливать свои куки:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Google Analytics — аналитика посещаемости</li>
              <li>Яндекс.Метрика — аналитика для российских пользователей</li>
              <li>Telegram — виджет обратной связи</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-accent-gold" />
              <h2 className="text-base font-heading font-semibold text-white">Управление куки</h2>
            </div>
            <p>Вы можете изменить настройки куки в любой момент через панель настроек. Необходимые куки отключить нельзя — они критически важны для работы сайта.</p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
