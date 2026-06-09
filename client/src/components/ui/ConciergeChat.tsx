import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ConciergeChat() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
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
    if (isOpen) {
      setTimeout(scrollToBottom, 80);
    }
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
    
    // Add user message to state
    const updatedMessages = [...messages, { role: 'user', content: userMsg } as Message];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Call backend AI concierge assistant
      const { data } = await api.post<{ response: string }>('/api/ai/chat', {
        message: userMsg,
        history: updatedMessages.slice(0, -1) // omit the last user message as it is passed separately
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err: any) {
      showToast('Не удалось связаться с консьержем', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[45]">
      {/* 1. Floating Gold Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full glass-btn-gold flex items-center justify-center text-white shadow-glow-gold hover:shadow-glow-gold-lg outline-none transition-all flex-shrink-0 cursor-pointer"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" className="relative" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <MessageSquare className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border border-black animate-ping" />
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border border-black" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 2. Collapsible Glassmorphic Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-0 sm:absolute sm:bottom-18 w-[calc(100vw-2rem)] sm:w-96 h-[480px] glass-card overflow-hidden shadow-2xl flex flex-col z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-accent-gold/10 to-transparent px-4 py-3.5 border-b border-glass-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent-gold/15 flex items-center justify-center border border-accent-gold/30">
                  <Bot className="w-4 h-4 text-accent-gold" />
                </div>
                <div>
                  <div className="text-xs font-display font-bold text-white tracking-wider uppercase flex items-center gap-1">
                    Luxury Concierge <Sparkles className="w-3 h-3 text-accent-gold" />
                  </div>
                  <div className="text-[9px] text-green-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> На связи 24/7
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
              {messages.map((msg, index) => {
                const isAI = msg.role === 'assistant';
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed transition-all ${
                        isAI
                          ? 'glass-card border border-white/10 text-white/90 shadow-sm'
                          : 'glass-btn-gold font-semibold shadow-md border border-white/25'
                      }`}
                    >
                      {msg.content.split('\n').map((line, idx) => (
                        <p key={idx} className={idx > 0 ? 'mt-1' : ''}>{line}</p>
                      ))}
                    </div>
                  </motion.div>
                );
              })}

              {/* Glowing Sommelier Typing anim */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-glass-bg border border-glass-border px-4 py-3 rounded-2xl flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-glass-border bg-black/20">
              {isAuthenticated ? (
                <form onSubmit={handleSend} className="flex gap-2 relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Напишите сомелье..."
                    disabled={loading}
                    className="w-full pl-4 pr-10 py-2.5 text-xs text-white bg-white/5 border border-glass-border rounded-xl outline-none focus:border-accent-gold/45 focus:bg-white/10 transition-all placeholder-white/30"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || loading}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-accent-gold hover:text-white disabled:text-white/20 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <a
                  href={`${import.meta.env.BASE_URL}login`}
                  className="w-full py-2.5 bg-white/5 border border-glass-border hover:border-accent-gold/40 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-white/70 hover:text-white transition-all"
                >
                  <LogIn className="w-4 h-4 text-accent-gold" /> Войдите для общения с сомелье
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default ConciergeChat;

