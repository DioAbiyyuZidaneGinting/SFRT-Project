import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../../lib/adminStore';
import { User, Search, UserCheck, Shield, Award, Mail, Phone, Calendar, Car, RefreshCw } from 'lucide-react';
import GlassCard from '../../GlassCard';

export function AdminUsers() {
  const { users, changeUserRole, loadUsers, isLoading } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = (users || []).filter(u => 
    (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.vehicles?.some(v => (v.plateNumber || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRoleChange = async (userId: string, newRole: any) => {
    await changeUserRole(userId, newRole);
  };

  return (
    <div className="space-y-6 font-sans text-text-primary animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-panel-bg p-5 rounded-2xl border border-border-primary gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-text-primary">Users Directory</h2>
            <p className="text-xs text-text-secondary">Explore user directory profiles, audit vehicles ownership, and modify role levels.</p>
          </div>
        </div>
        <div>
          <button 
            onClick={loadUsers}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-panel-bg border border-border-primary hover:border-brand-emerald/30 text-xs font-sans font-medium text-text-primary transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Sync Users
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-text-secondary" />
        <input 
          type="text" 
          placeholder="Search Users by Name, Email, or Vehicle Plate..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-panel-bg border border-border-primary text-text-primary text-xs focus:outline-none focus:border-brand-emerald/40 transition-colors font-sans shadow-xs"
        />
      </div>

      {/* Users Card List */}
      {isLoading && users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-emerald">
          <span className="w-8 h-8 border-4 border-brand-emerald border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Syncing database users...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredUsers.map(u => (
            <div key={u.id}>
              <GlassCard className="p-5 border border-border-primary space-y-4 flex flex-col justify-between shadow-sm h-full">
                <div className="space-y-4">
                  
                  {/* Header profile info */}
                  <div className="flex items-start justify-between border-b border-border-primary/50 pb-3">
                    <div className="space-y-1 min-w-0">
                      <span className="font-sans font-bold text-text-primary text-sm block truncate">
                        {u.fullName || 'No Name Set'}
                      </span>
                      <div className="flex flex-col gap-1 text-[11px] text-text-secondary font-sans mt-0.5">
                        <span className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-text-secondary" /> {u.email}</span>
                        {u.phoneNumber && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-text-secondary" /> {u.phoneNumber}</span>}
                      </div>
                    </div>
                    
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold uppercase tracking-wider shrink-0 ${
                      u.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      u.role === 'operator' ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20' :
                      'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
                    }`}>
                      {u.role}
                    </span>
                  </div>

                  {/* Owned Vehicles */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-sans text-text-secondary uppercase tracking-wider font-bold block">Registered Vehicles</span>
                    {u.vehicles && u.vehicles.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                        {u.vehicles.map(v => (
                          <div key={v.id} className="flex justify-between items-center bg-overlay p-3 rounded-xl border border-border-primary font-sans text-xs">
                            <div className="flex items-center gap-2 text-text-primary min-w-0">
                              <Car className="w-4 h-4 text-brand-emerald shrink-0" />
                              <span className="font-bold shrink-0">{v.plateNumber}</span>
                              <span className="text-text-secondary text-[11px] truncate">({v.brand} {v.model})</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold shrink-0 ${
                              v.isVerified ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            }`}>
                              {v.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-text-secondary font-sans bg-overlay p-3 rounded-xl border border-border-primary border-dashed text-center">
                        No registered vehicles.
                      </div>
                    )}
                  </div>

                </div>

                {/* Role Modifier Dropdown */}
                <div className="flex items-center justify-between pt-4 border-t border-border-primary/50 mt-4">
                  <span className="text-[10px] font-sans text-text-secondary uppercase tracking-wider font-bold">Access Level</span>
                  <select 
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-sans font-medium rounded-xl bg-panel-bg border border-border-primary text-text-primary focus:outline-none focus:border-brand-emerald/40 transition-colors cursor-pointer"
                  >
                    <option value="customer">Customer</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

              </GlassCard>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="col-span-2 py-20 text-center text-text-secondary font-sans text-sm border border-dashed border-border-primary rounded-2xl bg-panel-bg">
              No users registered or matching search query.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
