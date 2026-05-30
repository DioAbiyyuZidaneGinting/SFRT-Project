import { supabase } from '../lib/supabase';
import { Station } from '../types';

export const stationService = {
  /**
   * Fetch all active stations
   */
  fetchStations: async (): Promise<{ data: Station[]; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('*');

      if (error) throw error;

      // Map snake_case to camelCase
      const formattedStations: Station[] = (data || []).map(s => ({
        id: s.id,
        name: s.name,
        address: s.address,
        distance: s.distance || 0, // Fallback if not available
        latitude: s.location_lat || 0, // Correctly map from location_lat
        longitude: s.location_lng || 0, // Correctly map from location_lng
        queueCount: s.queue_count || 0,
        estWaitMinutes: s.est_wait_minutes || 0,
        status: s.status === 'operational' || s.status === 'OPEN' ? 'OPEN' : s.status === 'maintenance' || s.status === 'BUSY' ? 'BUSY' : 'CLOSED',
        fuelStock: s.fuel_stock ? (typeof s.fuel_stock === 'string' ? JSON.parse(s.fuel_stock) : s.fuel_stock) : { '1': true, '2': true, '3': true }
      }));

      // Sort by distance in memory to prevent 400 errors if the DB schema lacks a distance column
      formattedStations.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      return { data: formattedStations, error: null };
    } catch (err: any) {
      console.error('Failed to fetch stations:', err);
      return { data: [], error: err.message || 'Failed to load stations.' };
    }
  },

  /**
   * Update a station's status (operational, maintenance, closed)
   */
  updateStationStatus: async (stationId: string, status: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const dbStatus = status === 'OPEN' || status === 'operational' ? 'operational' : status === 'BUSY' || status === 'maintenance' ? 'maintenance' : 'closed';
      const { error } = await supabase
        .from('stations')
        .update({ status: dbStatus })
        .eq('id', stationId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Failed to update station status:', err);
      return { success: false, error: err.message || 'Failed to update station status.' };
    }
  }
};
