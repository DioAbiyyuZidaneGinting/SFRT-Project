import React from 'react';
import { useAdminStore } from '../../../lib/adminStore';
import { Route, Play, CheckCircle, Clock, Trash, AlertTriangle, Car, Milestone, HelpCircle } from 'lucide-react';
import GlassCard from '../../GlassCard';

export function AdminQueueFlow() {
  const { queueSessions, stations, updateQueueStatus, logTerminalMsg } = useAdminStore();

  // Helper format currency IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Group queue sessions by status (case insensitive)
  const waitingSessions = queueSessions.filter(q => (q.status || '').toLowerCase() === 'waiting');
  const refuelingSessions = queueSessions.filter(q => (q.status || '').toLowerCase() === 'refueling');
  const completedSessions = queueSessions.filter(q => (q.status || '').toLowerCase() === 'completed');

  const handleAdvanceToRefueling = async (sessionId: string) => {
    const success = await updateQueueStatus(sessionId, 'refueling');
    if (success) {
      logTerminalMsg(`Admin advanced Queue Session ${sessionId.split('-')[0]} to refueling`);
    }
  };

  const handleCompleteFueling = async (sessionId: string) => {
    const success = await updateQueueStatus(sessionId, 'completed');
    if (success) {
      logTerminalMsg(`Admin completed Queue Session ${sessionId.split('-')[0]}`);
    }
  };

  return (
    <div className="space-y-6 font-sans text-text-primary animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-panel-bg p-5 rounded-2xl border border-border-primary gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-text-primary">Queue Routing</h2>
            <p className="text-xs text-text-secondary">Monitor flow lanes, manage barrier overrides, and progress smart queues.</p>
          </div>
        </div>
      </div>

      {/* Stats Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 shrink-0">
        <GlassCard className="border border-border-primary shadow-sm h-[76px] min-h-[76px] max-h-[76px] overflow-hidden">
          <div className="flex-grow flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block">Waiting in Queue</span>
              <span className="text-lg font-bold text-text-primary block font-display leading-none">{waitingSessions.length} Vehicles</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-xs shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border border-border-primary shadow-sm h-[76px] min-h-[76px] max-h-[76px] overflow-hidden">
          <div className="flex-grow flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block">Dispenser Active</span>
              <span className="text-lg font-bold text-text-primary block font-display leading-none">{refuelingSessions.length} Pumps</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500 shadow-xs shrink-0">
              <Play className="w-4 h-4" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border border-border-primary shadow-sm h-[76px] min-h-[76px] max-h-[76px] overflow-hidden">
          <div className="flex-grow flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block">Throughput Completed</span>
              <span className="text-lg font-bold text-text-primary block font-display leading-none">{completedSessions.length} Flows</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald shadow-xs shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Flow Lane Visual Boards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stage 1: RFID Waiting Queue */}
        <GlassCard className="border border-border-primary flex flex-col h-[485px] max-h-[485px] overflow-hidden shadow-sm">
          <div className="flex justify-between items-center mb-3 shrink-0 px-5 pt-4">
            <div className="flex items-center gap-2">
              <Milestone className="w-4 h-4 text-amber-500" />
              <h3 className="font-display font-semibold text-text-primary text-sm">RFID Waiting</h3>
            </div>
            <span className="font-sans text-[10px] bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full font-semibold">
              Stage 1
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 px-5 pb-5 pr-2 custom-scrollbar max-h-[390px]">
            {waitingSessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary text-center space-y-2 py-12">
                <Car className="w-10 h-10 text-text-secondary/20" />
                <span className="font-sans text-xs block font-medium">RFID Gateway clear. No waiting vehicles.</span>
              </div>
            ) : (
              waitingSessions.map(session => (
                <div 
                  key={session.id} 
                  className="p-4 bg-overlay rounded-xl border border-border-primary space-y-3 hover:border-amber-500/30 transition-all shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="font-sans font-semibold text-text-primary text-sm">
                        {session.transactions?.plate_number || 'MOCKED_PLATE'}
                      </span>
                      <span className="text-xs text-text-secondary block font-sans">
                        Fuel: {session.transactions?.fuel_type_name || 'Standard'}
                      </span>
                    </div>
                    <span className="font-sans font-bold text-xs text-text-primary bg-panel-bg px-2.5 py-0.5 rounded-lg border border-border-primary">
                      {session.transactions?.queue_number || 'Q-WAIT'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-border-primary text-xs">
                    <span className="text-text-secondary">Joined {new Date(session.created_at).toLocaleTimeString('en-US', { hour12: false })}</span>
                    <button 
                      onClick={() => handleAdvanceToRefueling(session.id)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 transition-all cursor-pointer font-medium text-[10px]"
                    >
                      <Play className="w-3 h-3" /> Allow Access
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Stage 2: Pump Refueling */}
        <GlassCard className="border border-border-primary flex flex-col h-[485px] max-h-[485px] overflow-hidden shadow-sm">
          <div className="flex justify-between items-center mb-3 shrink-0 px-5 pt-4">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-sky-500" />
              <h3 className="font-display font-semibold text-text-primary text-sm">Refueling Stage</h3>
            </div>
            <span className="font-sans text-[10px] bg-sky-500/10 text-sky-500 px-2.5 py-0.5 rounded-full font-semibold">
              Stage 2
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 px-5 pb-5 pr-2 custom-scrollbar max-h-[390px]">
            {refuelingSessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary text-center space-y-2 py-12">
                <Milestone className="w-10 h-10 text-text-secondary/20 animate-pulse" />
                <span className="font-sans text-xs block font-medium">Dispensers standby. Waiting for vehicles.</span>
              </div>
            ) : (
              refuelingSessions.map(session => (
                <div 
                  key={session.id} 
                  className="p-4 bg-overlay rounded-xl border border-border-primary space-y-3 hover:border-sky-500/30 transition-all shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="font-sans font-semibold text-text-primary text-sm">
                        {session.transactions?.plate_number || 'REFUELING'}
                      </span>
                      <span className="text-xs text-text-secondary block font-sans">
                        Fuel: {session.transactions?.fuel_type_name || 'Standard'}
                      </span>
                    </div>
                    <span className="font-sans font-bold text-xs text-text-primary bg-panel-bg px-2.5 py-0.5 rounded-lg border border-border-primary animate-pulse">
                      {session.transactions?.queue_number || 'Q-FLOW'}
                    </span>
                  </div>

                  <div className="space-y-1.5 font-sans text-xs text-text-secondary bg-sky-500/5 p-3 rounded-xl border border-sky-500/15">
                    <div className="flex justify-between">
                      <span>Refuel Volume:</span>
                      <span className="font-semibold text-text-primary">{session.transactions?.liters || 0} L</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Paid:</span>
                      <span className="font-semibold text-brand-emerald">{formatIDR(session.transactions?.total_price || 0)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-border-primary text-xs">
                    <span className="text-sky-500 font-semibold animate-pulse">Refueling...</span>
                    <button 
                      onClick={() => handleCompleteFueling(session.id)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/30 transition-all cursor-pointer font-medium text-[10px]"
                    >
                      <CheckCircle className="w-3 h-3" /> Complete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Stage 3: Audit Completed */}
        <GlassCard className="border border-border-primary flex flex-col h-[485px] max-h-[485px] overflow-hidden shadow-sm">
          <div className="flex justify-between items-center mb-3 shrink-0 px-5 pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand-emerald" />
              <h3 className="font-display font-semibold text-text-primary text-sm">Completed Logs</h3>
            </div>
            <span className="font-sans text-[10px] bg-brand-emerald/10 text-brand-emerald px-2.5 py-0.5 rounded-full font-semibold">
              Stage 3
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 px-5 pb-5 pr-2 custom-scrollbar max-h-[390px]">
            {completedSessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary text-center space-y-2 py-12">
                <CheckCircle className="w-10 h-10 text-text-secondary/20" />
                <span className="font-sans text-xs block font-medium">No completed sessions logged.</span>
              </div>
            ) : (
              completedSessions.map(session => (
                <div 
                  key={session.id} 
                  className="p-4 bg-overlay rounded-xl border border-border-primary flex justify-between items-center shadow-xs"
                >
                  <div className="space-y-1">
                    <span className="font-sans font-semibold text-text-primary text-xs">
                      {session.transactions?.plate_number || 'COMPLETED'}
                    </span>
                    <span className="text-[11px] text-text-secondary block font-sans">
                      {session.transactions?.liters || 0} L • {session.transactions?.fuel_type_name}
                    </span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="font-sans font-semibold text-brand-emerald text-xs block">
                      {formatIDR(session.transactions?.total_price || 0)}
                    </span>
                    <span className="text-[10px] text-text-secondary font-sans block">
                      {new Date(session.created_at).toLocaleTimeString('en-US', { hour12: false })}
                    </span>
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
