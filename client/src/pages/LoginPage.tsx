import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Crown, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
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
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Не удалось запустить вход через Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">

      <div className="float-orb-1" />
      <div className="float-orb-2" />
      <div className="float-orb-3" />

      <motion.div
        className="w-full max-w-sm relative"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent-gold via-yellow-500 to-accent-burgundy flex items-center justify-center shadow-glow-gold mb-4 border border-yellow-200/20">
            <Crown className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-wide">SPORT LOUNGE</h1>
          <p className="text-sm text-white/40 mt-1">Вход в аккаунт</p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="glass-card p-6 space-y-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="glass-input pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input pl-10 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <motion.div
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="gold-btn w-full py-2.5 text-sm font-heading font-bold"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            ) : 'Войти'}
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-white/5"></div>
            <span className="px-3 text-[10px] text-white/20 font-semibold tracking-wider">ИЛИ</span>
            <div className="flex-1 border-t border-white/5"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm flex items-center justify-center gap-2.5 transition-all hover:border-accent-gold/30 hover:text-accent-gold"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            )}
            Войти через Google
          </button>

          <p className="text-center text-sm text-white/40 pt-2">
            Нет аккаунта?{' '}
            <Link
              to="/register"
              className="text-accent-gold hover:text-accent-gold/80 transition-colors font-medium"
            >
              Зарегистрироваться
            </Link>
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
}
