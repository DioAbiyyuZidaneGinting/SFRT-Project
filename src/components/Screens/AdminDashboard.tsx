import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Activity, Users, Database, AlertTriangle, 
  Droplet, Clock, CheckCircle, Car, Settings, Wifi, Terminal, Flame, Info, ArrowRight
} from 'lucide-react';
import GlassCard from '../GlassCard';
import { useTheme } from '../ThemeProvider';
import { useAdminStore } from '../../lib/adminStore';
import { voiceService } from '../../services/voiceService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { analyticsService, HourlyMetric, FuelShareMetric } from '../../services/analyticsService';

const Shimmer = ({ className = "h-6 w-24" }: { className?: string }) => (
  <div className={`animate-pulse bg-border-primary rounded-lg ${className}`} />
);

export function AdminDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const {
    transactions,
    queueSessions,
    iotDevices,
    stations,
    revenueToday,
    fuelDistributedToday,
    activeLanesCount,
    offlineDevicesCount,
    telemetryLogs,
    systemAlerts,
    saveSettings,
    connectionState,
    isLoading
  } = useAdminStore();

  const [analyticsData, setAnalyticsData] = useState<{
    hourly: HourlyMetric[];
    fuelShare: FuelShareMetric[];
  }>({ hourly: [], fuelShare: [] });
  
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Helper format currency IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const fetchLiveCharts = async () => {
    setLoadingAnalytics(true);
    const [hrRes, fsRes] = await Promise.all([
      analyticsService.fetchHourlyMetrics('today'),
      analyticsService.fetchFuelShare('today')
    ]);
    setAnalyticsData({
      hourly: hrRes.data || [],
      fuelShare: fsRes.data || []
    });
    setLoadingAnalytics(false);
  };

  useEffect(() => {
    fetchLiveCharts();
  }, [transactions, queueSessions]); // Refresh when real-time operations occur

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="flex-grow space-y-6 animate-fade-in font-sans pb-10 text-text-primary">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-panel-bg p-5 rounded-2xl border border-border-primary shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-text-primary">Command Center</h2>
            <div className="flex gap-4 font-sans text-xs text-text-secondary mt-1">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-500" /> Supabase Realtime
              </span>
              <span className={`flex items-center gap-1.5 font-medium ${
                connectionState === 'connected' ? 'text-brand-emerald animate-pulse' : 'text-red-500'
              }`}>
                <Wifi className="w-3.5 h-3.5" /> System {connectionState === 'connected' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        <div>
          <button 
            onClick={() => {
              voiceService.toggle(!voiceService.isEnabled);
              voiceService.speak("Voice AI system is now " + (voiceService.isEnabled ? "online" : "offline"));
              saveSettings({ voiceAIEnergy: voiceService.isEnabled });
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-sans text-xs font-medium border transition-all cursor-pointer ${
              voiceService.isEnabled ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/30' : 'bg-overlay text-text-secondary border-border-primary hover:border-brand-emerald/30'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Voice Assistant {voiceService.isEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* BARIS 1: 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <GlassCard className="border border-border-primary shadow-sm h-[90px] min-h-[90px] max-h-[90px] overflow-hidden">
          <div className="flex-grow flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block">Revenue Today</span>
              {isLoading ? (
                <Shimmer className="h-6 w-32" />
              ) : (
                <span className="text-lg font-bold text-text-primary tracking-tight font-display">{formatIDR(revenueToday)}</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald shadow-sm shrink-0">
              <Database className="w-4.5 h-4.5" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border border-border-primary shadow-sm h-[90px] min-h-[90px] max-h-[90px] overflow-hidden">
          <div className="flex-grow flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block">Fuel Dispensed</span>
              {isLoading ? (
                <Shimmer className="h-6 w-24" />
              ) : (
                <span className="text-lg font-bold text-text-primary tracking-tight font-display">{fuelDistributedToday.toFixed(1)} L</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 shadow-sm shrink-0">
              <Droplet className="w-4.5 h-4.5" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border border-border-primary shadow-sm h-[90px] min-h-[90px] max-h-[90px] overflow-hidden">
          <div className="flex-grow flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block">Active Lanes</span>
              {isLoading ? (
                <Shimmer className="h-6 w-20" />
              ) : (
                <span className="text-lg font-bold text-text-primary tracking-tight font-display">{activeLanesCount} Sessions</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border border-border-primary shadow-sm h-[90px] min-h-[90px] max-h-[90px] overflow-hidden">
          <div className="flex-grow flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block">Offline Hardware</span>
              {isLoading ? (
                <Shimmer className="h-6 w-20" />
              ) : (
                <span className="text-lg font-bold text-text-primary tracking-tight font-display">{offlineDevicesCount} Nodes</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* BARIS 2: 2 CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-5 border border-border-primary shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-text-primary text-sm">Hourly Transactions</h3>
            <span className="font-sans text-[10px] text-brand-emerald uppercase bg-brand-emerald/10 px-2 py-0.5 rounded-full font-medium">Live Feed</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {loadingAnalytics ? (
              <Shimmer className="h-full w-full" />
            ) : analyticsData.hourly.length === 0 ? (
              <div className="text-text-secondary font-sans text-xs">No transactions registered today</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.hourly}>
                  <defs>
                    <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="hour" stroke="var(--text-secondary)" tick={{fontSize: 10}} />
                  <YAxis stroke="var(--text-secondary)" tick={{fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      fontFamily: 'sans-serif',
                      borderRadius: '12px'
                    }} 
                  />
                  <Area type="monotone" dataKey="transactions" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTx)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5 border border-border-primary shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-text-primary text-sm">Fuel Distribution</h3>
            <span className="font-sans text-[10px] text-text-secondary uppercase">All Stations</span>
          </div>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-around">
            {loadingAnalytics ? (
              <Shimmer className="h-48 w-48 rounded-full" />
            ) : analyticsData.fuelShare.length === 0 ? (
              <div className="text-text-secondary font-sans text-xs">No records available for today</div>
            ) : (
              <>
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.fuelShare}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analyticsData.fuelShare.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4 sm:mt-0 font-sans text-xs">
                  {analyticsData.fuelShare.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: item.fill || COLORS[idx] }} />
                      <span className="text-text-secondary font-medium">{item.name}:</span>
                      <span className="font-semibold text-text-primary">{item.value} Units</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </GlassCard>
      </div>

      {/* BARIS 3: LIVE TRANSACTION FEED + QUEUE VISUALIZATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Transaction Feed */}
        <GlassCard className="p-5 border border-border-primary shadow-sm flex flex-col h-[480px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-display font-semibold text-text-primary text-sm">Live Transactions</h3>
            <span className="font-sans text-[10px] text-text-secondary uppercase">Real-time Stream</span>
          </div>
          <div 
            className="overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar"
            style={{ maxHeight: '400px' }}
          >
            {transactions.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-text-secondary font-sans text-xs">
                Awaiting transactions feed...
              </div>
            ) : (
              transactions.map(tx => (
                <div 
                  key={tx.id} 
                  className="p-4 bg-overlay rounded-xl border border-border-primary hover:border-brand-emerald/30 transition-all flex justify-between items-center shrink-0 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-text-primary text-sm">{tx.plateNumber}</span>
                      <span className="text-[11px] text-text-secondary font-medium bg-border-primary/50 px-1.5 py-0.5 rounded">{tx.fuelTypeName}</span>
                    </div>
                    <span className="text-xs text-text-secondary block font-sans">ID: {tx.id.split('-')[0]} • {tx.time}</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="font-sans text-sm font-semibold text-text-primary block">{formatIDR(tx.totalPrice)}</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold capitalize ${
                      tx.status === 'completed' ? 'bg-brand-emerald/10 text-brand-emerald' :
                      tx.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                      tx.status === 'refueling' ? 'bg-sky-500/10 text-sky-500 animate-pulse' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Live Queue Flow Lanes */}
        <GlassCard className="p-5 border border-border-primary shadow-sm flex flex-col h-[480px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-display font-semibold text-text-primary text-sm">Station Lanes</h3>
            <span className="font-sans text-[10px] text-brand-emerald uppercase font-medium">Automatic Routing</span>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto pr-1 custom-scrollbar">
            {/* Lane 1 */}
            <div className="bg-overlay rounded-xl p-4 border border-border-primary flex flex-col">
              <span className="text-[11px] font-sans text-text-secondary font-semibold border-b border-border-primary pb-2 mb-3 block text-center uppercase tracking-wider">
                Lane 1 (Pump #1)
              </span>
              <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                {queueSessions
                  .filter(q => q.status !== 'completed' && q.status !== 'cancelled' && (q.lane_number === 1 || !q.lane_number))
                  .map(session => (
                    <div 
                      key={session.id} 
                      className="p-3 bg-panel-bg rounded-xl border border-border-primary flex flex-col gap-1 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-xs font-semibold text-text-primary">
                          {session.transactions?.plate_number || 'UNKNOWN'}
                        </span>
                        <span className={`text-[9px] font-sans px-2 py-0.5 rounded-full capitalize ${
                          session.status === 'refueling' ? 'bg-sky-500/10 text-sky-500 animate-pulse font-medium' : 'bg-amber-500/10 text-amber-500 font-medium'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-secondary">
                        Fuel: {session.transactions?.fuel_type_name || 'Standard'}
                      </span>
                    </div>
                  ))}
                {queueSessions.filter(q => q.status !== 'completed' && q.status !== 'cancelled' && (q.lane_number === 1 || !q.lane_number)).length === 0 && (
                  <div className="h-full flex items-center justify-center text-text-secondary font-sans text-[11px] text-center pt-10">
                    No vehicles in Lane 1
                  </div>
                )}
              </div>
            </div>

            {/* Lane 2 */}
            <div className="bg-overlay rounded-xl p-4 border border-border-primary flex flex-col">
              <span className="text-[11px] font-sans text-text-secondary font-semibold border-b border-border-primary pb-2 mb-3 block text-center uppercase tracking-wider">
                Lane 2 (Pump #2)
              </span>
              <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                {queueSessions
                  .filter(q => q.status !== 'completed' && q.status !== 'cancelled' && q.lane_number === 2)
                  .map(session => (
                    <div 
                      key={session.id} 
                      className="p-3 bg-panel-bg rounded-xl border border-border-primary flex flex-col gap-1 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-xs font-semibold text-text-primary">
                          {session.transactions?.plate_number || 'UNKNOWN'}
                        </span>
                        <span className={`text-[9px] font-sans px-2 py-0.5 rounded-full capitalize ${
                          session.status === 'refueling' ? 'bg-sky-500/10 text-sky-500 animate-pulse font-medium' : 'bg-amber-500/10 text-amber-500 font-medium'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-secondary">
                        Fuel: {session.transactions?.fuel_type_name || 'Standard'}
                      </span>
                    </div>
                  ))}
                {queueSessions.filter(q => q.status !== 'completed' && q.status !== 'cancelled' && q.lane_number === 2).length === 0 && (
                  <div className="h-full flex items-center justify-center text-text-secondary font-sans text-[11px] text-center pt-10">
                    No vehicles in Lane 2
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* BARIS 4: IOT DEVICES STATUS + TERMINAL LOGS + SYSTEM ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IoT Hardware Matrix */}
        <GlassCard className="p-5 border border-border-primary col-span-1 shadow-sm">
          <h3 className="font-display font-semibold text-text-primary text-sm mb-4">IoT Hardware Nodes</h3>
          <div className="grid grid-cols-2 gap-2">
            {iotDevices.map(dev => (
              <div 
                key={dev.id} 
                className="p-3 bg-overlay rounded-xl border border-border-primary flex items-center justify-between shadow-sm"
              >
                <div className="space-y-0.5">
                  <span className="font-sans text-xs text-text-primary font-semibold block">{dev.deviceType}</span>
                  <span className="font-sans text-[10px] text-text-secondary truncate block max-w-[90px]" title={dev.mqttTopic}>
                    {dev.mqttTopic.split('/').slice(-1)[0]}
                  </span>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  dev.status === 'online' ? 'bg-brand-emerald animate-pulse shadow-sm' : 'bg-red-500'
                }`} />
              </div>
            ))}
            {iotDevices.length === 0 && (
              <div className="col-span-2 py-8 text-center text-text-secondary font-sans text-xs">
                Awaiting telemetry bus...
              </div>
            )}
          </div>
        </GlassCard>

        {/* Live Terminal Output logs */}
        <GlassCard className="p-5 border border-border-primary col-span-1 shadow-sm flex flex-col h-[230px] lg:h-auto animate-none">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <Terminal className="w-4 h-4 text-brand-emerald" />
            <h3 className="font-display font-semibold text-text-primary text-sm">Telemetry Bus</h3>
          </div>
          <div 
            className="flex-1 p-3 rounded-xl border font-mono text-[10px] overflow-y-auto custom-scrollbar space-y-1.5 bg-black border-zinc-800 text-zinc-400"
          >
            {telemetryLogs.length === 0 ? (
              <div className="text-zinc-500">Telemetry feed active. Listening for node signals...</div>
            ) : (
              telemetryLogs.map((log) => (
                <div key={log.id} className="leading-relaxed hover:bg-zinc-900 py-0.5 rounded px-1 transition-colors">
                  [{new Date(log.createdAt).toLocaleTimeString()}] {log.message}
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* System Health / Alerts */}
        <GlassCard className="p-5 border border-border-primary col-span-1 shadow-sm">
          <h3 className="font-display font-semibold text-text-primary text-sm mb-4">Integrity Alert Logs</h3>
          <div className="space-y-2.5 overflow-y-auto max-h-[180px] pr-1 custom-scrollbar">
            {systemAlerts.length === 0 ? (
              <div className="p-4 bg-brand-emerald/5 border border-brand-emerald/15 text-brand-emerald text-center font-sans text-xs font-semibold rounded-xl">
                All systems fully operational
              </div>
            ) : (
              systemAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`p-3 rounded-xl border flex gap-3 items-start shadow-xs ${
                    alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/15 text-red-500' :
                    alert.severity === 'warning' ? 'bg-amber-500/5 border-amber-500/15 text-amber-500' :
                    'bg-sky-500/5 border-sky-500/15 text-sky-500'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {alert.severity === 'critical' ? <AlertTriangle className="w-4.5 h-4.5" /> :
                     alert.severity === 'warning' ? <Clock className="w-4.5 h-4.5" /> :
                     <Info className="w-4.5 h-4.5" />}
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-sans text-xs font-semibold uppercase block">
                      {alert.title}
                    </span>
                    <p className="font-sans text-[11px] leading-relaxed opacity-95">{alert.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

    </div>
  );
}
