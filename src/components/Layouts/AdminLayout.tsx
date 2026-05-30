import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ShieldCheck, Activity, Users, Settings, LogOut, Menu, X, Sun, Moon, Database, Route, Server, LineChart, FileText, User } from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useTheme } from '../ThemeProvider';
import { useAdminStore } from '../../lib/adminStore';

export function AdminLayout() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { 
    loadAllData, 
    startSubscriptions, 
    stopSubscriptions, 
    startSimulation, 
    stopSimulation,
    connectionState
  } = useAdminStore();

  // Guard checks
  const isAdmin = user && (user.role === 'admin' || user.role === 'operator');

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
      startSubscriptions();
      startSimulation();
    }
    return () => {
      stopSubscriptions();
      stopSimulation();
    };
  }, [isAdmin]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: Activity },
    { name: 'Transactions', path: '/admin/transactions', icon: Database },
    { name: 'Queue & Flow', path: '/admin/queue', icon: Route },
    { name: 'Stations', path: '/admin/stations', icon: ShieldCheck },
    { name: 'Devices', path: '/admin/devices', icon: Server },
    { name: 'Analytics', path: '/admin/analytics', icon: LineChart },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Users', path: '/admin/users', icon: User },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-bg-primary text-text-primary flex flex-col md:flex-row transition-colors duration-300">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-panel-bg border-b border-border z-50 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-brand-emerald" />
          <span className="font-display font-semibold text-text-primary text-sm">SFRT Enterprise</span>
          <span className={`font-sans text-[10px] font-medium ml-2 ${
            connectionState === 'connected' ? 'text-brand-emerald' : 'text-amber-500'
          }`}>
            ● {connectionState}
          </span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-text-secondary">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* SIDEBAR (Desktop persistent, Mobile toggleable) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-panel-bg border-r border-border-primary transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:overflow-y-auto md:translate-x-0 shrink-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col pt-16 md:pt-0">
          {/* Brand identity (Desktop only) */}
          <div className="hidden md:flex items-center gap-3 p-6 border-b border-border-primary shrink-0">
            <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-brand-emerald" />
            </div>
            <div>
              <span className="font-display font-bold text-text-primary block">SFRT Console</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-sans text-[11px] text-text-secondary">Enterprise</span>
                <span className={`font-sans text-[10px] font-medium ${
                  connectionState === 'connected' ? 'text-brand-emerald' :
                  connectionState === 'reconnecting' ? 'text-amber-500' : 'text-red-500'
                }`}>
                  ● {connectionState}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans text-sm transition-colors ${
                  currentPath === item.path 
                    ? 'bg-brand-emerald/10 text-brand-emerald font-semibold' 
                    : 'text-text-secondary hover:bg-overlay hover:text-text-primary'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </button>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-border-primary space-y-4 shrink-0">
            <div className="flex items-center justify-between px-2">
              <span className="font-sans text-xs text-text-secondary font-medium">Theme</span>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-border-primary/30 hover:bg-border-primary/50 text-text-secondary hover:text-text-primary transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MAIN ADMIN CONTENT */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto md:h-full bg-bg-primary custom-scrollbar">
        <Outlet />
      </main>

    </div>
  );
}
