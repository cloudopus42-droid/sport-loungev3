import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Mail } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import type { Invitation } from '@/types';
import { resolveImageUrl } from '@/lib/urls';

export function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const { data } = await api.get<Invitation[]>('/api/invitations', {
          params: { status: 'published' },
        });
        setInvitations(data);
      } catch {
        console.error('Failed to fetch invitations');
      } finally {
        setLoading(false);
      }
    };
    fetchInvitations();
  }, []);

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-accent-cyan" />
          Приглашения
        </h1>
        <p className="text-xs text-white/40 mt-0.5">Предстоящие события</p>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-glass-bg border border-glass-border rounded-2xl overflow-hidden">
              <Skeleton variant="rect" className="w-full h-40" />
              <div className="p-4 space-y-3">
                <Skeleton width="60%" />
                <Skeleton width="90%" />
                <Skeleton width="40%" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invitations grid */}
      {!loading && (
        <div className="space-y-4">
          {invitations.map((invitation, index) => (
            <motion.div
              key={invitation._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="overflow-hidden">
                {/* Image */}
                {invitation.imageUrl && (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={resolveImageUrl(invitation.imageUrl)}
                      alt={invitation.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <Badge
                        text={invitation.status === 'published' ? 'Активно' : 'Черновик'}
                        color={invitation.status === 'published' ? 'green' : 'gray'}
                        size="sm"
                      />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-3">
                  <h3 className="text-base font-display font-semibold text-white">
                    {invitation.title}
                  </h3>

                  {invitation.description && (
                    <p className="text-sm text-white/50 leading-relaxed line-clamp-2">
                      {invitation.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-accent-cyan" />
                      {new Date(invitation.dateTime).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                      })}
                      {' в '}
                      {new Date(invitation.dateTime).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-accent-cyan" />
                      {invitation.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-accent-cyan" />
                      {invitation.currentParticipants || 0} участников
                    </span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}

          {/* Empty state */}
          {invitations.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center py-20 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-20 h-20 rounded-full bg-glass-bg border border-glass-border flex items-center justify-center mb-4">
                <Mail className="w-10 h-10 text-white/20" />
              </div>
              <h3 className="text-lg font-display font-semibold text-white/60 mb-1">
                Нет приглашений
              </h3>
              <p className="text-sm text-white/30">
                Пока нет активных приглашений на мероприятия
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
