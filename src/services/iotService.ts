import { supabase } from '../lib/supabase';

export interface IoTDevice {
  id: string;
  stationId: string | null;
  deviceType: string;
  mqttTopic: string;
  status: 'online' | 'offline' | 'error';
  lastPing: string;
}

export interface TelemetryLog {
  id: string;
  deviceId: string;
  deviceType: string;
  mqttTopic: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metadata: any;
  createdAt: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export const iotService = {
  /**
   * Fetch all IoT devices from the database
   */
  fetchDevices: async (): Promise<{ data: IoTDevice[]; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('iot_devices')
        .select('*')
        .order('device_type', { ascending: true });

      if (error) throw error;

      const formatted: IoTDevice[] = (data || []).map(d => ({
        id: d.id,
        stationId: d.station_id,
        deviceType: d.device_type || 'unknown',
        mqttTopic: d.mqtt_topic || '',
        status: d.status || 'offline',
        lastPing: d.last_ping || new Date().toISOString()
      }));

      return { data: formatted, error: null };
    } catch (err: any) {
      console.error('Failed to fetch IoT devices:', err);
      return { data: [], error: err.message || 'Failed to load IoT devices.' };
    }
  },

  /**
   * Update IoT device status in the database
   */
  updateDeviceStatus: async (deviceId: string, status: 'online' | 'offline' | 'error'): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('iot_devices')
        .update({ 
          status,
          last_ping: new Date().toISOString()
        })
        .eq('id', deviceId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Failed to update IoT device status:', err);
      return { success: false, error: err.message || 'Failed to update device status.' };
    }
  },

  /**
   * Add a new mock IoT device
   */
  createDevice: async (device: Omit<IoTDevice, 'id' | 'lastPing'>): Promise<{ data: IoTDevice | null; error: string | null }> => {
    try {
      const newId = crypto.randomUUID();
      const payload = {
        id: newId,
        station_id: device.stationId,
        device_type: device.deviceType,
        mqtt_topic: device.mqttTopic,
        status: device.status,
        last_ping: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('iot_devices')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      const formatted: IoTDevice = {
        id: data.id,
        stationId: data.station_id,
        deviceType: data.device_type,
        mqttTopic: data.mqtt_topic,
        status: data.status,
        lastPing: data.last_ping
      };

      return { data: formatted, error: null };
    } catch (err: any) {
      console.error('Failed to create IoT device:', err);
      return { data: null, error: err.message || 'Failed to register IoT device.' };
    }
  },

  /**
   * Fetch active telemetry logs (retention limit: 50)
   */
  fetchTelemetryLogs: async (): Promise<{ data: TelemetryLog[]; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('telemetry_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formatted: TelemetryLog[] = (data || []).map(l => ({
        id: l.id,
        deviceId: l.device_id,
        deviceType: l.device_type || 'system',
        mqttTopic: l.mqtt_topic || '',
        severity: l.severity || 'info',
        message: l.message || '',
        metadata: l.metadata || {},
        createdAt: l.created_at || new Date().toISOString()
      }));

      return { data: formatted, error: null };
    } catch (err: any) {
      console.error('Failed to fetch telemetry logs:', err);
      return { data: [], error: err.message };
    }
  },

  /**
   * Write new telemetry log to database
   */
  createTelemetryLog: async (log: Omit<TelemetryLog, 'id' | 'createdAt'>): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('telemetry_logs')
        .insert([{
          id: crypto.randomUUID(),
          device_id: log.deviceId,
          device_type: log.deviceType,
          mqtt_topic: log.mqttTopic,
          severity: log.severity,
          message: log.message,
          metadata: log.metadata,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Failed to insert telemetry log:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch system alerts with status active or acknowledged
   */
  fetchSystemAlerts: async (): Promise<{ data: SystemAlert[]; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('system_alerts')
        .select('*')
        .in('status', ['active', 'acknowledged'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: SystemAlert[] = (data || []).map(a => ({
        id: a.id,
        title: a.title || 'System Alert',
        message: a.message || '',
        severity: a.severity || 'warning',
        status: a.status || 'active',
        resolvedBy: a.resolved_by,
        resolvedAt: a.resolved_at,
        createdAt: a.created_at || new Date().toISOString()
      }));

      return { data: formatted, error: null };
    } catch (err: any) {
      console.error('Failed to fetch system alerts:', err);
      return { data: [], error: err.message };
    }
  },

  /**
   * Update system alert resolution status
   */
  updateAlertStatus: async (alertId: string, status: 'active' | 'acknowledged' | 'resolved', userId?: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const payload: any = { status };
      if (status === 'resolved') {
        payload.resolved_by = userId || null;
        payload.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('system_alerts')
        .update(payload)
        .eq('id', alertId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Failed to update alert status:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Create a new system alert in the database
   */
  createAlert: async (alert: Omit<SystemAlert, 'id' | 'createdAt'>): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .insert([{
          id: crypto.randomUUID(),
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          status: alert.status,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Failed to create system alert:', err);
      return { success: false, error: err.message };
    }
  }
};
