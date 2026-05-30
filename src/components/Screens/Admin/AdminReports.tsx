import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../../lib/adminStore';
import { FileText, Printer, Download, Calendar, Filter, Droplet, DollarSign, Clock, CheckCircle } from 'lucide-react';
import GlassCard from '../../GlassCard';
import { supabase } from '../../../lib/supabase';
import { Transaction } from '../../../types';

export function AdminReports() {
  const { stations } = useAdminStore();
  const [reportType, setReportType] = useState('DAILY');
  const [selectedStationId, setSelectedStationId] = useState('ALL');
  const [reportTransactions, setReportTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      const now = new Date();
      let startDate = new Date();
      if (reportType === 'DAILY') {
        startDate.setHours(0, 0, 0, 0);
      } else if (reportType === 'WEEKLY') {
        startDate.setDate(now.getDate() - 7);
      } else if (reportType === 'MONTHLY') {
        startDate.setDate(now.getDate() - 30);
      }

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString());

      if (selectedStationId !== 'ALL') {
        query = query.eq('station_id', selectedStationId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      const formatted: Transaction[] = (data || []).map(tx => ({
        id: tx.id,
        userId: tx.user_id,
        stationId: tx.station_id,
        stationName: tx.station_name,
        vehicleId: tx.vehicle_id,
        plateNumber: tx.plate_number,
        fuelTypeId: tx.fuel_type_id,
        fuelTypeName: tx.fuel_type_name,
        liters: Number(tx.liters || tx.liters_selected || 0),
        pricePerLiter: Number(tx.price_per_liter || 0),
        totalPrice: Number(tx.total_price || 0),
        paymentMethod: tx.payment_method,
        date: tx.date || new Date(tx.created_at).toLocaleDateString(),
        time: tx.time || new Date(tx.created_at).toLocaleTimeString(),
        status: (tx.status || '').toLowerCase().trim() as any,
        queueNumber: tx.queue_number?.toString() || '',
        paymentQrCode: tx.payment_qr_code,
        compatibilityScore: tx.compatibility_score,
      }));

      setReportTransactions(formatted);
    } catch (err) {
      console.error('Failed to fetch report data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();

    // Subscribe to transactions changes
    const channelName = `reports-tx-sync-${reportType}-${selectedStationId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          fetchReportData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reportType, selectedStationId]);

  // Compute stats
  const totalRevenue = reportTransactions.reduce((sum, t) => sum + t.totalPrice, 0);
  const totalLiters = reportTransactions.reduce((sum, t) => sum + t.liters, 0);
  const completedRefuels = reportTransactions.length;

  // Helper format currency IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Report Type', reportType],
      ['Selected Station', selectedStationId],
      ['Total Completed Refuels', completedRefuels.toString()],
      ['Total Volume (L)', totalLiters.toFixed(2)],
      ['Total Revenue', formatIDR(totalRevenue)],
      ['Generated On', new Date().toLocaleString()]
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sfrt_report_${reportType.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans text-text-primary print:bg-white print:text-black animate-fade-in">
      
      {/* Page Header - Hidden on Print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-panel-bg p-5 rounded-2xl border border-border-primary gap-4 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-text-primary">Reports</h2>
            <p className="text-xs text-text-secondary">Generate summaries, audit records, and compile printer-friendly PDF reports.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-panel-bg border border-border-primary hover:border-brand-emerald/30 text-xs font-sans font-medium text-text-primary transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> CSV Export
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-emerald text-white hover:bg-brand-emerald/90 text-xs font-sans font-medium transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Control Filters - Hidden on Print */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden bg-panel-bg p-5 rounded-2xl border border-border-primary shadow-sm">
        <div>
          <label className="block text-xs font-sans text-text-secondary font-semibold uppercase tracking-wider mb-2 pl-1">Report Template</label>
          <select 
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-overlay border border-border-primary text-text-primary text-sm focus:outline-none focus:border-brand-emerald/40 transition-colors font-sans"
          >
            <option value="DAILY">Daily Summary Report</option>
            <option value="WEEKLY">Weekly Throughput Summary</option>
            <option value="MONTHLY">Monthly Operational Ledger</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-sans text-text-secondary font-semibold uppercase tracking-wider mb-2 pl-1">Target Station</label>
          <select 
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-overlay border border-border-primary text-text-primary text-sm focus:outline-none focus:border-brand-emerald/40 transition-colors font-sans"
          >
            <option value="ALL">All Active Stations</option>
            {stations.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end justify-end font-sans text-xs text-text-secondary pb-3">
          Report Range: Today (UTC)
        </div>
      </div>

      {/* Report Paper Layout (Printable) */}
      <div className={`bg-panel-bg border border-border-primary rounded-2xl p-8 print:p-0 print:border-none print:bg-white shadow-sm transition-all duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        
        {/* Paper Header */}
        <div className="flex justify-between items-start border-b border-border-primary pb-6">
          <div className="space-y-1.5">
            <h1 className="font-display font-semibold text-lg text-text-primary print:text-black tracking-wide">
              SFRT Refueling Ecosystem Operations
            </h1>
            <p className="text-xs text-text-secondary font-mono print:text-gray-600">
              Document ID: SFRT-REP-{reportType}-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}
            </p>
          </div>
          <div className="text-right font-sans text-xs text-text-secondary print:text-gray-600 space-y-1">
            <span className="block font-semibold text-text-primary print:text-black uppercase">Classification: Audit Level 4</span>
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-b border-border-primary">
          <div className="p-4 bg-overlay rounded-xl border border-border-primary text-center space-y-1">
            <span className="text-[11px] font-sans text-text-secondary uppercase tracking-wider font-semibold">Refuels Completed</span>
            <span className="text-lg font-bold text-text-primary block font-display">{completedRefuels} Flows</span>
          </div>
          <div className="p-4 bg-overlay rounded-xl border border-border-primary text-center space-y-1">
            <span className="text-[11px] font-sans text-text-secondary uppercase tracking-wider font-semibold">Volume Dispensed</span>
            <span className="text-lg font-bold text-text-primary block font-display">{totalLiters.toFixed(1)} L</span>
          </div>
          <div className="p-4 bg-overlay rounded-xl border border-border-primary text-center space-y-1">
            <span className="text-[11px] font-sans text-text-secondary uppercase tracking-wider font-semibold">Gross Revenue</span>
            <span className="text-lg font-bold text-brand-emerald block font-display">{formatIDR(totalRevenue)}</span>
          </div>
          <div className="p-4 bg-overlay rounded-xl border border-border-primary text-center space-y-1">
            <span className="text-[11px] font-sans text-text-secondary uppercase tracking-wider font-semibold">System Uptime</span>
            <span className="text-lg font-bold text-text-primary block font-display">99.98%</span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="py-8 space-y-4">
          <h3 className="font-display font-semibold text-text-primary text-sm tracking-wide print:text-black">
            STATION OPERATIONAL BREAKDOWN
          </h3>
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-primary text-text-secondary print:text-gray-700">
                <th className="pb-3 font-semibold text-[11px] uppercase tracking-wider">Station ID</th>
                <th className="pb-3 font-semibold text-[11px] uppercase tracking-wider">Station Name</th>
                <th className="pb-3 font-semibold text-[11px] uppercase tracking-wider">Flow Count</th>
                <th className="pb-3 font-semibold text-[11px] uppercase tracking-wider">Total Volume</th>
                <th className="pb-3 font-semibold text-right text-[11px] uppercase tracking-wider">Gross Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary text-text-primary print:text-black">
              {stations
                .filter(s => selectedStationId === 'ALL' || s.id === selectedStationId)
                .map((s) => {
                  const stationTxs = reportTransactions.filter(t => t.stationId === s.id);
                  const sFlows = stationTxs.length;
                  const sVolume = stationTxs.reduce((sum, t) => sum + t.liters, 0);
                  const sRevenue = stationTxs.reduce((sum, t) => sum + t.totalPrice, 0);
                  
                  return (
                    <tr key={s.id} className="py-3">
                      <td className="py-4 font-semibold text-text-secondary">{s.id.split('-')[0]}</td>
                      <td className="py-4 font-medium">{s.name}</td>
                      <td className="py-4 font-medium">{sFlows} Flows</td>
                      <td className="py-4 font-medium">{sVolume.toFixed(1)} L</td>
                      <td className="py-4 text-right font-semibold text-brand-emerald">
                        {formatIDR(sRevenue)}
                      </td>
                    </tr>
                  );
                })}
              {reportTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-text-secondary font-sans text-xs">
                    No completed refueling transactions logged for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures Panel */}
        <div className="pt-16 grid grid-cols-2 gap-8 text-center font-sans text-xs text-text-secondary print:text-gray-800">
          <div className="space-y-12">
            <span className="block border-b border-border-primary pb-1 mx-12"></span>
            <span>SYSTEM AUDITOR</span>
          </div>
          <div className="space-y-12">
            <span className="block border-b border-border-primary pb-1 mx-12"></span>
            <span>OPERATIONAL DIRECTOR</span>
          </div>
        </div>

      </div>

    </div>
  );
}
