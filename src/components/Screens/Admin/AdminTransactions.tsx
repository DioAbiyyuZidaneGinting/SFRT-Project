import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../../lib/adminStore';
import { 
  Database, Search, Filter, ArrowLeft, ArrowRight, Download, Eye, FileText, Calendar, Clock, User, Car, CheckCircle2, AlertOctagon, X 
} from 'lucide-react';
import GlassCard from '../../GlassCard';
import { Transaction } from '../../../types';

export function AdminTransactions() {
  const { loadTransactions, transactions, totalTransactions } = useAdminStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(totalTransactions / pageSize));

  // Reload transactions on filter/page/search changes
  useEffect(() => {
    loadTransactions(currentPage, pageSize, statusFilter, searchQuery);
  }, [currentPage, statusFilter, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset page on search
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset page on filter
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Transaction ID', 'User ID', 'Station Name', 'Plate Number', 'Fuel Type', 'Liters', 'Price Per Liter', 'Total Price', 'Payment Method', 'Status', 'Date', 'Time'];
    const rows = transactions.map(tx => [
      tx.id, tx.userId, tx.stationName, tx.plateNumber, tx.fuelTypeName, tx.liters, tx.pricePerLiter, tx.totalPrice, tx.paymentMethod, tx.status, tx.date, tx.time
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sfrt_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print layout (simulate PDF print)
  const handlePrintPDF = () => {
    window.print();
  };

  // Helper format currency IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6 font-sans text-text-primary animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-panel-bg p-5 rounded-2xl border border-border-primary gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-text-primary">Transactions</h2>
            <p className="text-xs text-text-secondary">Explore, audit, and export real-time refueling ledger records.</p>
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
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-panel-bg border border-border-primary hover:border-brand-emerald/30 text-xs font-sans font-medium text-text-primary transition-all cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search Plate, Fuel, or Station..." 
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-panel-bg border border-border-primary text-text-primary text-xs focus:outline-none focus:border-brand-emerald/40 transition-colors font-sans shadow-xs"
          />
        </div>
        <div>
          <select 
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="w-full px-4 py-2.5 rounded-xl bg-panel-bg border border-border-primary text-text-primary text-xs focus:outline-none focus:border-brand-emerald/40 transition-colors font-sans shadow-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paying">Paying</option>
            <option value="queued">Queued</option>
            <option value="refueling">Refueling</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex items-center justify-end font-sans text-xs text-text-secondary pr-2">
          {totalTransactions} records found
        </div>
      </div>

      {/* Main Ledger Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Ledger Table Panel */}
        <GlassCard className="xl:col-span-2 p-5 border border-border-primary flex flex-col min-h-[480px] shadow-sm">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-primary text-text-secondary">
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">Plate No</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">Station</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">Fuel</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">Vol (L)</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">Total Price</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary text-text-primary">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-secondary">
                      No transactions match your search filters.
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-overlay/40 transition-colors">
                      <td className="py-4 font-semibold text-text-primary">{tx.plateNumber}</td>
                      <td className="py-4 truncate max-w-[120px] font-medium" title={tx.stationName}>{tx.stationName}</td>
                      <td className="py-4 font-medium text-text-secondary">{tx.fuelTypeName}</td>
                      <td className="py-4 font-medium text-text-secondary">{tx.liters.toFixed(1)} L</td>
                      <td className="py-4 font-semibold text-text-primary">{formatIDR(tx.totalPrice)}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          tx.status === 'completed' ? 'bg-brand-emerald/10 text-brand-emerald' :
                          tx.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                          tx.status === 'refueling' ? 'bg-sky-500/10 text-sky-500 animate-pulse' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => setSelectedTx(tx)}
                          className="p-1.5 rounded-lg bg-panel-bg border border-border-primary hover:border-brand-emerald/30 hover:text-brand-emerald transition-all cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-border-primary mt-4 shrink-0 text-xs">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border-primary disabled:opacity-40 disabled:hover:border-border-primary hover:border-brand-emerald/30 transition-all cursor-pointer font-medium bg-panel-bg shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-text-secondary font-medium">Page {currentPage} of {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border-primary disabled:opacity-40 disabled:hover:border-border-primary hover:border-brand-emerald/30 transition-all cursor-pointer font-medium bg-panel-bg shadow-xs"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>

        {/* Audit Details Panel (Drawer replacement on right) */}
        <GlassCard className="p-5 border border-border-primary shadow-sm">
          <h3 className="font-display font-semibold text-text-primary text-sm uppercase tracking-wider mb-4 border-b border-border-primary pb-3">
            Audit Details
          </h3>
          
          {selectedTx ? (
            <div className="space-y-6 text-sm">
              
              {/* Receipt Style header */}
              <div className="bg-overlay p-4 rounded-xl border border-border-primary text-center space-y-1.5 relative overflow-hidden shadow-xs">
                <span className="font-sans text-[10px] text-text-secondary block font-semibold">RECEIPT VERIFICATION</span>
                <span className="font-mono text-xs font-semibold text-text-primary block tracking-wider truncate px-2">
                  #{selectedTx.id}
                </span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold capitalize ${
                  selectedTx.status === 'completed' ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {selectedTx.status}
                </span>
              </div>

              {/* Data Items */}
              <div className="space-y-3 text-xs text-text-secondary">
                <div className="flex justify-between border-b border-border-primary pb-2">
                  <span>User ID</span>
                  <span className="text-text-primary font-semibold truncate max-w-[150px]">{selectedTx.userId}</span>
                </div>
                <div className="flex justify-between border-b border-border-primary pb-2">
                  <span>Station</span>
                  <span className="text-text-primary font-semibold">{selectedTx.stationName}</span>
                </div>
                <div className="flex justify-between border-b border-border-primary pb-2">
                  <span>Vehicle Plate</span>
                  <span className="text-text-primary font-semibold">{selectedTx.plateNumber}</span>
                </div>
                <div className="flex justify-between border-b border-border-primary pb-2">
                  <span>Fuel Type</span>
                  <span className="text-text-primary font-semibold">{selectedTx.fuelTypeName}</span>
                </div>
                <div className="flex justify-between border-b border-border-primary pb-2">
                  <span>Volume</span>
                  <span className="text-text-primary font-bold">{selectedTx.liters.toFixed(2)} L</span>
                </div>
                <div className="flex justify-between border-b border-border-primary pb-2">
                  <span>Price / Liter</span>
                  <span className="text-text-primary font-semibold">{formatIDR(selectedTx.pricePerLiter)}</span>
                </div>
                <div className="flex justify-between border-b border-border-primary pb-2">
                  <span>Total Paid</span>
                  <span className="text-brand-emerald font-bold">{formatIDR(selectedTx.totalPrice)}</span>
                </div>
                <div className="flex justify-between border-b border-border-primary pb-2">
                  <span>Payment Method</span>
                  <span className="text-text-primary font-semibold uppercase">{selectedTx.paymentMethod}</span>
                </div>
                <div className="flex justify-between border-b border-border-primary pb-2">
                  <span>Date & Time</span>
                  <span className="text-text-primary font-semibold">{selectedTx.date} {selectedTx.time}</span>
                </div>
                <div className="flex justify-between border-b border-border-primary pb-2">
                  <span>Compatibility Score</span>
                  <span className={`font-bold ${
                    selectedTx.compatibilityScore >= 90 ? 'text-brand-emerald' : 'text-amber-500'
                  }`}>{selectedTx.compatibilityScore}%</span>
                </div>
              </div>

              {/* Action Buttons inside Drawer */}
              <div className="pt-2 flex gap-2">
                <button 
                  onClick={() => setIsReceiptOpen(true)}
                  className="flex-1 py-2.5 text-center rounded-xl border border-border-primary hover:border-brand-emerald/30 text-xs font-sans font-medium text-text-primary hover:text-brand-emerald transition-all cursor-pointer bg-panel-bg shadow-xs"
                >
                  View Digital Receipt
                </button>
              </div>

            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-text-secondary font-sans text-xs text-center">
              Select a transaction record to audit details.
            </div>
          )}
        </GlassCard>
      </div>

      {/* Digital Receipt Overlay Modal */}
      {isReceiptOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <GlassCard className="w-full max-w-md p-6 border border-border-primary space-y-6 relative shadow-2xl">
            <button 
              onClick={() => setIsReceiptOpen(false)}
              className="absolute right-4 top-4 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-1.5">
              <h3 className="font-display font-semibold text-lg text-text-primary">Refueling Receipt</h3>
              <p className="text-xs text-text-secondary font-medium">SFRT Smart Station Network</p>
            </div>
            
            <div className="border-t border-b border-dashed border-border-primary py-4 space-y-2.5 font-sans text-xs text-text-secondary">
              <div className="flex justify-between">
                <span>Station:</span>
                <span className="font-semibold text-text-primary">{selectedTx.stationName}</span>
              </div>
              <div className="flex justify-between">
                <span>Vehicle:</span>
                <span className="font-semibold text-text-primary">{selectedTx.plateNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Fuel Type:</span>
                <span className="font-semibold text-text-primary">{selectedTx.fuelTypeName}</span>
              </div>
              <div className="flex justify-between">
                <span>Volume:</span>
                <span className="font-semibold text-text-primary">{selectedTx.liters.toFixed(2)} Liters</span>
              </div>
              <div className="flex justify-between">
                <span>Rate:</span>
                <span className="text-text-primary">{formatIDR(selectedTx.pricePerLiter)}/L</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-border-primary pt-2.5 text-sm text-text-primary font-semibold">
                <span>Total Paid:</span>
                <span className="font-bold text-brand-emerald">{formatIDR(selectedTx.totalPrice)}</span>
              </div>
            </div>

            <div className="bg-overlay p-4 rounded-xl text-center font-sans text-xs text-text-secondary border border-border-primary shadow-xs">
              Transaction verified and secured via RFID gate link.
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
