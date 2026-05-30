import React, { useState } from 'react';
import { useAdminStore } from '../../../lib/adminStore';
import { Settings, Save, Wifi, Volume2, ShieldAlert, Sliders, RefreshCw } from 'lucide-react';
import GlassCard from '../../GlassCard';

export function AdminSettings() {
  const { settings, saveSettings } = useAdminStore();
  const [voiceAI, setVoiceAI] = useState(settings.voiceAIEnergy);
  const [realtime, setRealtime] = useState(settings.realtimeEngine);
  const [threshold, setThreshold] = useState(settings.alertThresholdLiters);
  const [refresh, setRefresh] = useState(settings.queueRefreshRateSeconds);
  const [maintenance, setMaintenance] = useState(settings.maintenanceAlerts);
  
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    saveSettings({
      voiceAIEnergy: voiceAI,
      realtimeEngine: realtime,
      alertThresholdLiters: Number(threshold),
      queueRefreshRateSeconds: Number(refresh),
      maintenanceAlerts: maintenance
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans text-text-primary animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-panel-bg p-5 rounded-2xl border border-border-primary gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-text-primary">System Settings</h2>
            <p className="text-xs text-text-secondary">Configure alerts, adjust real-time synchronizer, and save thresholds parameters.</p>
          </div>
        </div>
        <div>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-emerald text-white hover:bg-brand-emerald/90 text-xs font-sans font-medium transition-all cursor-pointer shadow-sm"
          >
            <Save className="w-3.5 h-3.5" /> Save Configuration
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-4 bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald font-sans text-xs font-semibold rounded-xl animate-fade-in shadow-sm">
          ✓ Configuration changes successfully saved to the local store.
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Realtime and voice services card */}
        <GlassCard className="p-6 border border-border-primary space-y-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border-primary pb-3">
            <Wifi className="w-4 h-4 text-brand-emerald" />
            <h3 className="font-display font-semibold text-text-primary text-sm">Core Services</h3>
          </div>

          <div className="space-y-4 font-sans text-xs">
            {/* Realtime sync toggle */}
            <div className="flex justify-between items-center bg-overlay p-4 rounded-xl border border-border-primary shadow-xs">
              <div className="space-y-1">
                <span className="font-sans text-xs font-semibold text-text-primary block">Real-time Sync Engine</span>
                <span className="text-text-secondary text-[11px]">Synchronize client logs via Supabase channels.</span>
              </div>
              <input 
                type="checkbox" 
                checked={realtime}
                onChange={(e) => setRealtime(e.target.checked)}
                className="w-4 h-4 accent-brand-emerald cursor-pointer"
              />
            </div>

            {/* Voice toggle */}
            <div className="flex justify-between items-center bg-overlay p-4 rounded-xl border border-border-primary shadow-xs">
              <div className="space-y-1">
                <span className="font-sans text-xs font-semibold text-text-primary block">Voice AI Guidance</span>
                <span className="text-text-secondary text-[11px]">Provide verbal queues instruction for refueling.</span>
              </div>
              <input 
                type="checkbox" 
                checked={voiceAI}
                onChange={(e) => setVoiceAI(e.target.checked)}
                className="w-4 h-4 accent-brand-emerald cursor-pointer"
              />
            </div>
          </div>
        </GlassCard>

        {/* Operational Limits and Thresholds card */}
        <GlassCard className="p-6 border border-border-primary space-y-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border-primary pb-3">
            <Sliders className="w-4 h-4 text-brand-emerald" />
            <h3 className="font-display font-semibold text-text-primary text-sm">Thresholds & Parameters</h3>
          </div>

          <div className="space-y-4 font-sans text-xs">
            {/* Stock Alarm threshold */}
            <div className="space-y-2">
              <label className="block text-text-secondary font-semibold text-[11px] uppercase tracking-wider">Stock Alarm Threshold (Liters)</label>
              <input 
                type="number" 
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-overlay border border-border-primary text-text-primary focus:outline-none focus:border-brand-emerald/40 transition-colors text-xs"
              />
              <span className="text-[11px] text-text-secondary block">Triggers Warning alert when tank levels drop below this limit.</span>
            </div>

            {/* Refresh Rate */}
            <div className="space-y-2">
              <label className="block text-text-secondary font-semibold text-[11px] uppercase tracking-wider">Queue Auto-Refresh Rate (Seconds)</label>
              <input 
                type="number" 
                value={refresh}
                onChange={(e) => setRefresh(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-overlay border border-border-primary text-text-primary focus:outline-none focus:border-brand-emerald/40 transition-colors text-xs"
              />
              <span className="text-[11px] text-text-secondary block">Interval frequency for dashboard queue updates polls.</span>
            </div>
          </div>
        </GlassCard>

      </div>

    </div>
  );
}
