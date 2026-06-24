import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Crown, AlertCircle, Eye, EyeOff, User, Sparkles, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [flipping, setFlipping] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, loginWithGoogle, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const flip = () => {
    setFlipping(true);
    setError('');
    setTimeout(() => {
      setIsLogin(!isLogin);
      setFlipping(false);
    }, 300);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const savedUser = localStorage.getItem('user');
      const role = savedUser ? JSON.parse(savedUser).role : null;
      navigate(role === 'admin' ? '/admin' : redirectUrl, { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      setError(axiosErr.response?.data?.error || axiosErr.response?.data?.message || 'Ошибка авторизации');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Пароли не совпадают'); return; }
    if (password.length < 6) { setError('Пароль должен содержать минимум 6 символов'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate(redirectUrl, { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      setError(axiosErr.response?.data?.error || axiosErr.response?.data?.message || 'Ошибка регистрации');
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try { await loginWithGoogle(); }
    catch (err: any) { setError(err.message || 'Не удалось запустить вход через Google'); setGoogleLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-dark-bg">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#B08D57] opacity-[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-[#B08D57] opacity-[0.02] blur-[120px] rounded-full pointer-events-none" />

      {/* Decorative SVG pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="loginGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#B08D57" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loginGrid)" />
        </svg>
      </div>

      <div className="w-full max-w-sm relative perspective-[1000px]">
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#B08D57] to-[#B08D57] flex items-center justify-center shadow-[0_0_24px_rgba(176,141,87,0.1)] mb-4">
            <Crown className="w-8 h-8 text-[#0b0807]" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-wide">SPORT LOUNGE</h1>
          <p className="text-sm text-white/40 mt-1">
            {isLogin ? 'Войдите в свой аккаунт' : 'Создайте аккаунт'}
          </p>
        </motion.div>

        {/* Flip container */}
        <div
          className="relative preserve-3d"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <motion.div
            className="w-full"
            animate={{ rotateY: isLogin ? 0 : 180 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front: Login */}
            <motion.form
              onSubmit={handleLogin}
              className="glass-card p-6 space-y-5"
              style={{ backfaceVisibility: 'hidden' }}
              animate={{ opacity: isLogin ? 1 : 0 }}
            >
              <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-2">
                <div className="w-7 h-7 rounded-lg bg-[rgba(176,141,87,0.1)] flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-[#B08D57]" />
                </div>
                <h2 className="text-sm font-semibold text-white font-heading">Вход</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-white/50 mb-1.5 font-medium uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#B08D57] focus:outline-none transition-colors placeholder:text-white/20"
                      required autoComplete="email" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 mb-1.5 font-medium uppercase tracking-wider">Пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:border-[#B08D57] focus:outline-none transition-colors placeholder:text-white/20"
                      required autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-white/30 hover:text-white/60 transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#B08D57] to-[#B08D57] text-[#0b0807] text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(176,141,87,0.08)] hover:shadow-[0_0_28px_rgba(176,141,87,0.15)] transition-all duration-300"
              >
                {loading ? <div className="w-4 h-4 border-2 border-[#0b0807] border-t-transparent rounded-full animate-spin mx-auto" /> : 'Войти'}
              </button>

              <div className="flex items-center my-2">
                <div className="flex-1 border-t border-white/5"></div>
                <span className="px-3 text-[9px] text-white/20 font-semibold tracking-wider">ИЛИ</span>
                <div className="flex-1 border-t border-white/5"></div>
              </div>

              <button type="button" onClick={handleGoogleLogin} disabled={loading || googleLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs flex items-center justify-center gap-2.5 transition-all hover:border-[#B08D57]/30 hover:text-[#B08D57]"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-[#B08D57] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                )}
                Google
              </button>

              <p className="text-center text-xs text-white/40 pt-1">
                Нет аккаунта?{' '}
                <button type="button" onClick={flip}
                  className="text-[#B08D57] hover:text-[#B08D57]/80 transition-colors font-medium underline underline-offset-2 decoration-[rgba(176,141,87,0.3)]"
                >Зарегистрироваться</button>
              </p>
            </motion.form>
          </motion.div>
        </div>

        {/* Register form — shown with flip animation */}
        <AnimatePresence mode="wait">
          {!isLogin && (
            <motion.div
              key="register"
              initial={{ opacity: 0, rotateY: -180 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 180 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0"
              style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
            >
              <form onSubmit={handleRegister} className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-2">
                  <button aria-label="Назад" type="button" onClick={flip} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-white/50" />
                  </button>
                  <div className="w-7 h-7 rounded-lg bg-[rgba(176,141,87,0.1)] flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-[#B08D57]" />
                  </div>
                  <h2 className="text-sm font-semibold text-white font-heading">Регистрация</h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1.5 font-medium uppercase tracking-wider">Имя</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="Ваше имя"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#B08D57] focus:outline-none transition-colors placeholder:text-white/20"
                        required autoComplete="name" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1.5 font-medium uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#B08D57] focus:outline-none transition-colors placeholder:text-white/20"
                        required autoComplete="email" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1.5 font-medium uppercase tracking-wider">Пароль</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Минимум 6 символов"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:border-[#B08D57] focus:outline-none transition-colors placeholder:text-white/20"
                        required minLength={6} autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-white/30 hover:text-white/60 transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1.5 font-medium uppercase tracking-wider">Подтвердите пароль</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Повторите пароль"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:border-[#B08D57] focus:outline-none transition-colors placeholder:text-white/20"
                        required minLength={6} autoComplete="new-password" />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-white/30 hover:text-white/60 transition-colors" tabIndex={-1}>
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#B08D57] to-[#B08D57] text-[#0b0807] text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(176,141,87,0.08)] hover:shadow-[0_0_28px_rgba(176,141,87,0.15)] transition-all duration-300"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-[#0b0807] border-t-transparent rounded-full animate-spin mx-auto" /> : 'Создать аккаунт'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer links */}
        {isLogin && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-[10px] text-white/20 mt-6"
          >
            Нажимая «Войти», вы соглашаетесь с{' '}
            <span className="text-white/30 hover:text-white/50 cursor-pointer">условиями использования</span>
          </motion.p>
        )}
      </div>
    </div>
  );
}
