import { supabase } from '../lib/supabase';
import { UserRole } from '../lib/authStore';
import { Vehicle } from '../types';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  createdAt: string;
  vehicles?: Vehicle[];
}

export const adminService = {
  /**
   * Fetch all users from the users table
   */
  fetchUsers: async (): Promise<{ data: AdminUser[]; error: string | null }> => {
    try {
      // 1. Fetch profiles
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // 2. Fetch all vehicles to map to users
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*');

      if (vehiclesError) throw vehiclesError;

      // Group vehicles by user_id
      const vehiclesByUser: { [userId: string]: Vehicle[] } = {};
      (vehiclesData || []).forEach(v => {
        const formattedVehicle: Vehicle = {
          id: v.id,
          plateNumber: v.plate_number,
          vehicleType: v.vehicle_type,
          brand: v.brand,
          model: v.model,
          fuelTypePreference: v.fuel_type_preference,
          tankCapacity: v.tank_capacity,
          currentFuelLevel: v.current_fuel_level || 50,
          isVerified: v.is_verified || false,
          createdAt: v.created_at
        };
        if (!vehiclesByUser[v.user_id]) {
          vehiclesByUser[v.user_id] = [];
        }
        vehiclesByUser[v.user_id].push(formattedVehicle);
      });

      // Map profiles
      const users: AdminUser[] = (usersData || []).map(u => ({
        id: u.id,
        email: u.email || '',
        fullName: u.full_name || '',
        phoneNumber: u.phone_number || '',
        role: u.role || 'customer',
        createdAt: u.created_at || new Date().toISOString(),
        vehicles: vehiclesByUser[u.id] || []
      }));

      return { data: users, error: null };
    } catch (err: any) {
      console.error('Failed to fetch admin users:', err);
      return { data: [], error: err.message || 'Failed to load user management data.' };
    }
  },

  /**
   * Update a user's operational role
   */
  updateUserRole: async (userId: string, role: UserRole): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Failed to update user role:', err);
      return { success: false, error: err.message || 'Failed to update user role.' };
    }
  }
};
