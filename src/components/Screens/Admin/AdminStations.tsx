import React from 'react';
import { useAdminStore } from '../../../lib/adminStore';
import { ShieldCheck, MapPin, Power, RefreshCw, AlertTriangle, Droplet, Clock, Settings } from 'lucide-react';
import GlassCard from '../../GlassCard';

export function AdminStations() {
  const { stations, updateStationStatus, loadStations, isLoading } = useAdminStore();

  const handleToggleMaintenance = async (stationId: string, currentStatus: string) => {
    const nextStatus = (currentStatus === 'OPEN' || currentStatus === 'operational') ? 'BUSY' : 'OPEN';
    await updateStationStatus(stationId, nextStatus);
  };

  return (
    <div className="space-y-6 font-sans text-text-primary animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-panel-bg p-5 rounded-2xl border border-border-primary gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-text-primary">Stations</h2>
            <p className="text-xs text-text-secondary">Control smart refueling station status, set thresholds, and override operational mode.</p>
          </div>
        </div>
        <div>
          <button 
            onClick={loadStations}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-panel-bg border border-border-primary hover:border-brand-emerald/30 text-xs font-sans font-medium text-text-primary transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Stations Card Grid */}
      {stations.length === 0 ? (
        <div className="py-20 text-center text-text-secondary font-sans text-sm border border-dashed border-border-primary rounded-2xl bg-panel-bg">
          No station nodes retrieved from Supabase.
        </div>
      ) : (
        <div className={
          stations.length === 1 
            ? "max-w-2xl mx-auto w-full" 
            : "grid grid-cols-1 md:grid-cols-2 gap-6"
        }>
          {stations.map(station => {
            const isMaintenance = station.status === 'BUSY';
            
            return (
              <div key={station.id} className="w-full">
                <GlassCard className="p-6 border border-border-primary space-y-6 shadow-sm">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-border-primary pb-4">
                    <div className="space-y-1.5">
                      <h3 className="font-display font-semibold text-text-primary text-base">
                        {station.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span>{station.address}</span>
                      </div>
                    </div>
                    
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold uppercase tracking-wider ${
                      isMaintenance 
                        ? 'bg-amber-500/10 text-amber-500' 
                        : 'bg-brand-emerald/10 text-brand-emerald'
                    }`}>
                      {isMaintenance ? 'Maintenance' : 'Active'}
                    </span>
                  </div>

                  {/* Live Stock Level Bar */}
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-text-secondary font-medium">Pertalite stock (RON 90):</span>
                        <span className="font-semibold text-text-primary">85% (4,250L / 5,000L)</span>
                      </div>
                      <div className="w-full bg-overlay rounded-full h-1.5 overflow-hidden border border-border-primary">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-text-secondary font-medium">Pertamax stock (RON 92):</span>
                        <span className="font-semibold text-text-primary">92% (4,600L / 5,000L)</span>
                      </div>
                      <div className="w-full bg-overlay rounded-full h-1.5 overflow-hidden border border-border-primary">
                        <div className="bg-sky-500 h-full rounded-full" style={{ width: '92%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-text-secondary font-medium">Pertamax Turbo stock (RON 98):</span>
                        <span className="font-semibold text-text-primary">78% (3,900L / 5,000L)</span>
                      </div>
                      <div className="w-full bg-overlay rounded-full h-1.5 overflow-hidden border border-border-primary">
                        <div className="bg-brand-emerald h-full rounded-full" style={{ width: '78%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Detail attributes */}
                  <div className="grid grid-cols-2 gap-4 border-t border-border-primary pt-4 text-xs text-text-secondary">
                    <div className="space-y-1">
                      <span>Coordinates:</span>
                      <p className="text-text-primary font-semibold">{station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}</p>
                    </div>
                    <div className="space-y-1">
                      <span>Wait Time:</span>
                      <p className="text-text-primary font-semibold">~{station.estWaitMinutes || 3} mins</p>
                    </div>
                  </div>

                  {/* Maintenance Toggle */}
                  <div className="flex justify-between items-center bg-overlay p-4 rounded-xl border border-border-primary shadow-xs">
                    <div className="space-y-1">
                      <span className="font-sans text-xs font-semibold text-text-primary block">Maintenance Override</span>
                      <span className="text-[11px] text-text-secondary">Disable queue routing temporarily.</span>
                    </div>
                    <button
                      onClick={() => handleToggleMaintenance(station.id, station.status)}
                      className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-sans text-xs font-semibold transition-all cursor-pointer border ${
                        isMaintenance
                          ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20 hover:bg-brand-emerald/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {isMaintenance ? 'Enable' : 'Disable'}
                    </button>
                  </div>

                </GlassCard>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
