import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export function LoginCallbackPage() {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const processed = useRef(false);
  const [status, setStatus] = useState('Обработка авторизации...');

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    let timeoutId: any = null;

    const handleSession = async (session: any) => {
      if (!isMounted) return;
      if (timeoutId) clearTimeout(timeoutId);
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }

      try {
        setStatus('Вход в систему...');
        await handleGoogleCallback(session.access_token);
        if (!isMounted) return;
        toast.success('Успешный вход через Google!');
        navigate('/profile', { replace: true });
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Google auth error:', err);
        const msg = err?.response?.data?.error || err?.message || 'Ошибка';
        toast.error('Не удалось войти через Google: ' + msg);
        navigate('/login', { replace: true });
      }
    };

    const processCallback = async () => {
      try {
        // 1) Try getting session immediately (hash fragment already processed)
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.access_token) {
          await handleSession(session);
          return;
        }

        // 2) No session yet — wait for auth state change
        setStatus('Ожидание ответа от Google...');
        const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && currentSession?.access_token) {
            await handleSession(currentSession);
          }
        });
        subscription = data.subscription;

        // 3) Also trygetSession again after a short delay (race condition safety)
        setTimeout(async () => {
          if (!isMounted) return;
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession?.access_token && isMounted) {
            await handleSession(retrySession);
          }
        }, 1500);

        // 4) Timeout fallback
        timeoutId = setTimeout(() => {
          if (isMounted) {
            if (subscription) {
              subscription.unsubscribe();
              subscription = null;
            }
            toast.error('Время ожидания истекло. Попробуйте войти снова.');
            navigate('/login', { replace: true });
          }
        }, 15000);

      } catch (err: any) {
        if (!isMounted) return;
        console.error('Google callback error:', err);
        toast.error('Ошибка при обработке ответа Google');
        navigate('/login', { replace: true });
      }
    };

    processCallback();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (subscription) {
        try { subscription.unsubscribe(); } catch (e) { console.warn('Silent catch:', e); }
      }
    };
  }, [handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen bg-[#09090E] flex flex-col items-center justify-center text-white px-4">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-xl font-medium tracking-wide">Вход через Google...</h2>
      <p className="text-gray-400 mt-2 text-sm">{status}</p>
    </div>
  );
}
