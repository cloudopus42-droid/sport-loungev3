import { supabase } from '../config/supabase';
import { sendDelayNotification } from './ordersTelegram';
import { getIO } from '../socket';

const alertedOrders = new Set<string>();

export function startOrderScheduler() {
  console.log('⏳ Hookah Order Delay Scheduler started.');
  
  setInterval(async () => {
    try {
      const now = new Date().toISOString();
      
      const { data: delayedOrders, error } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'done')
        .neq('status', 'cancelled')
        .lt('promised_delivery_time', now);
        
      if (error) {
        console.error('⚠️ [Scheduler] Error fetching delayed orders:', error.message);
        return;
      }
      
      if (!delayedOrders || delayedOrders.length === 0) {
        // Clean up alerts for completed/cancelled orders
        alertedOrders.clear();
        return;
      }
      
      for (const order of delayedOrders) {
        const currentPromised = new Date(order.promised_delivery_time).getTime();
        const newPromised = new Date(currentPromised + 2 * 60 * 1000).toISOString();
        
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
        
        // Send Telegram alert only ONCE per order (not every 30s)
        if (!alertedOrders.has(order.id)) {
          alertedOrders.add(order.id);
          
          const originalCreated = new Date(order.created_at).getTime();
          const promisedInitial = originalCreated + 15 * 60 * 1000;
          const delayMs = Date.now() - promisedInitial;
          const delayMinutes = Math.max(1, Math.ceil(delayMs / 1000 / 60));
          
          sendDelayNotification(updated, delayMinutes)
            .catch(tgErr => console.warn('⚠️ [Scheduler] TG Delay alert fail:', tgErr.message));
        }
          
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
  }, 30000);
}
