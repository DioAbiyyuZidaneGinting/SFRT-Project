import { create } from 'zustand';
import { supabase } from './supabase';
import { Transaction, Station } from '../types';
import { transactionService } from '../services/transactionService';
import { queueService } from '../services/queueService';
import { fuelService } from '../services/fuelService';
import { stationService } from '../services/stationService';
import { iotService, IoTDevice, TelemetryLog, SystemAlert } from '../services/iotService';
import { adminService, AdminUser } from '../services/adminService';
import { analyticsService } from '../services/analyticsService';

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

interface AdminSettings {
  voiceAIEnergy: boolean;
  realtimeEngine: boolean;
  alertThresholdLiters: number;
  queueRefreshRateSeconds: number;
  maintenanceAlerts: boolean;
}

interface AdminState {
  // Lists
  transactions: Transaction[];
  totalTransactions: number;
  queueSessions: any[];
  iotDevices: IoTDevice[];
  fuelLogs: any[];
  stations: Station[];
  users: AdminUser[];
  telemetryLogs: TelemetryLog[];
  systemAlerts: SystemAlert[];
  
  // KPI Metrics
  revenueToday: number;
  fuelDistributedToday: number;
  activeLanesCount: number;
  offlineDevicesCount: number;
  
  // Connection & State Monitoring
  connectionState: ConnectionState;
  isLoading: boolean;
  error: string | null;
  settings: AdminSettings;
  
  // Realtime subscription channels
  channels: any[];
  
  // Actions
  loadAllData: () => Promise<void>;
  loadTransactions: (page: number, limit: number, statusFilter?: string, searchQuery?: string) => Promise<void>;
  loadQueueSessions: () => Promise<void>;
  loadIoTDevices: () => Promise<void>;
  loadFuelLogs: () => Promise<void>;
  loadStations: () => Promise<void>;
  loadUsers: () => Promise<void>;
  loadTelemetryAndAlerts: () => Promise<void>;
  
  // Mutating Actions
  updateStationStatus: (stationId: string, status: string) => Promise<boolean>;
  updateIoTDeviceStatus: (deviceId: string, status: 'online' | 'offline' | 'error') => Promise<boolean>;
  updateQueueStatus: (sessionId: string, status: string, laneNumber?: number) => Promise<boolean>;
  changeUserRole: (userId: string, role: any) => Promise<boolean>;
  saveSettings: (settings: Partial<AdminSettings>) => void;
  resolveAlert: (alertId: string, userId?: string) => Promise<boolean>;
  
  // Realtime Subscription Management
  startSubscriptions: () => void;
  stopSubscriptions: () => void;
  
  // Simulation Management
  simulationIntervalId: NodeJS.Timeout | null;
  startSimulation: () => void;
  stopSimulation: () => void;
  logTerminalMsg: (msg: string) => void;
  terminalLogs: string[];
  
  // Helpers
  queueStatusToLane: (status: string) => 'lane_1' | 'lane_2' | 'lane_3';
}

const defaultSettings: AdminSettings = {
  voiceAIEnergy: true,
  realtimeEngine: true,
  alertThresholdLiters: 1000,
  queueRefreshRateSeconds: 5,
  maintenanceAlerts: true
};

let subscriptionThrottleTimeout: NodeJS.Timeout | null = null;

