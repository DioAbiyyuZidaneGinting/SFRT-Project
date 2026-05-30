import React from 'react';
import { useAdminStore } from '../../../lib/adminStore';
import { Server, Wifi, RefreshCw, Terminal, Activity, Zap, Play, Square, HardDrive } from 'lucide-react';
import GlassCard from '../../GlassCard';

export function AdminDevices() {
  const { 
    iotDevices, 
    terminalLogs, 
    loadIoTDevices, 
    updateIoTDeviceStatus, 
    isLoading,
    startSimulation,
    stopSimulation,
    simulationIntervalId
  } = useAdminStore();

  const handleToggleDevice = async (deviceId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'online' ? 'offline' : 'online';
    await updateIoTDeviceStatus(deviceId, nextStatus);
  };

  const isSimActive = !!simulationIntervalId;

  return (
    <div className="space-y-6 font-sans text-text-primary animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-panel-bg p-5 rounded-2xl border border-border-primary gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-text-primary">IoT Devices</h2>
            <p className="text-xs text-text-secondary">Monitor IoT edge controller state, connection heartbeats, and control simulations.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => isSimActive ? stopSimulation() : startSimulation()}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer border ${
              isSimActive
                ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                : 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20 hover:bg-brand-emerald/20'
            }`}
          >
            {isSimActive ? (
              <>
                <Square className="w-3.5 h-3.5" /> Stop Simulator
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Run Simulator
              </>
            )}
          </button>
          <button 
            onClick={loadIoTDevices}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-panel-bg border border-border-primary hover:border-brand-emerald/30 text-xs font-sans font-medium text-text-primary transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Grid: Devices Matrix + Telemetry Console */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Device Matrix Column */}
        <div className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {iotDevices.map(device => {
              const isOnline = device.status === 'online';
              
              return (
                <div key={device.id}>
                  <GlassCard className="p-5 border border-border-primary flex flex-col justify-between space-y-4 shadow-sm hover:shadow transition-all">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-text-secondary" />
                          <span className="font-sans text-sm font-semibold text-text-primary">
                            {device.deviceType}
                          </span>
                        </div>
                        <span className="font-sans text-xs text-text-secondary block truncate max-w-[180px]" title={device.mqttTopic}>
                          Topic: {device.mqttTopic}
                        </span>
                      </div>
                      
                      <span className={`flex items-center gap-1.5 font-sans text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        isOnline ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-red-500/10 text-red-500'
                      }`}>
                        <Wifi className={`w-3 h-3 ${isOnline ? 'animate-pulse' : ''}`} />
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-border-primary text-xs">
                      <span className="text-text-secondary">
                        Last ping: {new Date(device.lastPing).toLocaleTimeString('en-US', { hour12: false })}
                      </span>
                      <button 
                        onClick={() => handleToggleDevice(device.id, device.status)}
                        className={`px-3 py-1 rounded-xl border text-xs font-sans font-medium transition-colors cursor-pointer ${
                          isOnline 
                            ? 'border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/15' 
                            : 'border-brand-emerald/30 text-brand-emerald bg-brand-emerald/5 hover:bg-brand-emerald/15'
                        }`}
                      >
                        {isOnline ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </GlassCard>
                </div>
              );
            })}
          </div>

          {iotDevices.length === 0 && (
            <div className="py-20 text-center text-text-secondary font-sans text-sm border border-dashed border-border-primary rounded-2xl">
              No hardware nodes registered in the database.
            </div>
          )}
        </div>

        {/* Telemetry Console Column */}
        <GlassCard className="p-5 border border-border-primary shadow-sm flex flex-col h-[400px] xl:h-auto animate-none">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <Terminal className="w-4 h-4 text-brand-emerald" />
            <h3 className="font-display font-semibold text-text-primary text-sm">MQTT Telemetry Bus</h3>
          </div>
          <div className="flex-1 bg-black text-zinc-400 p-4 rounded-xl border border-zinc-800 font-mono text-[10px] overflow-y-auto custom-scrollbar space-y-2">
            {terminalLogs.length === 0 ? (
              <div className="text-zinc-500 animate-pulse">
                [SYSTEM STANDBY] Listening on broker port 1883...
              </div>
            ) : (
              terminalLogs.map((log, i) => (
                <div key={i} className="leading-relaxed hover:bg-zinc-900 py-0.5 px-1 rounded transition-all">
                  {log}
                </div>
              ))
            )}
          </div>
        </GlassCard>

      </div>

    </div>
  );
}
