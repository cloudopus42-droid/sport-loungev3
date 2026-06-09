import { supabase } from '../config/supabase';
import { sendDelayNotification } from './ordersTelegram';
import { getIO } from '../socket';

export function startOrderScheduler() {
  console.log('⏳ Hookah Order Delay Scheduler started.');
  
  setInterval(async () => {
    try {
      const now = new Date().toISOString();
      
      // Select orders not done where promised delivery time is in the past
      const { data: delayedOrders, error } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'done')
        .lt('promised_delivery_time', now);
        
      if (error) {
        console.error('⚠️ [Scheduler] Error fetching delayed orders:', error.message);
        return;
      }
      
      if (!delayedOrders || delayedOrders.length === 0) return;
      
      for (const order of delayedOrders) {
        const currentPromised = new Date(order.promised_delivery_time).getTime();
        // Add 2 minutes
        const newPromised = new Date(currentPromised + 2 * 60 * 1000).toISOString();
        
        // Update DB
        const { data: updated, error: updateErr } = await supabase
          .from('orders')
          .update({ promised_delivery_time: newPromised })
          .eq('id', order.id)
          .select()
          .single();
          
        if (updateErr || !updated) {
          console.error(`⚠️ [Scheduler] Failed to update delayed order ${order.id}:`, updateErr?.message);
          continue;
        }
        
        // Calculate how much late it is from the original creation time
        const originalCreated = new Date(order.created_at).getTime();
        const promisedInitial = originalCreated + 15 * 60 * 1000;
        const delayMs = Date.now() - promisedInitial;
        const delayMinutes = Math.max(1, Math.ceil(delayMs / 1000 / 60));
        
        // Send alarm to Telegram
        sendDelayNotification(updated, delayMinutes)
          .catch(tgErr => console.warn('⚠️ [Scheduler] TG Delay alert fail:', tgErr.message));
          
        // Broadcast via Sockets
        try {
          const io = getIO();
          io.emit('order:updated', {
            id: updated.id,
            userId: updated.user_id,
            status: updated.status,
            promisedDeliveryTime: updated.promised_delivery_time,
            notes: updated.notes,
            seatLabel: updated.seat_label,
            seatZone: updated.seat_zone,
            delayed: true
          });
        } catch (socketErr) {
          console.warn('⚠️ [Scheduler] Sockets broadcast fail:', socketErr);
        }
        
        console.log(`🚨 Order ${order.id} extended by 2 min due to delivery delay.`);
      }
    } catch (schedErr: any) {
      console.error('⚠️ [Scheduler] Unhandled error in background delay checker:', schedErr.message);
    }
  }, 30000); // Check every 30 seconds

  // ══════════════════════════════════════════════════════
  // Auto-cleanup: Delete orders & bookings older than 7 days
  // Runs every 6 hours
  // ══════════════════════════════════════════════════════
  const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
  const RETENTION_DAYS = 7;

  const runCleanup = async () => {
    try {
      const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

      // Clean old orders
      const { data: deletedOrders, error: ordersErr } = await supabase
        .from('orders')
        .delete()
        .lt('created_at', cutoffDate)
        .select('id');

      if (ordersErr) {
        console.error('⚠️ [Cleanup] Error cleaning old orders:', ordersErr.message);
      } else if (deletedOrders && deletedOrders.length > 0) {
        console.log(`🧹 [Cleanup] Removed ${deletedOrders.length} orders older than ${RETENTION_DAYS} days.`);
      }

      // Clean old completed/cancelled bookings
      const { data: deletedBookings, error: bookingsErr } = await supabase
        .from('bookings')
        .delete()
        .lt('created_at', cutoffDate)
        .in('status', ['confirmed', 'cancelled'])
        .select('id');

      if (bookingsErr) {
        console.error('⚠️ [Cleanup] Error cleaning old bookings:', bookingsErr.message);
      } else if (deletedBookings && deletedBookings.length > 0) {
        console.log(`🧹 [Cleanup] Removed ${deletedBookings.length} bookings older than ${RETENTION_DAYS} days.`);
      }
    } catch (err: any) {
      console.error('⚠️ [Cleanup] Unhandled error:', err.message);
    }
  };

  // Run immediately on startup, then every 6 hours
  setTimeout(runCleanup, 5000);
  setInterval(runCleanup, CLEANUP_INTERVAL);
  console.log(`🧹 Auto-cleanup scheduled: orders/bookings older than ${RETENTION_DAYS} days, every 6h.`);
}