export const useAdminStore = create<AdminState>((set, get) => ({
  transactions: [],
  totalTransactions: 0,
  queueSessions: [],
  iotDevices: [],
  fuelLogs: [],
  stations: [],
  users: [],
  telemetryLogs: [],
  systemAlerts: [],
  
  revenueToday: 0,
  fuelDistributedToday: 0,
  activeLanesCount: 0,
  offlineDevicesCount: 0,
  
  connectionState: 'disconnected',
  isLoading: false,
  error: null,
  settings: (() => {
    try {
      const saved = localStorage.getItem('sfrt_admin_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  })(),
  
  channels: [],
  simulationIntervalId: null,
  terminalLogs: [],
  
  queueStatusToLane: (status: string): 'lane_1' | 'lane_2' | 'lane_3' => {
    const lower = (status || '').toLowerCase();
    if (lower === 'waiting' || lower === 'pending' || lower === 'paying') {
      return 'lane_1';
    }
    if (lower === 'refueling' || lower === 'queued') {
      return 'lane_2';
    }
    return 'lane_3'; // completed or cancelled
  },

  logTerminalMsg: (msg: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const log = `[${time}] ${msg}`;
    set(state => ({
      terminalLogs: [log, ...state.terminalLogs].slice(0, 100)
    }));
  },

  loadTelemetryAndAlerts: async () => {
    const [logsRes, alertsRes] = await Promise.all([
      iotService.fetchTelemetryLogs(),
      iotService.fetchSystemAlerts()
    ]);
    if (!logsRes.error) {
      set({ telemetryLogs: logsRes.data });
    }
    if (!alertsRes.error) {
      set({ systemAlerts: alertsRes.data });
    }
  },

  loadAllData: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Fetch dashboard view metrics directly
      const metricsRes = await analyticsService.fetchDashboardMetrics();
      
      // 2. Fetch standard collections
      await Promise.all([
        get().loadTransactions(1, 10),
        get().loadQueueSessions(),
        get().loadIoTDevices(),
        get().loadFuelLogs(),
        get().loadStations(),
        get().loadUsers(),
        get().loadTelemetryAndAlerts()
      ]);
      
      if (!metricsRes.error) {
        set({
          revenueToday: metricsRes.data.revenueToday,
          fuelDistributedToday: metricsRes.data.fuelDispensedToday,
          activeLanesCount: metricsRes.data.activeLanesCount,
          offlineDevicesCount: metricsRes.data.offlineDevicesCount,
          isLoading: false
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to load system state.', isLoading: false });
    }
  },

  loadTransactions: async (page, limit, statusFilter, searchQuery) => {
    // Normalise status filter to lowercase
    const normalizedFilter = statusFilter && statusFilter !== 'ALL' ? statusFilter.toLowerCase() : statusFilter;
    const { data, totalCount, error } = await transactionService.fetchAllTransactionsPaginated(page, limit, normalizedFilter, searchQuery);
    if (!error) {
      set({ 
        transactions: data, 
        totalTransactions: totalCount
      });
    }
  },

  loadQueueSessions: async () => {
    const { data, error } = await queueService.fetchAllQueueSessions();
    if (!error) {
      // Normalize statuses in sessions
      const normalized = (data || []).map(q => ({
        ...q,
        status: (q.status || '').toLowerCase().trim() || 'waiting',
        transactions: q.transactions ? {
          ...q.transactions,
          status: (q.transactions.status || '').toLowerCase().trim(),
          queue_number: q.transactions.queue_number ? q.transactions.queue_number.toString() : ''
        } : null
      }));
      set({ queueSessions: normalized });
    }
  },

  loadIoTDevices: async () => {
    const { data, error } = await iotService.fetchDevices();
    if (!error) {
      if (data.length === 0) {
        get().logTerminalMsg("NO IOT DEVICES FOUND. SEEDING MOCK INFRASTRUCTURE...");
        const devicesToSeed = [
          { deviceType: 'CCTV', mqttTopic: 'sfrt/cctv/lane1', status: 'online' as const },
          { deviceType: 'CCTV', mqttTopic: 'sfrt/cctv/lane2', status: 'online' as const },
          { deviceType: 'GATE_BARRIER', mqttTopic: 'sfrt/barrier/lane1', status: 'online' as const },
          { deviceType: 'GATE_BARRIER', mqttTopic: 'sfrt/barrier/lane2', status: 'online' as const },
          { deviceType: 'NOZZLE', mqttTopic: 'sfrt/nozzle/pump1', status: 'online' as const },
          { deviceType: 'NOZZLE', mqttTopic: 'sfrt/nozzle/pump2', status: 'online' as const },
          { deviceType: 'RFID_READER', mqttTopic: 'sfrt/rfid/lane1', status: 'online' as const },
          { deviceType: 'RFID_READER', mqttTopic: 'sfrt/rfid/lane2', status: 'online' as const },
        ];
        for (const dev of devicesToSeed) {
          await iotService.createDevice({
            stationId: get().stations[0]?.id || null,
            ...dev
          });
        }
        const { data: refreshed } = await iotService.fetchDevices();
        set({ iotDevices: refreshed || [] });
      } else {
        set({ iotDevices: data });
      }
    }
  },

  loadFuelLogs: async () => {
    const { data, error } = await fuelService.fetchFuelLogs();
    if (!error) {
      set({ fuelLogs: data });
    }
  },

  loadStations: async () => {
    const { data, error } = await stationService.fetchStations();
    if (!error) {
      set({ stations: data });
    }
  },

  loadUsers: async () => {
    const { data, error } = await adminService.fetchUsers();
    if (!error) {
      set({ users: data });
    }
  },

  updateStationStatus: async (stationId, status) => {
    const { success } = await stationService.updateStationStatus(stationId, status);
    if (success) {
      get().logTerminalMsg(`STATION ${stationId.split('-')[0]} SET TO: ${status}`);
      await get().loadStations();
      return true;
    }
    return false;
  },

  updateIoTDeviceStatus: async (deviceId, status) => {
    const { success } = await iotService.updateDeviceStatus(deviceId, status);
    if (success) {
      get().logTerminalMsg(`DEVICE ${deviceId.split('-')[0]} STATUS UPDATED to ${status}`);
      await get().loadIoTDevices();
      return true;
    }
    return false;
  },

  updateQueueStatus: async (sessionId, status, laneNumber) => {
    const { success } = await queueService.updateQueueSessionStatus(sessionId, status, laneNumber);
    if (success) {
      get().logTerminalMsg(`QUEUE SESSION ${sessionId.split('-')[0]} STATUS CHANGED to ${status}`);
      
      // If status completed, sync the transaction status in DB to 'completed'
      if (status.toLowerCase() === 'completed') {
        const session = get().queueSessions.find(q => q.id === sessionId);
        if (session && session.transaction_id) {
          await supabase.from('transactions').update({ status: 'completed' }).eq('id', session.transaction_id);
        }
      }

      await get().loadQueueSessions();
      return true;
    }
    return false;
  },

  changeUserRole: async (userId, role) => {
    const { success } = await adminService.updateUserRole(userId, role);
    if (success) {
      get().logTerminalMsg(`USER ROLE MODIFIED for user ${userId.split('-')[0]} to ${role}`);
      await get().loadUsers();
      return true;
    }
    return false;
  },

  resolveAlert: async (alertId, userId) => {
    const { success } = await iotService.updateAlertStatus(alertId, 'resolved', userId);
    if (success) {
      get().logTerminalMsg(`ALERT ${alertId.split('-')[0]} RESOLVED`);
      await get().loadTelemetryAndAlerts();
      return true;
    }
    return false;
  },

  saveSettings: (newSettings) => {
    set(state => {
      const merged = { ...state.settings, ...newSettings };
      localStorage.setItem('sfrt_admin_settings', JSON.stringify(merged));
      return { settings: merged };
    });
    get().logTerminalMsg("SYSTEM CONFIGURATION SAVED.");
  },

  startSubscriptions: () => {
    if (!get().settings.realtimeEngine) return;
    get().logTerminalMsg("INITIALIZING REALTIME POSTGRESQL LISTENER...");
    
    get().stopSubscriptions();

    const handleRealtimeChange = () => {
      if (subscriptionThrottleTimeout) clearTimeout(subscriptionThrottleTimeout);
      subscriptionThrottleTimeout = setTimeout(async () => {
        const metricsRes = await analyticsService.fetchDashboardMetrics();
        if (!metricsRes.error) {
          set({
            revenueToday: metricsRes.data.revenueToday,
            fuelDistributedToday: metricsRes.data.fuelDispensedToday,
            activeLanesCount: metricsRes.data.activeLanesCount,
            offlineDevicesCount: metricsRes.data.offlineDevicesCount
          });
        }
      }, 500);
    };

    const updateConnection = (status: string) => {
      if (status === 'SUBSCRIBED') {
        set({ connectionState: 'connected' });
      } else if (status === 'CLOSED') {
        set({ connectionState: 'disconnected' });
      } else {
        set({ connectionState: 'reconnecting' });
      }
    };

    const txChannel = supabase.channel('admin-store-tx')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, async (payload) => {
        get().logTerminalMsg(`DATABASE EVENT: transactions [${payload.eventType}]`);
        await get().loadTransactions(1, 10);
        handleRealtimeChange();
      })
      .subscribe((status) => updateConnection(status));

    const queueChannel = supabase.channel('admin-store-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_sessions' }, async (payload) => {
        get().logTerminalMsg(`DATABASE EVENT: queue_sessions [${payload.eventType}]`);
        await get().loadQueueSessions();
        handleRealtimeChange();
      })
      .subscribe();

    const deviceChannel = supabase.channel('admin-store-devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'iot_devices' }, async (payload) => {
        get().logTerminalMsg(`DATABASE EVENT: iot_devices [${payload.eventType}]`);
        await get().loadIoTDevices();
        handleRealtimeChange();
      })
      .subscribe();

    const telemetryChannel = supabase.channel('admin-store-telemetry')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'telemetry_logs' }, async () => {
        await get().loadTelemetryAndAlerts();
      })
      .subscribe();

    const alertsChannel = supabase.channel('admin-store-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_alerts' }, async () => {
        await get().loadTelemetryAndAlerts();
      })
      .subscribe();

    set({ channels: [txChannel, queueChannel, deviceChannel, telemetryChannel, alertsChannel] });
  },

  stopSubscriptions: () => {
    const { channels } = get();
    if (channels.length > 0) {
      get().logTerminalMsg("SHUTTING DOWN REALTIME POSTGRESQL LISTENERS...");
      channels.forEach(ch => {
        supabase.removeChannel(ch);
      });
      set({ channels: [], connectionState: 'disconnected' });
    }
  },

  startSimulation: () => {
    if (get().simulationIntervalId) return;
    get().logTerminalMsg("IOT TELEMETRY SIMULATION LOOP ONLINE.");

    const id = setInterval(async () => {
      const devices = get().iotDevices;
      const stationsList = get().stations;
      const queues = get().queueSessions;

      if (devices.length === 0) return;

      // 1. Device selection
      const randomIndex = Math.floor(Math.random() * devices.length);
      const targetDevice = devices[randomIndex];
      const nextStatus = Math.random() > 0.05 ? 'online' : 'offline';
      
      // Update device ping locally and in db
      await iotService.updateDeviceStatus(targetDevice.id, nextStatus);

      // Create telemetry log in DB
      await iotService.createTelemetryLog({
        deviceId: targetDevice.id,
        deviceType: targetDevice.deviceType,
        mqttTopic: targetDevice.mqttTopic,
        severity: nextStatus === 'online' ? 'info' : 'critical',
        message: `Heartbeat check from node: ${targetDevice.deviceType} (${targetDevice.mqttTopic}). State: ${nextStatus.toUpperCase()}`,
        metadata: { battery: 98, status: nextStatus }
      });

      // Handle alerts lifecycle based on online/offline status
      if (nextStatus === 'offline') {
        await iotService.createAlert({
          title: `Hardware Node Offline: ${targetDevice.deviceType}`,
          message: `The device at topic '${targetDevice.mqttTopic}' is offline. Please audit RFID readers or CCTV connectivity logs immediately.`,
          severity: 'critical',
          status: 'active'
        });
      } else {
        // Resolve matching alerts if any exist
        const activeAlert = get().systemAlerts.find(a => a.title.includes(targetDevice.deviceType) && a.status === 'active');
        if (activeAlert) {
          await iotService.updateAlertStatus(activeAlert.id, 'resolved');
        }
      }

      // 2. Queue session auto-progression simulation
      const waitingSession = queues.find(q => q.status === 'waiting');
      const refuelingSession = queues.find(q => q.status === 'refueling');

      if (refuelingSession && Math.random() > 0.6) {
        // Complete refueling
        await get().updateQueueStatus(refuelingSession.id, 'completed');
        
        // Log a fuel depletion
        if (stationsList.length > 0) {
          const fuels = ['Pertalite', 'Pertamax', 'Pertamax Turbo', 'Solar'];
          const fuel = fuels[Math.floor(Math.random() * fuels.length)];
          const liters = Math.floor(10 + Math.random() * 40);
          
          await fuelService.createFuelLog({
            station_id: stationsList[0].id,
            fuel_type: fuel,
            current_stock_liters: Math.max(100, 5000 - liters),
            capacity_liters: 5000,
            price_per_liter: fuel === 'Pertalite' ? 10000 : fuel === 'Pertamax' ? 12500 : fuel === 'Pertamax Turbo' ? 14850 : 6800
          });
        }
      } else if (waitingSession && Math.random() > 0.5) {
        // Advance waiting session to refueling
        const laneNumber = Math.random() > 0.5 ? 1 : 2;
        await get().updateQueueStatus(waitingSession.id, 'refueling', laneNumber);
      }

    }, 8000);

    set({ simulationIntervalId: id });
  },

  stopSimulation: () => {
    const { simulationIntervalId } = get();
    if (simulationIntervalId) {
      get().logTerminalMsg("SHUTTING DOWN IOT TELEMETRY SIMULATION LOOP...");
      clearInterval(simulationIntervalId);
      set({ simulationIntervalId: null });
    }
  }
}));
