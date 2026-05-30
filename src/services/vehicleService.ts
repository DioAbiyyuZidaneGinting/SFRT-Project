import { supabase } from '../lib/supabase';
import { Vehicle } from '../types';

export const vehicleService = {
  /**
   * Fetch all vehicles for a specific user
   */
  fetchUserVehicles: async (userId: string): Promise<{ data: Vehicle[]; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map snake_case to camelCase
      const formattedVehicles: Vehicle[] = (data || []).map(v => ({
        id: v.id,
        plateNumber: v.plate_number,
        vehicleType: v.vehicle_type, 
        brand: v.brand,
        model: v.model,
        fuelTypePreference: v.fuel_type_preference,
        tankCapacity: v.tank_capacity,
        currentFuelLevel: v.current_fuel_level || 50, 
        isVerified: v.is_verified || false,
        createdAt: v.created_at,
      }));

      return { data: formattedVehicles, error: null };
    } catch (err: any) {
      console.error('Failed to fetch vehicles:', err);
      return { data: [], error: err.message || 'Failed to load vehicles.' };
    }
  },

  /**
   * Add a new vehicle for a user
   */
  createVehicle: async (userId: string, vehicleData: Omit<Vehicle, 'id' | 'currentFuelLevel' | 'isVerified' | 'createdAt'>): Promise<{ data: Vehicle | null; error: string | null }> => {
    try {
      const payload = {
        user_id: userId,
        plate_number: vehicleData.plateNumber,
        vehicle_type: vehicleData.vehicleType,
        brand: vehicleData.brand,
        model: vehicleData.model,
        fuel_type_preference: vehicleData.fuelTypePreference,
        tank_capacity: vehicleData.tankCapacity,
        current_fuel_level: 50, // starting mock value
        is_verified: false
      };
      
      console.log('Sending insert payload to vehicles table:', payload);

      // Create a timeout promise to prevent infinite hanging if Supabase client freezes
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Supabase request timed out after 10 seconds. Check network or adblockers.")), 10000);
      });

      const fetchPromise = supabase
        .from('vehicles')
        .insert([payload])
        .select()
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Supabase Insert Error:', error);
        throw error;
      }

      const newVehicle: Vehicle = {
        id: data.id,
        plateNumber: data.plate_number,
        vehicleType: data.vehicle_type,
        brand: data.brand,
        model: data.model,
        fuelTypePreference: data.fuel_type_preference,
        tankCapacity: data.tank_capacity,
        currentFuelLevel: data.current_fuel_level,
        isVerified: data.is_verified,
        createdAt: data.created_at,
      };

      return { data: newVehicle, error: null };
    } catch (err: any) {
      console.error('Failed to create vehicle:', err);
      return { data: null, error: err.message || 'Failed to register vehicle.' };
    }
  },

  /**
   * Delete a vehicle
   */
  deleteVehicle: async (id: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Failed to delete vehicle:', err);
      return { success: false, error: err.message || 'Failed to delete vehicle.' };
    }
  }
};
