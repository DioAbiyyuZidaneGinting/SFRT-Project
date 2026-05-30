import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../../lib/adminStore';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LineChart as ChartIcon, Calendar, ArrowUpRight, TrendingUp, Users, Droplet, ArrowDownRight } from 'lucide-react';
import GlassCard from '../../GlassCard';
import { analyticsService, HourlyMetric, FuelShareMetric, StationQueueMetric, UserGrowthMetric } from '../../../services/analyticsService';

const Shimmer = ({ className = "h-72 w-full" }: { className?: string }) => (
  <div className={`animate-pulse bg-border-primary rounded-xl ${className}`} />
);

export function AdminAnalytics() {
  const { transactions, queueSessions } = useAdminStore();
  const [timeRange, setTimeRange] = useState<string>('30days');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // States for aggregated views
  const [hourlyData, setHourlyData] = useState<HourlyMetric[]>([]);
  const [fuelData, setFuelData] = useState<FuelShareMetric[]>([]);
  const [stationWaitTimes, setStationWaitTimes] = useState<StationQueueMetric[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthMetric[]>([]);

  // Helper format currency IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const loadAllAnalytics = async () => {
    setIsLoading(true);
    const [hrRes, fsRes, qRes, ugRes] = await Promise.all([
      analyticsService.fetchHourlyMetrics(timeRange),
      analyticsService.fetchFuelShare(timeRange),
      analyticsService.fetchAvgQueueDuration(timeRange),
      analyticsService.fetchUserGrowth(timeRange)
    ]);

    setHourlyData(hrRes.data || []);
    setFuelData(fsRes.data || []);
    setStationWaitTimes(qRes.data || []);
    setUserGrowthData(ugRes.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllAnalytics();
  }, [timeRange, transactions, queueSessions]); // Refresh on data change or filter update

  // Time Range comparison labels and rates
  const getGrowthIndicator = () => {
    switch (timeRange) {
      case 'today':
        return { label: 'vs yesterday', rate: '+18.4%', isPositive: true };
      case '7days':
        return { label: 'vs prev week', rate: '+14.2%', isPositive: true };
      case '30days':
      default:
        return { label: 'vs prev month', rate: '+22.1%', isPositive: true };
    }
  };

  const trend = getGrowthIndicator();

  return (
    <div className="space-y-6 font-sans pb-10 text-text-primary animate-fade-in">
      
      {/* Page Header with Time Range Select */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-panel-bg p-5 rounded-2xl border border-border-primary gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <ChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-text-primary">Analytics</h2>
            <p className="text-xs text-text-secondary font-medium">Station throughput and customer growth metrics</p>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center bg-overlay rounded-xl p-1 border border-border-primary shadow-inner">
          {(['today', '7days', '30days'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-sans text-xs font-medium cursor-pointer transition-all ${
                timeRange === range
                  ? 'bg-panel-bg text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary border border-transparent'
              }`}
            >
              {range === 'today' ? 'Today' : range === '7days' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Row: Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Hourly Flow Chart */}
        <GlassCard className="p-5 border border-border-primary shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-text-primary text-sm">Hourly Transactions</h3>
            <span className={`flex items-center gap-1 font-sans text-xs font-semibold ${
              trend.isPositive ? 'text-brand-emerald' : 'text-red-500'
            }`}>
              {trend.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {trend.rate} {trend.label}
            </span>
          </div>
          <div className="h-72">
            {isLoading ? (
              <Shimmer />
            ) : hourlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-secondary font-sans text-xs">
                No transactions recorded for the selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="transactions" stroke="#10b981" fillOpacity={1} fill="url(#revenueGlow)" strokeWidth={2} name="Transactions" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* User Registration Growth */}
        <GlassCard className="p-5 border border-border-primary shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-text-primary text-sm">Driver Registrations</h3>
            <span className="flex items-center gap-1.5 font-sans text-xs font-semibold text-sky-500">
              <Users className="w-4 h-4" /> Cumulative Members
            </span>
          </div>
          <div className="h-72">
            {isLoading ? (
              <Shimmer />
            ) : userGrowthData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-secondary font-sans text-xs">
                No driver registration data recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" tick={{fontSize: 10}} />
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
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="registeredDrivers" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} name="Registered Drivers" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Secondary Row: Fuel share and Wait times */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Fuel Share Pie Chart */}
        <GlassCard className="p-5 border border-border-primary xl:col-span-1 shadow-sm">
          <h3 className="font-display font-semibold text-text-primary text-sm mb-4">Fuel Market Share</h3>
          <div className="h-64 flex flex-col items-center justify-center space-y-4">
            {isLoading ? (
              <Shimmer className="h-40 w-40 rounded-full" />
            ) : fuelData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-secondary font-sans text-xs">
                No fuel allocation records
              </div>
            ) : (
              <>
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fuelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {fuelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full font-sans text-xs text-text-secondary">
                  {fuelData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: item.fill }} />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </GlassCard>

        {/* Station Wait Time bar chart */}
        <GlassCard className="p-5 border border-border-primary xl:col-span-2 shadow-sm">
          <h3 className="font-display font-semibold text-text-primary text-sm mb-4">Average Queue Duration (Minutes)</h3>
          <div className="h-64">
            {isLoading ? (
              <Shimmer />
            ) : stationWaitTimes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-secondary font-sans text-xs">
                No waiting durations recorded
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stationWaitTimes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="station" stroke="var(--text-secondary)" tick={{fontSize: 9}} />
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
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="avgWaitMinutes" fill="#f59e0b" name="Avg Wait" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="peakWaitMinutes" fill="#ef4444" name="Peak Wait" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

      </div>

    </div>
  );
}
