import { supabase } from '../lib/supabase';

export interface DashboardMetrics {
  revenueToday: number;
  fuelDispensedToday: number;
  activeLanesCount: number;
  offlineDevicesCount: number;
}

export interface HourlyMetric {
  hour: string;
  transactions: number;
  revenue: number;
}

export interface FuelShareMetric {
  name: string;
  value: number;
  fill: string;
}

export interface StationQueueMetric {
  station: string;
  avgWaitMinutes: number;
  peakWaitMinutes: number;
}

export interface UserGrowthMetric {
  month: string;
  registeredDrivers: number;
}

export const analyticsService = {
  /**
   * Fetch today's KPI metrics from the database view
   */
  fetchDashboardMetrics: async (): Promise<{ data: DashboardMetrics; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('dashboard_metrics_view')
        .select('*')
        .single();

      if (error) throw error;

      return {
        data: {
          revenueToday: Number(data.revenue_today || 0),
          fuelDispensedToday: Number(data.fuel_dispensed_today || 0),
          activeLanesCount: Number(data.active_lanes_count || 0),
          offlineDevicesCount: Number(data.offline_devices_count || 0)
        },
        error: null
      };
    } catch (err: any) {
      console.error('Failed to fetch dashboard metrics:', err);
      // Return zeroes, no mock fallbacks
      return {
        data: {
          revenueToday: 0,
          fuelDispensedToday: 0,
          activeLanesCount: 0,
          offlineDevicesCount: 0
        },
        error: err.message
      };
    }
  },

  /**
   * Fetch hourly transaction and revenue breakdown
   * Filters by relative days: 'today', '7days', '30days'
   */
  fetchHourlyMetrics: async (timeRange: string): Promise<{ data: HourlyMetric[]; error: string | null }> => {
    try {
      let query = supabase.from('transactions')
        .select('created_at, total_price')
        .eq('status', 'completed');

      const dateLimit = getDateLimit(timeRange);
      if (dateLimit) {
        query = query.gte('created_at', dateLimit);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group hourly in memory for dynamic filtering
      const hoursMap: { [hour: string]: { tx: number; rev: number } } = {};
      (data || []).forEach(tx => {
        const dateObj = new Date(tx.created_at);
        const hourKey = `${String(dateObj.getHours()).padStart(2, '0')}:00`;
        if (!hoursMap[hourKey]) {
          hoursMap[hourKey] = { tx: 0, rev: 0 };
        }
        hoursMap[hourKey].tx += 1;
        hoursMap[hourKey].rev += Number(tx.total_price || 0);
      });

      // Sort hours chronological
      const formatted: HourlyMetric[] = Object.keys(hoursMap)
        .sort()
        .map(h => ({
          hour: h,
          transactions: hoursMap[h].tx,
          revenue: hoursMap[h].rev
        }));

      return { data: formatted, error: null };
    } catch (err: any) {
      console.error('Failed to fetch hourly metrics:', err);
      return { data: [], error: err.message };
    }
  },

  /**
   * Fetch fuel type market share percentage breakdown
   */
  fetchFuelShare: async (timeRange: string): Promise<{ data: FuelShareMetric[]; error: string | null }> => {
    try {
      let query = supabase.from('transactions')
        .select('fuel_type_name')
        .eq('status', 'completed');

      const dateLimit = getDateLimit(timeRange);
      if (dateLimit) {
        query = query.gte('created_at', dateLimit);
      }

      const { data, error } = await query;
      if (error) throw error;

      const fuelMap: { [name: string]: number } = {};
      (data || []).forEach(t => {
        const name = t.fuel_type_name || 'Octane';
        fuelMap[name] = (fuelMap[name] || 0) + 1;
      });

      const COLORS: { [key: string]: string } = {
        'Pertalite': '#f59e0b',
        'Pertamax': '#3b82f6',
        'Pertamax Turbo': '#00FF41',
        'Solar': '#ef4444'
      };

      const formatted: FuelShareMetric[] = Object.keys(fuelMap).map(name => ({
        name,
        value: fuelMap[name],
        fill: COLORS[name] || '#9ca3af'
      }));

      return { data: formatted, error: null };
    } catch (err: any) {
      console.error('Failed to fetch fuel share:', err);
      return { data: [], error: err.message };
    }
  },

  /**
   * Fetch average and peak queue durations in minutes per station
   */
  fetchAvgQueueDuration: async (timeRange: string): Promise<{ data: StationQueueMetric[]; error: string | null }> => {
    try {
      // Fetch stations
      const { data: stations, error: stErr } = await supabase.from('stations').select('id, name');
      if (stErr) throw stErr;

      let query = supabase.from('queue_sessions')
        .select('station_id, started_at, completed_at')
        .in('status', ['completed', 'COMPLETED'])
        .not('started_at', 'is', null)
        .not('completed_at', 'is', null);

      const dateLimit = getDateLimit(timeRange);
      if (dateLimit) {
        query = query.gte('created_at', dateLimit);
      }

      const { data: sessions, error: qErr } = await query;
      if (qErr) throw qErr;

      // Group durations by station
      const durationsMap: { [stationId: string]: number[] } = {};
      (sessions || []).forEach(q => {
        const start = new Date(q.started_at!).getTime();
        const end = new Date(q.completed_at!).getTime();
        const durationMin = Math.max(0, (end - start) / 60000.0);
        if (!durationsMap[q.station_id]) {
          durationsMap[q.station_id] = [];
        }
        durationsMap[q.station_id].push(durationMin);
      });

      const formatted: StationQueueMetric[] = (stations || []).map(st => {
        const times = durationsMap[st.id] || [];
        const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
        const peak = times.length > 0 ? Math.max(...times) : 0;
        return {
          station: st.name,
          avgWaitMinutes: Number(avg.toFixed(1)),
          peakWaitMinutes: Number(peak.toFixed(1))
        };
      });

      return { data: formatted, error: null };
    } catch (err: any) {
      console.error('Failed to fetch queue durations:', err);
      return { data: [], error: err.message };
    }
  },

  /**
   * Fetch driver registration growth cumulative history
   */
  fetchUserGrowth: async (timeRange: string): Promise<{ data: UserGrowthMetric[]; error: string | null }> => {
    try {
      let query = supabase.from('users').select('created_at');
      
      const dateLimit = getDateLimit(timeRange);
      if (dateLimit) {
        query = query.gte('created_at', dateLimit);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Cumulative user registrations grouped by short month name
      const monthMap: { [key: string]: { code: string; count: number } } = {};
      const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      (data || []).forEach(u => {
        const d = new Date(u.created_at);
        const name = monthsOrder[d.getMonth()];
        const code = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthMap[name]) {
          monthMap[name] = { code, count: 0 };
        }
        monthMap[name].count += 1;
      });

      let cumulative = 0;
      const formatted: UserGrowthMetric[] = monthsOrder
        .filter(m => !!monthMap[m])
        .map(month => {
          cumulative += monthMap[month].count;
          return {
            month,
            registeredDrivers: cumulative
          };
        });

      return { data: formatted, error: null };
    } catch (err: any) {
      console.error('Failed to fetch user growth:', err);
      return { data: [], error: err.message };
    }
  }
};

/**
 * Helper to compute date limits
 */
function getDateLimit(timeRange: string): string | null {
  const now = new Date();
  if (timeRange === 'today') {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (timeRange === '7days') {
    now.setDate(now.getDate() - 7);
    return now.toISOString();
  }
  if (timeRange === '30days') {
    now.setDate(now.getDate() - 30);
    return now.toISOString();
  }
  return null; // All-time/Custom default
}
