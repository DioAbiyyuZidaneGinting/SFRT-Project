import { supabase } from '../lib/supabase';
import { Transaction } from '../types';

export const transactionService = {
  /**
   * Fetch transaction history for a user
   */
  fetchUserTransactions: async (userId: string): Promise<{ data: Transaction[]; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map snake_case to camelCase
      const formattedTxs: Transaction[] = (data || []).map(tx => ({
        id: tx.id,
        userId: tx.user_id,
        stationId: tx.station_id,
        stationName: tx.station_name,
        vehicleId: tx.vehicle_id,
        plateNumber: tx.plate_number,
        fuelTypeId: tx.fuel_type_id,
        fuelTypeName: tx.fuel_type_name,
        liters: tx.liters,
        pricePerLiter: tx.price_per_liter,
        totalPrice: tx.total_price,
        paymentMethod: tx.payment_method,
        date: tx.date,
        time: tx.time,
        status: (tx.status || '').toLowerCase().trim() as any,
        queueNumber: tx.queue_number !== null && tx.queue_number !== undefined ? tx.queue_number.toString() : '',
        paymentQrCode: tx.payment_qr_code,
        compatibilityScore: tx.compatibility_score,
      }));

      return { data: formattedTxs, error: null };
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      return { data: [], error: err.message || 'Failed to load transaction history.' };
    }
  },

  /**
   * Save a completed transaction
   */
  createTransaction: async (tx: Transaction): Promise<{ data: Transaction | null; error: string | null }> => {
    console.log('transactionService: Starting insert for tx:', tx);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          id: tx.id,
          user_id: tx.userId,
          station_id: tx.stationId,
          station_name: tx.stationName,
          vehicle_id: tx.vehicleId,
          plate_number: tx.plateNumber,
          fuel_type_id: tx.fuelTypeId,
          fuel_type_name: tx.fuelTypeName,
          liters: tx.liters,
          price_per_liter: tx.pricePerLiter,
          total_price: tx.totalPrice,
          amount_rupiah: tx.totalPrice, // Required by DB schema (NOT NULL)
          payment_method: tx.paymentMethod,
          date: tx.date,
          time: tx.time,
          status: (tx.status || 'pending').toLowerCase().trim(),
          queue_number: tx.queueNumber && !isNaN(Number(tx.queueNumber)) && tx.queueNumber !== 'pending'
            ? parseInt(tx.queueNumber, 10)
            : null,
          payment_qr_code: tx.paymentQrCode,
          compatibility_score: tx.compatibilityScore,
          liters_selected: tx.liters,
          fuel_type: tx.fuelTypeName,
        }])
        .select()
        .single();

      if (error) throw error;
      return { data: tx, error: null }; // Returning the originally constructed tx is fine for now
    } catch (err: any) {
      console.error('Failed to create transaction:', err);
      return { data: null, error: err.message || 'Failed to save transaction.' };
    }
  },

  /**
   * Update an existing transaction
   */
  updateTransaction: async (txId: string, updates: Partial<Transaction>): Promise<{ success: boolean; error: string | null }> => {
    try {
      const dbUpdates: any = {};
      
      if (updates.status) {
        const nextStatus = updates.status.toLowerCase().trim();
        
        // Status progression enforcement
        const VALID_TRANSITIONS: Record<string, string[]> = {
          'pending': ['paying', 'queued', 'cancelled', 'failed'],
          'paying': ['queued', 'cancelled', 'failed'],
          'queued': ['refueling', 'cancelled', 'failed'],
          'refueling': ['completed', 'failed'],
          'completed': [],
          'cancelled': [],
          'failed': []
        };

        const { data: current, error: fetchErr } = await supabase
          .from('transactions')
          .select('status')
          .eq('id', txId)
          .single();
          
        if (fetchErr) throw fetchErr;
        
        const currentStatus = (current?.status || '').toLowerCase().trim();
        if (currentStatus !== nextStatus) {
          const allowed = VALID_TRANSITIONS[currentStatus] || [];
          if (!allowed.includes(nextStatus)) {
            throw new Error(`Invalid transaction status transition from "${currentStatus}" to "${nextStatus}"`);
          }
        }
        
        dbUpdates.status = nextStatus;
      }
      
      if (updates.queueNumber !== undefined) {
        dbUpdates.queue_number = updates.queueNumber && !isNaN(Number(updates.queueNumber)) && updates.queueNumber !== 'pending'
          ? parseInt(updates.queueNumber, 10)
          : null;
      }

      const { error } = await supabase
        .from('transactions')
        .update(dbUpdates)
        .eq('id', txId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Failed to update transaction:', err);
      return { success: false, error: err.message || 'Failed to update transaction.' };
    }
  },

  /**
   * Fetch paginated transactions for admin view
   */
  fetchAllTransactionsPaginated: async (
    page: number, 
    limit: number, 
    statusFilter?: string, 
    searchQuery?: string
  ): Promise<{ data: Transaction[]; totalCount: number; error: string | null }> => {
    try {
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' });

      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }
      if (searchQuery) {
        query = query.or(`plate_number.ilike.%${searchQuery}%,fuel_type_name.ilike.%${searchQuery}%,station_name.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      const formattedTxs: Transaction[] = (data || []).map(tx => ({
        id: tx.id,
        userId: tx.user_id,
        stationId: tx.station_id,
        stationName: tx.station_name,
        vehicleId: tx.vehicle_id,
        plateNumber: tx.plate_number,
        fuelTypeId: tx.fuel_type_id,
        fuelTypeName: tx.fuel_type_name,
        liters: Number(tx.liters || 0),
        pricePerLiter: Number(tx.price_per_liter || 0),
        totalPrice: Number(tx.total_price || 0),
        paymentMethod: tx.payment_method,
        date: tx.date,
        time: tx.time,
        status: (tx.status || '').toLowerCase().trim() as any,
        queueNumber: tx.queue_number !== null && tx.queue_number !== undefined ? tx.queue_number.toString() : '',
        paymentQrCode: tx.payment_qr_code,
        compatibilityScore: tx.compatibility_score,
      }));

      return { data: formattedTxs, totalCount: count || 0, error: null };
    } catch (err: any) {
      console.error('Failed to fetch paginated transactions:', err);
      return { data: [], totalCount: 0, error: err.message || 'Failed to load transactions.' };
    }
  },

  /**
   * Fetch transaction aggregates for dashboard display (database-side aggregation)
   */
  fetchTransactionStats: async (): Promise<{ revenue: number; liters: number; error: string | null }> => {
    try {
      // Fetch only needed columns to keep payloads low
      const { data, error } = await supabase
        .from('transactions')
        .select('total_price, liters')
        .in('status', ['completed', 'COMPLETED']);

      if (error) throw error;

      const revenue = (data || []).reduce((sum, tx) => sum + Number(tx.total_price || 0), 0);
      const liters = (data || []).reduce((sum, tx) => sum + Number(tx.liters || 0), 0);

      return { revenue, liters, error: null };
    } catch (err: any) {
      console.error('Failed to fetch transaction stats:', err);
      return { revenue: 0, liters: 0, error: err.message || 'Failed to aggregate statistics.' };
    }
  }
};
