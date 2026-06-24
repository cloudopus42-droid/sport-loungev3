import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, Sparkles, LogIn, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFeature } from '@/contexts/FeatureContext';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ConciergeChat() {
  const { isAuthenticated } = useAuth();
  const { isFeatureEnabled } = useFeature();
  const [isOpen, setIsOpen] = useState(false);
  const conciergeEnabled = isFeatureEnabled('concierge_chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Приветствую вас в закрытом клубе SPORT LOUNGE. Я — ваш персональный консьерж-сомелье. Желаете ли вы выбрать роскошную VIP-комнату на вечер, собрать эксклюзивный табачный бленд во Flask-микшере или узнать баланс вашей клубной карты лояльности?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(scrollToBottom, 80);
    return () => clearTimeout(timer);
  }, [isOpen, messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    if (!isAuthenticated) {
      showToast('Пожалуйста, авторизуйтесь для общения с консьержем', 'error');
      return;
    }

    const userMsg = inputValue.trim();
    setInputValue('');

    const updatedMessages = [...messages, { role: 'user', content: userMsg } as Message];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const { data } = await api.post('/api/ai/chat', {
        message: userMsg,
        history: updatedMessages.slice(0, -1)
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err: any) {
      showToast('Не удалось связаться с консьержем', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!conciergeEnabled) return null;

  return (
    <div className="fixed right-0 z-[45] bottom-[88px] lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
      <motion.div
        animate={{ width: isOpen ? 360 : 28 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="relative h-[440px] lg:h-[520px]"
      >
        {/* Glass background layer */}
        <div className="absolute inset-0 bg-[rgba(13,15,19,0.82)] backdrop-blur-[24px] border border-[rgba(255,191,0,0.1)] border-r-0 rounded-l-xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden" />

        {/* Shimmer overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-l-xl">
          <div className="absolute inset-0 bg-[length:200%_100%] bg-[linear-gradient(90deg,transparent_0%,rgba(255,191,0,0.03)_30%,rgba(255,191,0,0.06)_50%,rgba(255,191,0,0.03)_70%,transparent_100%)] animate-shimmer" />
        </div>

        {/* Flag handle — always visible on the right edge */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-0 top-0 bottom-0 w-7 flex flex-col items-center justify-center gap-2 cursor-pointer z-20 bg-[rgba(15,12,10,0.3)] backdrop-blur-[20px] rounded-l-xl border-l border-[rgba(255,191,0,0.06)] hover:bg-[rgba(15,12,10,0.5)] transition-colors"
          aria-label={isOpen ? 'Закрыть чат' : 'Открыть чат'}
        >
          <MessageSquare className="w-4 h-4 text-accent-gold" />
          <div className="w-1 h-1 rounded-full bg-accent-gold/40 animate-pulse" />
          <div className="w-1 h-1 rounded-full bg-accent-gold/20" />
          <ChevronLeft className={`w-3 h-3 text-white/30 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Chat content panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-7 top-0 bottom-0 flex flex-col"
            >
              {/* Header */}
              <div className="border-b border-[rgba(255,191,0,0.08)] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent-gold/10 flex items-center justify-center border border-accent-gold/20">
                    <Bot className="w-3.5 h-3.5 text-accent-gold" />
                  </div>
                  <div>
                    <div className="text-[11px] font-display font-bold text-white tracking-wider uppercase flex items-center gap-1">
                      Консьерж <Sparkles className="w-2.5 h-2.5 text-accent-gold" />
                    </div>
                    <div className="text-[8px] text-green-400/80 font-semibold flex items-center gap-1">
                      <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse" /> На связи 24/7
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/25 hover:text-white/60 transition-colors p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                {messages.map((msg, index) => {
                  const isAI = msg.role === 'assistant';
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                        isAI
                          ? 'bg-white/[0.04] border border-white/[0.06] text-white/80'
                          : 'bg-accent-gold/15 text-white/90 border border-accent-gold/20'
                      }`}>
                        {msg.content.split('\n').map((line, idx) => (
                          <p key={idx} className={idx > 0 ? 'mt-1' : ''}>{line}</p>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-white/[0.04] border border-white/[0.06] px-3 py-2 rounded-xl flex items-center gap-1">
                      <span className="w-1 h-1 bg-accent-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-accent-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-accent-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-[rgba(255,191,0,0.08)]">
                {isAuthenticated ? (
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Напишите сомелье..."
                      disabled={loading}
                      className="flex-1 px-3 py-2 text-xs text-white bg-white/5 border border-white/10 rounded-lg outline-none focus:border-accent-gold/35 focus:bg-white/[0.07] transition-all placeholder-white/25"
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || loading}
                      className="text-accent-gold hover:text-white disabled:text-white/15 transition-colors p-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <a
                    href={`${import.meta.env.BASE_URL}login`}
                    className="w-full py-2 bg-white/5 border border-white/10 hover:border-accent-gold/30 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white/60 hover:text-white transition-all"
                  >
                    <LogIn className="w-3 h-3 text-accent-gold" /> Войдите для общения
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
export default ConciergeChat;
