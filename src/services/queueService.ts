import { supabase } from '../lib/supabase';

export const queueService = {
  /**
   * Subscribe to realtime queue changes for a specific station
   */
  subscribeToStationQueue: (stationId: string, onUpdate: (queueLength: number) => void) => {
    const channelName = `station-queue-${stationId}-${Date.now()}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stations', filter: `id=eq.${stationId}` },
        (payload) => {
          if (payload.new && 'queue_count' in payload.new) {
            onUpdate(payload.new.queue_count as number);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  /**
   * Join a queue after a transaction is created
   */
  joinQueue: async (transactionId: string, stationId: string, userId?: string): Promise<{ success: boolean; queuePosition: number; error: string | null }> => {
    try {
      // 1. Check if queue session already exists for this transaction (e.g. created by DB trigger)
      const { data: existing } = await supabase
        .from('queue_sessions')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (!existing) {
        // Fetch transaction to extract its queue number
        const { data: txData } = await supabase
          .from('transactions')
          .select('queue_number')
          .eq('id', transactionId)
          .single();

        let queueNum: number;
        if (txData?.queue_number) {
          const parsed = parseInt(txData.queue_number.toString().replace(/\D/g, ''), 10);
          queueNum = isNaN(parsed) ? Math.floor(100 + Math.random() * 899) : parsed;
        } else {
          queueNum = Math.floor(100 + Math.random() * 899);
        }

        // Insert into queue_sessions
        const { error } = await supabase
          .from('queue_sessions')
          .insert([{
            id: crypto.randomUUID(),
            transaction_id: transactionId,
            station_id: stationId,
            user_id: userId || null,
            status: 'waiting',
            queue_number: queueNum,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      // 2. Count active waiting items to determine position
      const { count } = await supabase
        .from('queue_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('station_id', stationId)
        .in('status', ['waiting', 'WAITING']);

      return { success: true, queuePosition: count || 1, error: null };
    } catch (err: any) {
      console.error('Failed to join queue:', err);
      return { success: false, queuePosition: 0, error: err.message || 'Failed to join queue.' };
    }
  },

  /**
   * Fetch all active and completed queue sessions for admin monitoring
   */
  fetchAllQueueSessions: async (): Promise<{ data: any[]; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('queue_sessions')
        .select(`
          id,
          status,
          station_id,
          created_at,
          updated_at,
          started_at,
          completed_at,
          user_id,
          lane_number,
          transaction_id,
          transactions (
            id,
            plate_number,
            fuel_type_name,
            liters,
            total_price,
            status,
            queue_number
          )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const formatted = (data || []).map((session: any) => ({
        ...session,
        status: (session.status || '').toLowerCase().trim(),
        transactions: session.transactions ? {
          ...session.transactions,
          status: (session.transactions.status || '').toLowerCase().trim(),
          queue_number: session.transactions.queue_number ? session.transactions.queue_number.toString() : ''
        } : null
      }));

      return { data: formatted, error: null };
    } catch (err: any) {
      console.error('Failed to fetch queue sessions:', err);
      return { data: [], error: err.message || 'Failed to load queue sessions.' };
    }
  },

  /**
   * Update queue session status
   */
  updateQueueSessionStatus: async (sessionId: string, status: string, laneNumber?: number): Promise<{ success: boolean; error: string | null }> => {
    try {
      const lowerStatus = status.toLowerCase().trim();
      
      // Status progression enforcement
      const VALID_QUEUE_TRANSITIONS: Record<string, string[]> = {
        'waiting': ['refueling', 'cancelled', 'failed'],
        'refueling': ['completed', 'failed'],
        'completed': [],
        'cancelled': [],
        'failed': []
      };

      const { data: current, error: fetchErr } = await supabase
        .from('queue_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();
        
      if (fetchErr) throw fetchErr;
      
      const currentStatus = (current?.status || '').toLowerCase().trim();
      if (currentStatus !== lowerStatus) {
        const allowed = VALID_QUEUE_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(lowerStatus)) {
          throw new Error(`Invalid queue session status transition from "${currentStatus}" to "${lowerStatus}"`);
        }
      }

      const updates: any = { 
        status: lowerStatus,
        updated_at: new Date().toISOString()
      };
      
      if (laneNumber !== undefined) {
        updates.lane_number = laneNumber;
      }
      
      if (lowerStatus === 'refueling') {
        updates.started_at = new Date().toISOString();
      } else if (lowerStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('queue_sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Failed to update queue session status:', err);
      return { success: false, error: err.message || 'Failed to update queue session.' };
    }
  }
};
