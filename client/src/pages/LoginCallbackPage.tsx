import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export function LoginCallbackPage() {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const processed = useRef(false);

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
        await handleGoogleCallback(session.access_token);
        toast.success('Успешный вход через Google!');
        navigate('/profile');
      } catch (err: any) {
        console.error('Ошибка входа через Google:', err);
        toast.error('Не удалось войти через Google: ' + (err.message || 'Ошибка'));
        navigate('/login');
      }
    };

    const processCallback = async () => {
      try {
        // Try getting session immediately
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          await handleSession(session);
          return;
        }

        // If no session immediately, listen to changes (OAuth flow might be processing hash)
        const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (event === 'SIGNED_IN' && currentSession) {
            await handleSession(currentSession);
          }
        });
        subscription = data.subscription;

        // Set a timeout to prevent infinite spinner
        timeoutId = setTimeout(() => {
          if (isMounted) {
            if (subscription) {
              subscription.unsubscribe();
              subscription = null;
            }
            toast.error('Сессия не найдена или истекло время ожидания.');
            navigate('/login');
          }
        }, 6000);

      } catch (err: any) {
        console.error('Ошибка входа через Google:', err);
        toast.error('Не удалось войти через Google: ' + (err.message || 'Ошибка'));
        navigate('/login');
      }
    };

    processCallback();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (subscription) {
        // @ts-ignore
        subscription.unsubscribe();
      }
    };
  }, [handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen bg-[#09090E] flex flex-col items-center justify-center text-white px-4">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-xl font-medium tracking-wide">Вход через Google...</h2>
      <p className="text-gray-400 mt-2 text-sm">Пожалуйста, подождите, мы авторизуем вашу сессию.</p>
    </div>
  );
}


