import { supabase } from '../lib/supabase';
import { FuelType } from '../types';

export const fuelService = {
  /**
   * Fetch base fuel types
   */
  fetchFuelTypes: async (): Promise<{ data: any[]; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('fuel_types')
        .select('*')
        .eq('is_active', true)
        .order('ron_rating', { ascending: true });

      if (error) throw error;
      
      const formattedFuels: FuelType[] = (data || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        pricePerLiter: f.name === 'Pertalite' ? 10000 : f.name === 'Pertamax' ? 12500 : f.name === 'Pertamax Turbo' ? 14850 : f.name === 'Solar' ? 6800 : 10000,
        stockLevel: 100,
        rating: f.ron_rating,
        description: f.description,
        recommendedFor: []
      }));
      
      return { data: formattedFuels, error: null };
    } catch (err: any) {
      console.error('Failed to fetch fuel types:', err);
      return { data: [], error: err.message || 'Failed to load fuels.' };
    }
  },

  /**
   * Fetch fuels available at a specific station with pricing and stock
   */
  fetchStationFuels: async (stationId: string): Promise<{ data: FuelType[]; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('station_fuels')
        .select(`
          id,
          stock_liters,
          price_per_liter,
          fuel_types (
            id,
            name,
            ron_rating,
            description
          )
        `)
        .eq('station_id', stationId);

      if (error) throw error;

      // Map to frontend FuelType interface
      const formattedFuels: FuelType[] = (data || []).map((item: any) => ({
        id: item.fuel_types.id,
        name: item.fuel_types.name,
        pricePerLiter: item.price_per_liter,
        stockLevel: Math.min(100, Math.floor((item.stock_liters / 5000) * 100)), // Simulate stock percentage
        rating: item.fuel_types.ron_rating,
        recommendedFor: [], // Derived in AI service if needed
        description: item.fuel_types.description,
      }));

      // Sort by RON ascending
      formattedFuels.sort((a, b) => a.rating - b.rating);

      return { data: formattedFuels, error: null };
    } catch (err: any) {
      console.error('Failed to fetch station fuels:', err);
      return { data: [], error: err.message || 'Failed to load station fuels.' };
    }
  },

  /**
   * Fetch all fuel logs for stations
   */
  fetchFuelLogs: async (): Promise<{ data: any[]; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select(`
          id,
          station_id,
          fuel_type,
          current_stock_liters,
          capacity_liters,
          price_per_liter,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      console.error('Failed to fetch fuel logs:', err);
      return { data: [], error: err.message || 'Failed to load fuel logs.' };
    }
  },

  /**
   * Create a fuel log entry
   */
  createFuelLog: async (log: {
    station_id: string;
    fuel_type: string;
    current_stock_liters: number;
    capacity_liters: number;
    price_per_liter: number;
  }): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('fuel_logs')
        .insert([{
          id: crypto.randomUUID(),
          ...log
        }]);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Failed to create fuel log:', err);
      return { success: false, error: err.message || 'Failed to record fuel log.' };
    }
  }
};
