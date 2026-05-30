import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Compass, 
  Fuel, 
  History, 
  User, 
  Sun, 
  Moon, 
  Car, 
  Bell, 
  ChevronDown, 
  Zap,
  ArrowRight,
  CreditCard,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  Menu,
  LogOut,
  HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useTheme } from '../ThemeProvider';
import { useDataStore } from '../../lib/dataStore';
import { useNotificationStore } from '../../lib/notificationStore';
import { useTranslation } from '../../hooks/useTranslation';
import { motion, AnimatePresence } from 'motion/react';
import AIAssistant from '../AIAssistant';


export function CustomerLayout() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { selectedVehicle } = useDataStore();
  const { notifications, asyncMarkAsRead, asyncMarkAllAsRead, isLoadingNotifications } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();

  const currentPath = location.pathname;

  React.useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-500" />;
      case 'vehicle':
        return <Car className="w-3.5 h-3.5 text-orange-500" />;
      case 'refuel':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'security':
        return <ShieldAlert className="w-3.5 h-3.5 text-red-500" />;
      case 'system':
      default:
        return <Sparkles className="w-3.5 h-3.5 text-sky-500" />;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      const isIndo = language === 'id';
      if (diffMins < 1) return isIndo ? 'Baru saja' : 'Just now';
      if (diffMins < 60) return isIndo ? `${diffMins}m yang lalu` : `${diffMins}m ago`;
      if (diffHours < 24) return isIndo ? `${diffHours}j yang lalu` : `${diffHours}h ago`;
      return d.toLocaleDateString(isIndo ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      return language === 'id' ? 'Baru-baru ini' : 'Recent';
    }
  };

  const handleQuickRefillTrigger = () => {
    if (!selectedVehicle) {
      navigate('/vehicle-reg');
    } else {
      navigate('/purchase');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-bg-primary text-text-primary flex flex-row relative transition-colors duration-300">
      
      {/* Background Ambient Glows */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-brand-emerald/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-10 left-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* DESKTOP LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 h-full bg-panel-bg/95 border-r border-border-primary p-6 justify-between select-none shrink-0 overflow-y-auto z-20 backdrop-blur-xl">
        <div className="space-y-8">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-emerald flex items-center justify-center font-display font-bold text-white text-xs shadow-md shadow-brand-emerald/20">
              SR
            </div>
            <div>
              <div className="font-display text-sm font-semibold tracking-wide text-text-primary">
                SFRT
              </div>
              <span className="font-sans text-[8px] font-bold text-text-secondary uppercase tracking-widest block mt-0.5 leading-none">
                Super Fast Refueling Tech
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            {[
              { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
              { name: t('nav.vehicles'), path: '/vehicles', icon: Car },
              { name: t('nav.refuel'), path: '/purchase', icon: Fuel },
              { name: t('nav.analytics'), path: '/history', icon: History },
              { name: t('nav.map'), path: '/stations', icon: Compass },
              { name: t('nav.alerts'), path: '/alerts', icon: Bell },
              { name: language === 'id' ? 'Tanya Jawab (FAQ)' : 'FAQ Support', path: '/faq', icon: HelpCircle },
              { name: t('nav.settings'), path: '/settings', icon: User },
            ].map((item) => {
              const isActive = item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path);
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-brand-emerald/10 text-brand-emerald' 
                      : 'text-text-secondary hover:bg-overlay hover:text-text-primary'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel */}
        <div className="space-y-6">
          {/* Quick Refill Presence card widget */}
          <div className="bg-brand-emerald/5 border border-brand-emerald/10 rounded-2xl p-4.5 space-y-3">
            <span className="text-[9px] font-bold text-brand-emerald uppercase tracking-wider block">
              {t('dashboard.quickRefill') || 'Quick Refill Presence'}
            </span>
            <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
              {t('dashboard.quickRefillSubtitle') || 'At nearest station in one tap.'}
            </p>
            <button
              onClick={handleQuickRefillTrigger}
              className="w-full bg-brand-emerald hover:bg-brand-emerald-dim text-white font-sans font-semibold text-[10px] py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer uppercase tracking-wider"
            >
              <Zap className="w-3.5 h-3.5" />
              {t('dashboard.refillNow') || 'Refill Now'}
            </button>
          </div>

          {/* User Profile */}
          {user && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-overlay border border-border-primary/50">
              <div className="flex items-center gap-2 max-w-[70%]">
                <div className="w-8 h-8 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald text-xs font-semibold select-none shrink-0">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="truncate text-left">
                  <span className="text-text-primary text-xs font-semibold block truncate">{user.fullName}</span>
                  <span className="text-text-secondary text-[8px] block truncate uppercase">ID: {user.fullName.split(' ')[0] || 'DRIVER'}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary shrink-0 animate-pulse" />
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT SIDE MAIN CONTAINER */}
      <div className="flex-grow flex-1 h-full flex flex-col overflow-hidden z-10 relative">
        
        {/* TOP HEADER */}
        <header className="bg-panel-bg backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between shrink-0 select-none shadow-sm transition-colors duration-300 z-30 relative">
          
          {/* Left identity (Mobile only) */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald flex items-center justify-center font-display font-bold text-white text-xs shadow-sm">
              SR
            </div>
            <div className="text-left">
              <div className="font-display text-sm font-semibold text-text-primary leading-none">
                SFRT
              </div>
              <span className="font-sans text-[8px] text-text-secondary block mt-0.5 leading-none">
                Intelligent Mobility
              </span>
            </div>
          </div>

          {/* System Operation Status Dropdown / Online (Desktop only) */}
          <div className="hidden lg:flex items-center gap-2 bg-panel-bg border border-border-primary rounded-xl px-3 py-1.5 shadow-xs">
            <span className="w-2 h-2 bg-brand-emerald rounded-full animate-pulse" />
            <div className="text-left leading-tight pr-2">
              <span className="text-[8px] text-text-secondary block uppercase font-bold tracking-wider leading-none">{t('common.systemOperation') || 'System Operation'}</span>
              <span className="text-xs text-text-primary font-bold">{t('common.online') || 'Online'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary cursor-pointer" />
          </div>

          {/* Controls: Theme Toggle & Notification Badge & User Profile */}
          <div className="flex items-center gap-3.5 font-sans text-sm ml-auto">
            {/* Theme Toggle */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-border-primary/30 hover:bg-border-primary/50 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Badge & Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-border-primary/30 hover:bg-border-primary/50 text-text-secondary hover:text-text-primary transition-all cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-emerald text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-bg-primary">
                    {unreadCount}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <>
                  {/* Backdrop overlay to close dropdown */}
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-panel-bg/95 border border-border-primary rounded-2xl shadow-xl backdrop-blur-xl z-50 p-4 space-y-3 font-sans">
                    <div className="flex items-center justify-between border-b border-border-primary/50 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-brand-emerald" />
                        {t('alerts.title')}
                      </span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => {
                            if (user?.id) asyncMarkAllAsRead(user.id);
                          }}
                          className="text-[10px] text-brand-emerald hover:text-brand-emerald-dim font-bold uppercase tracking-wider cursor-pointer bg-transparent border-0"
                        >
                          {t('alerts.markAllRead')}
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                      {isLoadingNotifications ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-brand-emerald">
                          <span className="w-3 h-3 border-2 border-brand-emerald border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider">{t('common.loading')}</span>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-text-secondary">
                          <Bell className="w-8 h-8 mx-auto opacity-20 mb-2" />
                          <p className="text-[10px] font-bold uppercase tracking-wider">{t('alerts.allCaughtUp') || 'All caught up!'}</p>
                          <p className="text-[9px] mt-0.5">{t('alerts.empty')}</p>
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={async () => {
                              await asyncMarkAsRead(notif.id);
                              setDropdownOpen(false);
                              if (notif.actionUrl) navigate(notif.actionUrl);
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 text-left items-start ${
                              notif.isRead 
                                ? 'bg-overlay/40 border-border-primary/30' 
                                : 'bg-brand-emerald/5 border-brand-emerald/20 hover:bg-brand-emerald/10'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {getCategoryIcon(notif.category)}
                            </div>
                            <div className="flex-grow space-y-0.5 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-text-primary truncate block pr-2">
                                  {notif.title}
                                </span>
                                <span className="text-[8px] text-text-secondary shrink-0 font-medium mt-0.5">
                                  {formatTimestamp(notif.createdAt)}
                                </span>
                              </div>
                              <p className="text-[10px] text-text-secondary line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t border-border-primary/50 pt-2 text-center">
                      <button 
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/alerts');
                        }}
                        className="w-full py-1.5 bg-overlay hover:bg-overlay/80 border border-border-primary text-text-primary text-[10px] font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1"
                      >
                        {t('alerts.viewAll') || 'View All Notifications'}
                        <ChevronRight className="w-3.5 h-3.5 text-brand-emerald" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Mobile User Profile */}
            {user && (
              <div className="flex lg:hidden items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald text-sm font-semibold select-none">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* MAIN CONTENT AREA - pb configured dynamically to prevent overlap on mobile */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-8 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <Outlet />
        </main>

        {/* FLOATING PILL DOCK NAVIGATION (Mobile/Tablet only) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md bg-panel-bg/90 border border-border-primary/75 backdrop-blur-xl rounded-full px-2 py-1.5 shadow-[0_15px_35px_rgba(0,0,0,0.35)] select-none lg:hidden font-sans transition-all duration-300">
          <div className="flex items-center justify-between relative h-12">
            
            {/* 1. Home */}
            <button
              onClick={() => navigate('/')}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-full transition-all flex-1 cursor-pointer hover:scale-105 active:scale-95 ${
                currentPath === '/' 
                  ? 'text-brand-emerald font-semibold' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span className="text-[8px] uppercase tracking-wider font-bold">{t('nav.dashboard')}</span>
            </button>

            {/* 2. Vehicles */}
            <button
              onClick={() => navigate('/vehicles')}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-full transition-all flex-1 cursor-pointer hover:scale-105 active:scale-95 ${
                currentPath.startsWith('/vehicles') 
                  ? 'text-brand-emerald font-semibold' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Car className="w-4.5 h-4.5" />
              <span className="text-[8px] uppercase tracking-wider font-bold">{language === 'id' ? 'Armada' : 'Vehicles'}</span>
            </button>

            {/* 3. Refuel (Center Elevated Circle Button) */}
            <div className="relative flex-1 flex flex-col items-center justify-center h-full">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                {/* Masking Outer Ring matching theme */}
                <div className="w-[66px] h-[66px] rounded-full bg-panel-bg border border-border-primary/75 shadow-md -translate-y-4" />
              </div>
              
              <button
                onClick={() => navigate('/purchase')}
                className={`relative z-10 w-13 h-13 rounded-full bg-brand-emerald text-white flex items-center justify-center shadow-lg shadow-brand-emerald/25 hover:bg-brand-emerald-dim hover:scale-105 active:scale-95 transition-all cursor-pointer -translate-y-4 ${
                  currentPath.startsWith('/purchase') ? 'ring-2 ring-brand-emerald ring-offset-2 ring-offset-bg-primary' : ''
                }`}
              >
                <Fuel className="w-5.5 h-5.5" />
              </button>
              
              {/* Center Label */}
              <span className="absolute bottom-[-2px] text-[8px] uppercase tracking-wider font-bold text-text-secondary z-20">
                {t('nav.refuel')}
              </span>
            </div>

            {/* 4. More */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-full transition-all flex-1 cursor-pointer hover:scale-105 active:scale-95 ${
                isMobileDrawerOpen 
                  ? 'text-brand-emerald font-semibold animate-pulse' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Menu className="w-4.5 h-4.5" />
              <span className="text-[8px] uppercase tracking-wider font-bold">{language === 'id' ? 'Menu' : 'More'}</span>
            </button>

          </div>
        </div>

        {/* MOBILE SLIDE-UP DRAWER SHEET */}
        <AnimatePresence>
          {isMobileDrawerOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-sm"
              />

              {/* Drawer Sheet Container */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-panel-bg border-t border-border-primary rounded-t-3xl max-h-[85vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 px-6 lg:hidden font-sans flex flex-col gap-6 shadow-2xl transition-colors duration-300"
              >
                {/* Drag / Close Handle indicator */}
                <div 
                  className="w-12 h-1.5 bg-border-primary/80 rounded-full mx-auto mb-2 shrink-0 cursor-pointer" 
                  onClick={() => setIsMobileDrawerOpen(false)} 
                />

                {/* Profile credentials */}
                {user && (
                  <div className="flex items-center gap-4 border-b border-border-primary/50 pb-4 text-left">
                    <div className="w-12 h-12 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald text-base font-semibold select-none shrink-0">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate text-left">
                      <span className="text-text-primary text-sm font-semibold block truncate">{user.fullName}</span>
                      <span className="text-text-secondary text-[10px] block truncate uppercase">ID: {user.fullName.split(' ')[0] || 'DRIVER'}</span>
                      <span className="text-text-secondary text-[10px] block truncate mt-0.5">{user.email}</span>
                    </div>
                  </div>
                )}

                {/* Drawer Menu Items */}
                <nav className="flex flex-col gap-2 text-left">
                  {[
                    { name: t('nav.analytics'), path: '/history', icon: History },
                    { name: t('nav.map'), path: '/stations', icon: Compass },
                    { name: t('nav.alerts'), path: '/alerts', icon: Bell, badge: unreadCount },
                    { name: language === 'id' ? 'Tanya Jawab (FAQ)' : 'FAQ Support', path: '/faq', icon: HelpCircle },
                    { name: t('nav.settings'), path: '/settings', icon: User },
                  ].map((item) => {
                    const isActive = item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path);
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          navigate(item.path);
                          setIsMobileDrawerOpen(false);
                        }}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-sans text-sm font-semibold tracking-wide transition-all cursor-pointer text-left ${
                          isActive 
                            ? 'bg-brand-emerald/10 text-brand-emerald' 
                            : 'text-text-secondary hover:bg-overlay hover:text-text-primary'
                        }`}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="flex-grow">{item.name}</span>
                        {item.badge && item.badge > 0 ? (
                          <span className="px-2 py-0.5 bg-brand-emerald text-white text-[9px] font-bold rounded-full">
                            {item.badge}
                          </span>
                        ) : null}
                        <ChevronRight className="w-4 h-4 ml-auto text-text-secondary/50 shrink-0" />
                      </button>
                    );
                  })}
                </nav>

                {/* Sign Out Trigger */}
                <div className="border-t border-border-primary/50 pt-4 mt-2">
                  <button
                    onClick={async () => {
                      setIsMobileDrawerOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-sans font-semibold rounded-xl text-sm transition-all cursor-pointer border border-red-500/10 uppercase tracking-wider"
                  >
                    <LogOut className="w-4 h-4" />
                    {language === 'id' ? 'Keluar' : 'Sign out'}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>

      {/* Floating AI Assistant Widget */}
      <AIAssistant />

    </div>
  );
}
