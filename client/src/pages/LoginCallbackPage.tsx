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

    const processCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!session) {
          toast.error('Сессия не найдена. Попробуйте войти снова.');
          navigate('/login');
          return;
        }

        await handleGoogleCallback(session.access_token);
        toast.success('Успешный вход через Google!');
        navigate('/profile');
      } catch (err: any) {
        console.error('Ошибка входа через Google:', err);
        toast.error('Не удалось войти через Google: ' + (err.message || 'Ошибка'));
        navigate('/login');
      }
    };

    processCallback();
  }, [handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen bg-[#09090E] flex flex-col items-center justify-center text-white px-4">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-xl font-medium tracking-wide">Вход через Google...</h2>
      <p className="text-gray-400 mt-2 text-sm">Пожалуйста, подождите, мы авторизуем вашу сессию.</p>
    </div>
  );
}
