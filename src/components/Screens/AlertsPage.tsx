/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  ShieldAlert, 
  CreditCard, 
  MapPin, 
  CheckCircle,
  Filter,
  Sparkles,
  Info,
  Car,
  Zap,
  ChevronRight
} from 'lucide-react';
import GlassCard from '../GlassCard';
import { useAuthStore } from '../../lib/authStore';
import { useNotificationStore } from '../../lib/notificationStore';
import { useTranslation } from '../../hooks/useTranslation';

export function AlertsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    notifications, 
    isLoadingNotifications, 
    asyncMarkAsRead, 
    asyncMarkAllAsRead 
  } = useNotificationStore();
  const { t, language } = useTranslation();

  const [filterCategory, setFilterCategory] = useState<'all' | 'payment' | 'vehicle' | 'refuel' | 'security' | 'system'>('all');

  const filteredNotifications = notifications.filter(
    (n) => filterCategory === 'all' || n.category === filterCategory
  );

  const handleMarkAllRead = () => {
    if (user?.id) {
      asyncMarkAllAsRead(user.id);
    }
  };

  const handleNotificationClick = async (id: string, actionUrl?: string) => {
    await asyncMarkAsRead(id);
    if (actionUrl) {
      navigate(actionUrl);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'vehicle':
        return <Car className="w-4 h-4 text-orange-500" />;
      case 'refuel':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'system':
      default:
        return <Sparkles className="w-4 h-4 text-sky-500" />;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return language === 'id' ? 'Baru saja' : 'Just now';
      if (diffMins < 60) return language === 'id' ? `${diffMins}m lalu` : `${diffMins}m ago`;
      if (diffHours < 24) return language === 'id' ? `${diffHours}j lalu` : `${diffHours}h ago`;
      return d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="flex-grow space-y-6 text-text-primary font-sans" id="alerts-page-module">
      
      <div className="flex justify-between items-center border-b border-border-primary/50 pb-4 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-text-primary">
            {t('alerts.title')}
          </h1>
          <p className="text-xs text-text-secondary">
            {t('alerts.subtitle')}
          </p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 bg-overlay border border-border-primary hover:border-emerald-500/30 text-text-primary text-[10px] font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            {t('alerts.markAllRead')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Filter Sidebar & Timeline (Col 1 to 4) */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard title={language === 'id' ? 'Kategori Notifikasi' : 'Alert Categories'} subtitle={language === 'id' ? 'Saring lini masa log' : 'Filter notification timeline'}>
            <div className="space-y-1.5">
              {[
                { id: 'all', label: t('alerts.categories.all'), count: notifications.length },
                { id: 'payment', label: t('alerts.categories.payment'), count: notifications.filter(a => a.category === 'payment').length },
                { id: 'vehicle', label: t('alerts.categories.all') === 'All Alerts' ? 'Fleet & Registration' : 'Armada & Registrasi', count: notifications.filter(a => a.category === 'vehicle').length },
                { id: 'refuel', label: t('alerts.categories.all') === 'All Alerts' ? 'Refuel & Charging' : 'Pengisian & Daya', count: notifications.filter(a => a.category === 'refuel').length },
                { id: 'security', label: t('alerts.categories.security'), count: notifications.filter(a => a.category === 'security').length },
                { id: 'system', label: t('alerts.categories.diagnostic'), count: notifications.filter(a => a.category === 'system').length }
              ].map((cat) => {
                const isActive = filterCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.id as any)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-500/10 text-emerald-600' 
                        : 'text-text-secondary hover:bg-overlay hover:text-text-primary'
                    }`}
                  >
                    <span className="text-left">{cat.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-border-primary/40 text-text-primary font-bold">
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard title={language === 'id' ? 'Mode Siaran' : 'Broadcast Mode'} subtitle={language === 'id' ? 'Transmisi gerbang gerak' : 'System transmission'}>
            <div className="space-y-3 text-xs text-text-secondary leading-relaxed font-medium">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-overlay border border-border-primary/50 text-left">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  {language === 'id' 
                    ? 'Pengumuman suara disiarkan secara otomatis saat memasuki antrean pengisian bahan bakar yang telah diotorisasi sebelumnya.' 
                    : 'Voice announcements are broadcast automatically when entering pre-authorized refueling queues.'}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Interactive Alert List (Col 5 to 12) */}
        <div className="lg:col-span-8">
          <GlassCard title={language === 'id' ? 'Log Aktivitas Sistem' : 'System Activity Log'} subtitle={`${filteredNotifications.length} logged events`}>
            {isLoadingNotifications ? (
              <div className="flex items-center justify-center py-20 gap-2 text-emerald-600">
                <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold uppercase tracking-wider">{t('common.loading')}</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-20 space-y-2 text-text-secondary">
                <Bell className="w-10 h-10 mx-auto opacity-30 mb-2" />
                <p className="text-xs font-bold">{t('alerts.empty')}</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-primary">
                {filteredNotifications.map((notif) => (
                  <div key={notif.id} className="relative flex flex-col gap-2">
                    {/* Timeline connector circle node */}
                    <div className={`absolute -left-[28px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-bg-primary ${
                      notif.isRead ? 'border-border-primary text-text-secondary' : 'border-emerald-500 text-emerald-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${notif.isRead ? 'bg-zinc-600' : 'bg-emerald-500 animate-pulse'}`} />
                    </div>

                    <div 
                      onClick={() => handleNotificationClick(notif.id, notif.actionUrl)}
                      className={`p-4 border rounded-2xl bg-panel-bg/60 backdrop-blur-md transition-all shadow-xs cursor-pointer group hover:bg-panel-bg/80 text-left ${
                        notif.isRead ? 'border-border-primary/50' : 'border-emerald-500/20 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(notif.category)}
                          <h4 className="font-semibold text-xs text-text-primary">
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <span className="text-[9px] text-text-secondary font-medium shrink-0">
                          {formatTimestamp(notif.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center gap-2 mt-2">
                        <p className="text-[11px] text-text-secondary leading-relaxed pl-6 font-medium">
                          {notif.message}
                        </p>
                        {notif.actionUrl && (
                          <ChevronRight className="w-4 h-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

      </div>

    </div>
  );
}
