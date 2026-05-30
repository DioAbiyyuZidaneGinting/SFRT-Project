/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  CreditCard, 
  Bell, 
  ShieldCheck, 
  Cpu, 
  Smartphone, 
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  Tablet,
  Trash2
} from 'lucide-react';
import GlassCard from '../GlassCard';
import { useTheme } from '../ThemeProvider';
import { useAuthStore } from '../../lib/authStore';
import { useSessionStore } from '../../lib/sessionStore';
import { useTranslation } from '../../hooks/useTranslation';

interface SettingsPageProps {
  userEmail: string;
  onLogout: () => void;
}

export function SettingsPage({
  userEmail,
  onLogout
}: SettingsPageProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuthStore();
  const { sessions, isLoadingSessions, loadSessions, revokeSession } = useSessionStore();
  const { t, language, setLanguage } = useTranslation();

  const [notifyPreferences, setNotifyPreferences] = useState({
    smartGateAlert: true,
    fuelPriceFluctuation: true,
    instantPaymentSummary: true,
    nearbyStationDetect: false,
  });

  useEffect(() => {
    if (user?.id) {
      loadSessions(user.id);
    }
  }, [user?.id]);

  const getDeviceIcon = (deviceName: string, os: string) => {
    const lowOS = os.toLowerCase();
    const lowDev = deviceName.toLowerCase();
    if (lowOS.includes('ios') || lowOS.includes('android') || lowDev.includes('phone') || lowDev.includes('iphone')) {
      return <Smartphone className="w-5 h-5 text-text-secondary" />;
    }
    if (lowDev.includes('ipad') || lowDev.includes('tablet')) {
      return <Tablet className="w-5 h-5 text-text-secondary" />;
    }
    return <Laptop className="w-5 h-5 text-text-secondary" />;
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { 
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
    <div className="flex-grow space-y-6 text-text-primary font-sans" id="settings-page-module">
      
      <div className="flex justify-between items-center border-b border-border-primary/50 pb-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-text-primary">
            {t('settings.title')}
          </h1>
          <p className="text-xs text-text-secondary">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Profile settings, theme, connected devices */}
        <div className="space-y-6">
          {/* Driver Certificate Card */}
          <GlassCard title={t('settings.driverCert')} subtitle={t('settings.driverSubtitle')}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-base font-semibold select-none border border-emerald-500/20">
                {userEmail.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {t('settings.authenticatedDriver')}
                </span>
                <h3 className="font-semibold text-sm text-text-primary">
                  {userEmail.split('@')[0]}
                </h3>
                <p className="text-xs text-text-secondary">{userEmail}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-text-secondary">
              <div className="flex justify-between p-3 rounded-xl bg-overlay border border-border-primary/50">
                <span>{t('settings.accessToken')}</span>
                <span className="text-emerald-600 font-semibold">Active</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-overlay border border-border-primary/50">
                <span>{t('settings.calibrationDate')}</span>
                <span className="text-text-primary font-semibold">
                  {language === 'id' ? 'Hari ini' : 'Today'}, {new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full mt-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-sans font-semibold rounded-xl text-xs transition-all cursor-pointer border border-red-500/10 uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              {t('common.logout')}
            </button>
          </GlassCard>

          {/* Theme Preferences Card */}
          <GlassCard title={t('settings.themePref')} subtitle={t('settings.themeSubtitle')}>
            <div className="flex items-center justify-between p-4 border border-border-primary rounded-xl bg-panel-bg">
              <div className="space-y-0.5">
                <h4 className="font-semibold text-xs text-text-primary">{t('settings.systemTheme')}</h4>
                <span className="text-[10px] text-text-secondary">
                  {language === 'id' ? 'Alihkan mode tampilan terang dan gelap' : 'Toggle between light and dark modes'}
                </span>
              </div>
              
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="px-4 py-2 bg-overlay hover:bg-border-primary/30 border border-border-primary text-text-primary rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    {t('settings.lightMode')}
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-500" />
                    {t('settings.darkMode')}
                  </>
                )}
              </button>
            </div>
          </GlassCard>

          {/* Language Preferences Card */}
          <GlassCard title={t('settings.language')} subtitle={t('settings.languageSubtitle')}>
            <div className="flex items-center justify-between p-4 border border-border-primary rounded-xl bg-panel-bg">
              <div className="space-y-0.5">
                <h4 className="font-semibold text-xs text-text-primary">{t('settings.languageSelect')}</h4>
                <span className="text-[10px] text-text-secondary">
                  {language === 'id' ? 'Pilih bahasa tampilan antarmuka' : 'Choose display interface language'}
                </span>
              </div>
              
              <div className="flex gap-2 bg-overlay p-1 rounded-xl border border-border-primary select-none shrink-0">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'en' 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('id')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'id' 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Indonesia
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Connected Devices / Active Sessions Card */}
          <GlassCard title={t('settings.activeSessions')} subtitle={t('settings.sessionsSubtitle')}>
            <div className={`space-y-3 ${sessions.length > 2 ? 'max-h-[175px] overflow-y-auto pr-1.5 custom-scrollbar' : ''}`}>
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-10 gap-2 text-emerald-600">
                  <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{t('common.loading')}</span>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-10 text-text-secondary">
                  <Smartphone className="w-8 h-8 mx-auto opacity-20 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-wider">No active devices</p>
                </div>
              ) : (
                sessions.map((sess) => (
                  <div key={sess.id} className="flex items-center justify-between p-3 border border-border-primary rounded-xl bg-panel-bg/60 hover:border-brand-emerald/10 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      {getDeviceIcon(sess.deviceName, sess.os)}
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-semibold text-xs text-text-primary truncate">{sess.deviceName}</h4>
                          {sess.isCurrentSession && (
                            <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0">
                              {t('settings.thisDevice')}
                            </span>
                          )}
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sess.isCurrentSession ? 'bg-emerald-500 animate-pulse' : 'bg-text-secondary/40'}`} />
                        </div>
                        <span className="text-[10px] text-text-secondary block truncate">
                          {sess.browser} • {sess.os} • {sess.ipAddress} (Indonesia)
                        </span>
                        <span className="text-[8px] text-text-secondary block mt-0.5 font-medium">
                          Last active: {formatTime(sess.lastActive)}
                        </span>
                      </div>
                    </div>
                    
                    {!sess.isCurrentSession && (
                      <button
                        onClick={async () => {
                          if (confirm(language === 'id' ? `Hapus sesi untuk ${sess.deviceName}? Perangkat ini akan dipaksa keluar.` : `Revoke session for ${sess.deviceName}? This device will be forced to log out.`)) {
                            await revokeSession(sess.sessionId);
                          }
                        }}
                        className="p-1.5 hover:bg-red-500/10 text-text-secondary hover:text-red-500 rounded-lg transition-all cursor-pointer shrink-0"
                        title="Revoke session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Payments settings & notifications */}
        <div className="space-y-6">
          {/* Payment Methods */}
          <GlassCard title={t('settings.paymentInt')} subtitle={t('settings.paymentSubtitle')}>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-border-primary rounded-xl bg-panel-bg hover:border-emerald-500/20 transition-all shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-600 text-xs">
                    QR
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-xs text-text-primary">QRIS Instant Pay</h4>
                    <span className="text-[10px] text-text-secondary">
                      {language === 'id' ? 'Pembayaran cepat, pra-otorisasi instan' : 'Fast checkout, pre-auth scan'}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {language === 'id' ? 'Aktif' : 'Active'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border border-border-primary rounded-xl bg-panel-bg hover:border-emerald-500/20 transition-all shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-900/10 border border-sky-500/20 flex items-center justify-center font-bold text-sky-500 text-xs">
                    DN
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-xs text-text-primary">Dana SpeedPay</h4>
                    <span className="text-[10px] text-text-secondary">
                      {language === 'id' ? 'Penagihan langsung terhubung dengan pompa' : 'Direct billing linked to pump'}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] text-text-secondary bg-overlay px-2 py-0.5 rounded-full font-bold cursor-pointer hover:border-brand-emerald/30 transition-colors uppercase tracking-wider">
                  {language === 'id' ? 'Hubungkan' : 'Connect'}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* System Notifications Toggles */}
          <GlassCard title={t('settings.notifications')} subtitle={t('settings.notificationsSubtitle')}>
            <div className="space-y-5">
              {Object.entries(notifyPreferences).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h5 className="font-semibold text-xs text-text-primary capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}
                    </h5>
                    <p className="text-[10px] text-text-secondary">
                      {language === 'id' ? 'Kirim notifikasi aktivitas ke perangkat dasbor' : 'Push updates to synced dashboard widgets'}
                    </p>
                  </div>
                  
                  {/* Clean switch toggle */}
                  <button
                    onClick={() => {
                      setNotifyPreferences((prev) => ({
                        ...prev,
                        [key]: !prev[key as keyof typeof prev],
                      }));
                    }}
                    className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer outline-none ${
                      value ? 'bg-emerald-500' : 'bg-zinc-600 dark:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                        value ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Account Security Card */}
          <GlassCard title={language === 'id' ? 'Keamanan Akun' : 'Account Security'} subtitle={language === 'id' ? 'Kelola kredensial login' : 'Credentials management'}>
            <div className="p-4 bg-overlay border border-border-primary/50 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-semibold text-text-primary">{language === 'id' ? 'Log Aktivitas Keamanan' : 'Driver Security Log'}</h4>
                  <span className="text-[10px] text-text-secondary">
                    {language === 'id' ? 'Lacak detail sesi dan tautan otorisasi RFID' : 'Track session details and token linkages'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </div>
            </div>
          </GlassCard>
        </div>

      </div>

    </div>
  );
}
