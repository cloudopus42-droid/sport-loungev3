import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';

export type NotificationType = 'new_user' | 'new_review';

export interface NotificationEvent {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  timestamp: string;
}

export function useNotificationQueue() {
  const { socket } = useSocket();
  const [queue, setQueue] = useState<NotificationEvent[]>([]);
  const [current, setCurrent] = useState<NotificationEvent | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);

  const dequeue = useCallback(() => {
    setQueue(prev => {
      if (prev.length === 0) {
        isProcessingRef.current = false;
        setCurrent(null);
        return prev;
      }
      const [next, ...rest] = prev;
      setCurrent(next);
      timerRef.current = setTimeout(() => {
        dequeue();
      }, 5000);
      return rest;
    });
  }, []);

  const enqueue = useCallback((event: NotificationEvent) => {
    setQueue(prev => {
      const next = [...prev, event];
      if (!isProcessingRef.current) {
        isProcessingRef.current = true;
        setCurrent(event);
        timerRef.current = setTimeout(() => {
          dequeue();
        }, 5000);
        return prev;
      }
      return next;
    });
  }, [dequeue]);

  useEffect(() => {
    if (!socket) return;

    const onNewUser = (data: Record<string, unknown>) => {
      enqueue({
        id: `user_${data.id || Date.now()}`,
        type: 'new_user',
        payload: data,
        timestamp: (data.timestamp as string) || new Date().toISOString(),
      });
    };

    const onNewReview = (data: Record<string, unknown>) => {
      enqueue({
        id: `review_${data.id || Date.now()}`,
        type: 'new_review',
        payload: data,
        timestamp: (data.timestamp as string) || new Date().toISOString(),
      });
    };

    socket.on('new_user', onNewUser);
    socket.on('new_review', onNewReview);

    return () => {
      socket.off('new_user', onNewUser);
      socket.off('new_review', onNewReview);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [socket, enqueue]);

  return { current, queue };
}
