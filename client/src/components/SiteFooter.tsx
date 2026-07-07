import { NavLink } from 'react-router-dom';
import { MapPin, Clock, Send } from 'lucide-react';
import { CONTACT, WORKING_HOURS } from '@/config/seats';

const footerNav = [
  { label: 'Главная', to: '/' },
  { label: 'Заказ', to: '/booking' },
  { label: 'Профиль', to: '/profile' },
  { label: 'Политика cookie', to: '/cookie-policy' },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-16 border-t border-white/5 bg-[#12100d]/60">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 select-none">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">SPORT</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white">LOUNGE</span>
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed font-light max-w-[220px]">
              Премиальная кальянная и лаунж-клуб. Авторские миксы, изысканное обслуживание и атмосфера для отдыха.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Навигация в футере" className="space-y-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 block">Навигация</span>
            <ul className="space-y-2">
              {footerNav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className="text-[11px] text-white/45 hover:text-[#FFBF00] transition-colors font-light"
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contacts */}
          <div className="space-y-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 block">Контакты</span>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://yandex.ru/maps/?pt=47.2725,56.1366&z=17&l=map"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-[11px] text-white/45 hover:text-[#FFBF00] transition-colors font-light"
                >
                  <MapPin className="w-3.5 h-3.5 mt-px flex-shrink-0 text-[#FFBF00]/60" />
                  {CONTACT.address}
                </a>
              </li>
              <li className="flex items-start gap-2 text-[11px] text-white/45 font-light">
                <Clock className="w-3.5 h-3.5 mt-px flex-shrink-0 text-[#FFBF00]/60" />
                {WORKING_HOURS}
              </li>
              <li>
                <a
                  href={CONTACT.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-[11px] text-white/45 hover:text-[#FFBF00] transition-colors font-light"
                >
                  <Send className="w-3.5 h-3.5 mt-px flex-shrink-0 text-[#FFBF00]/60" />
                  {'@' + CONTACT.telegram}
                </a>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 block">Заказ за стол</span>
            <p className="text-[11px] text-white/40 leading-relaxed font-light">
              Соберите свой кальян и закажите прямо за стол в пару кликов.
            </p>
            <NavLink
              to="/booking"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#FFBF00]/30 text-[#FFBF00] font-mono text-[10px] uppercase tracking-wider hover:bg-[#FFBF00]/10 hover:border-[#FFBF00]/50 transition-all rounded-lg"
            >
              Сделать заказ
            </NavLink>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25">
            &copy; {year} Sport Lounge. Все права защищены.
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25">
            18+ Только для совершеннолетних
          </p>
        </div>
      </div>
    </footer>
  );
}
