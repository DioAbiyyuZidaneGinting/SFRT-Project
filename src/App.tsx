import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';

// Layouts & Protection
import { CustomerLayout } from './components/Layouts/CustomerLayout';
import { AdminLayout } from './components/Layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Store
import { useAuthStore } from './lib/authStore';
import { useDataStore } from './lib/dataStore';
import { useNotificationStore } from './lib/notificationStore';
import { useSessionStore } from './lib/sessionStore';
import { notificationService } from './services/notificationService';
import { voiceService } from './services/voiceService';
import { supabase } from './lib/supabase';

// Screens
import { SplashScreen, AuthPages } from './components/Screens/AuthAndLobby';
import { AuthCallback } from './components/Screens/AuthCallback';
import { ResetPasswordPage } from './components/Screens/ResetPassword';
import { NearbyStationPage, VehicleRegistrationPage, TransactionHistoryPage } from './components/Screens/NavigationAndFleet';
import { FuelPurchasePage, PaymentPage } from './components/Screens/FuelAndPayment';
import { VehiclesPage } from './components/Screens/VehiclesPage';
import { AlertsPage } from './components/Screens/AlertsPage';
import { SettingsPage } from './components/Screens/SettingsPage';
import { FAQPage } from './components/Screens/FAQPage';
import {
  QueueSystemPage,
  QRVerificationPage,
  SmartBarrierGatePage,
  RefuelingProcessPage,
  DigitalReceiptPage,
} from './components/Screens/RefuelingRefinery';
import { HomeDashboard } from './components/Screens/HomeDashboard';
import { LandingPage } from './components/Screens/LandingPage';
import { AdminDashboard } from './components/Screens/AdminDashboard';
import { AdminTransactions } from './components/Screens/Admin/AdminTransactions';
import { AdminQueueFlow } from './components/Screens/Admin/AdminQueueFlow';
import { AdminStations } from './components/Screens/Admin/AdminStations';
import { AdminDevices } from './components/Screens/Admin/AdminDevices';
import { AdminAnalytics } from './components/Screens/Admin/AdminAnalytics';
import { AdminReports } from './components/Screens/Admin/AdminReports';
import { AdminUsers } from './components/Screens/Admin/AdminUsers';
import { AdminSettings } from './components/Screens/Admin/AdminSettings';

// Wrapper for Auth Redirect logic
function AuthWrapper() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin' || user.role === 'operator') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return <AuthPages onSuccess={() => {}} />;
}

// Wrapper for Home Dashboard to inject props from Zustand
function HomeWrapper() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { 
    stations, 
    selectedVehicle, 
    activeTransaction, 
    fuels,
    setSelectedStation 
  } = useDataStore();

  const handleQuickRefillTrigger = () => {
    if (!selectedVehicle) {
      navigate('/vehicle-reg');
    } else {
      navigate('/purchase');
    }
  };

  return (
    <HomeDashboard
      userEmail={user?.email || 'tesla-owner@sfrt.io'}
      stations={stations}
      mountedVehicle={selectedVehicle}
      activeTransaction={activeTransaction}
      fuels={fuels}
      onTriggerQuickRefill={handleQuickRefillTrigger}
      onNavigateToScreen={(screen) => navigate(`/${screen}`)}
      onSelectStation={setSelectedStation}
    />
  );
}

// Wrapper for Purchase flow
function PurchaseWrapper() {
  const navigate = useNavigate();
  const { 
    fuels, 
    isLoadingFuels,
    vehicles,
    selectedVehicle, 
    setSelectedVehicle,
    selectedStation, 
    setSelectedStation,
    setActiveTransaction,
    asyncAddTransactionToHistory
  } = useDataStore();

  const handleConfirmPurchase = async (purchaseData: any) => {
    if (!user?.id || !selectedStation || !selectedVehicle) return;

    const newTxId = crypto.randomUUID();
    const newTx = {
      id: newTxId,
      userId: user.id,
      stationId: (selectedStation.id && selectedStation.id.length === 36 && selectedStation.id.includes('-')) ? selectedStation.id : '6498266a-3200-4669-9ffa-d6e52c57bef8',
      stationName: selectedStation.name,
      vehicleId: selectedVehicle.id,
      plateNumber: selectedVehicle.plateNumber,
      fuelTypeId: purchaseData.fuel.id,
      fuelTypeName: purchaseData.fuel.name,
      liters: purchaseData.liters,
      pricePerLiter: purchaseData.fuel.pricePerLiter,
      totalPrice: purchaseData.totalPrice,
      paymentMethod: purchaseData.paymentMethod,
      compatibilityScore: purchaseData.compatibilityScore,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      status: 'pending' as any,
      queueNumber: '0',
      paymentQrCode: 'MOCK_QR_GENERATED',
    };

    console.log('APP: setActiveTransaction...', newTx);
    
    // Explicitly await database insertion before navigating
    const success = await asyncAddTransactionToHistory(newTx);
    if (success) {
      setActiveTransaction(newTx);
      useNotificationStore.getState().asyncCreateNotification(user.id, {
        title: 'Payment Invoice Generated',
        message: `Invoice created for ${newTx.liters} ${newTx.fuelTypeName === 'EV Fast Charge' ? 'kWh' : 'L'} at ${newTx.stationName}. Awaiting payment validation.`,
        type: 'info',
        category: 'payment',
        actionUrl: '/payment'
      });
      navigate('/payment');
    } else {
      console.error('Failed to create transaction in database.');
    }
  };

  const { user } = useAuthStore();

  return (
    <FuelPurchasePage
      fuels={fuels}
      isLoadingFuels={isLoadingFuels}
      vehicles={vehicles}
      selectedVehicle={selectedVehicle}
      onSelectVehicle={setSelectedVehicle}
      selectedStation={selectedStation}
      onSelectStation={setSelectedStation}
      onConfirmPurchase={handleConfirmPurchase}
      onNavigateToVehicleReg={() => navigate('/vehicle-reg')}
    />
  );
}

// Wrapper for Vehicle Registration
function VehicleRegistrationWrapper() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { asyncAddVehicle } = useDataStore();

  return (
    <VehicleRegistrationPage onRegister={async (v) => {
      if (user?.id) {
        const success = await asyncAddVehicle(user.id, v as any);
        if (success) {
          useNotificationStore.getState().asyncCreateNotification(user.id, {
            title: 'Vehicle Registered Successfully',
            message: `Your ${v.brand} ${v.model} (${v.plateNumber}) has been added to your smart fleet.`,
            type: 'success',
            category: 'vehicle',
            actionUrl: '/vehicles'
          });
          navigate('/');
        } else {
          // Force an error so the UI catch block can show it instead of hanging or hiding it
          throw new Error("Backend rejected the vehicle data. Check schema and RLS policies.");
        }
      } else {
        throw new Error("No authenticated user session.");
      }
    }} />
  );
}

// Inner App Component that can use hooks
function AppContent() {
  const navigate = useNavigate();
  const { 
    stations,
    vehicles,
    history,
    selectedStation,
    activeTransaction,
    setSelectedStation,
    deleteVehicle,
    asyncAddVehicle,
    asyncDeleteVehicle,
    setActiveTransaction,
    addTransactionToHistory,
    asyncAddTransactionToHistory,
    asyncUpdateTransactionStatus,
    isLoadingVehicles,
    loadStations,
    isLoadingStations,
    isLoadingHistory,
    loadUserHistory
  } = useDataStore();
  const { user, logout, initialize, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Only call initialize once on mount
    let mounted = true;
    if (mounted) {
      // Print and clear persistent callback logs if they exist
      const savedLogs = localStorage.getItem('auth_callback_logs');
      if (savedLogs) {
        try {
          const parsed = JSON.parse(savedLogs);
          console.group('%c[Auth Callback Persistent Logs]', 'color: #00ff41; font-weight: bold; background: #000; padding: 2px 6px;');
          parsed.forEach((log: string) => console.log(log));
          console.log('[App.tsx] Current user state at startup:', useAuthStore.getState().user);
          console.groupEnd();
        } catch (e) {
          console.warn('Failed to parse persistent callback logs', e);
        }
        localStorage.removeItem('auth_callback_logs');
      }

      initialize();
      useDataStore.getState().loadStations();
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (user?.id) {
      useDataStore.getState().loadUserVehicles(user.id);
      useDataStore.getState().loadUserHistory(user.id);
      useNotificationStore.getState().loadNotifications(user.id);
      useSessionStore.getState().loadSessions(user.id);
      useSessionStore.getState().recordCurrentSession(user.id);

      const unsubscribe = notificationService.subscribeToNotifications(
        user.id,
        (notif) => {
          useNotificationStore.getState().addNotificationOptimistic(notif);
        },
        (notif) => {
          useNotificationStore.getState().updateNotificationOptimistic(notif);
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedStation?.id) {
      useDataStore.getState().loadStationFuels(selectedStation.id);
    } else {
      useDataStore.getState().loadFallbackFuels();
    }
  }, [selectedStation?.id]);

  // Realtime Active Transaction Sync
  useEffect(() => {
    if (!activeTransaction?.id) return;

    const channelName = `tx-sync-${activeTransaction.id}`;
    console.log(`Setting up realtime subscription for active transaction: ${activeTransaction.id}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `id=eq.${activeTransaction.id}`
        },
        (payload: any) => {
          console.log('Realtime active transaction update payload:', payload);
          if (payload.new) {
            const nextStatus = (payload.new.status || '').toLowerCase().trim();
            const currentStatus = (activeTransaction.status || '').toLowerCase().trim();
            
            // Generate queue number string
            const qNum = payload.new.queue_number !== null && payload.new.queue_number !== undefined
              ? payload.new.queue_number.toString()
              : activeTransaction.queueNumber;
              
            if (nextStatus !== currentStatus || qNum !== activeTransaction.queueNumber) {
              const updatedTx = {
                ...activeTransaction,
                status: nextStatus as any,
                queueNumber: qNum
              };
              
              console.log('Syncing active transaction state to:', updatedTx);
              setActiveTransaction(updatedTx);
              
              if (nextStatus === 'completed') {
                if (user?.id) {
                  useDataStore.getState().loadUserHistory(user.id);
                }
              }
              
              // Create database notifications based on status progression
              if (nextStatus === 'queued' && user?.id) {
                useNotificationStore.getState().asyncCreateNotification(user.id, {
                  title: 'Payment Successful',
                  message: `Payment of Rp ${(updatedTx.totalPrice || 0).toLocaleString('id-ID')} verified for ${updatedTx.fuelTypeName}. Refueling queue approved.`,
                  type: 'success',
                  category: 'payment',
                  actionUrl: '/queue'
                });
              } else if (nextStatus === 'refueling' && user?.id) {
                useNotificationStore.getState().asyncCreateNotification(user.id, {
                  title: 'Smart Dispenser Access Granted',
                  message: `Smart barrier gate opened. Please position your vehicle at the dispenser.`,
                  type: 'success',
                  category: 'refuel',
                  actionUrl: '/qr-verify'
                });
              } else if (nextStatus === 'completed' && user?.id) {
                useNotificationStore.getState().asyncCreateNotification(user.id, {
                  title: 'Refueling Session Completed',
                  message: `Successfully dispensed ${updatedTx.liters} L/kWh. Your digital receipt has been generated.`,
                  type: 'success',
                  category: 'refuel',
                  actionUrl: '/receipt'
                });
              }

              // Voice AI feedback and navigation
              if (nextStatus === 'queued') {
                voiceService.speak("Payment verified. System routing to smart queue lane.");
                navigate('/queue');
              } else if (nextStatus === 'refueling') {
                voiceService.speak("Barrier unlocked. Proceed to designated dispenser.");
                navigate('/qr-verify');
              } else if (nextStatus === 'completed') {
                voiceService.speak("Refueling complete. Generating digital receipt. Have a safe journey.");
                navigate('/receipt');
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`Cleaning up subscription: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [activeTransaction?.id, activeTransaction?.status, activeTransaction?.queueNumber, user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-brand-emerald gap-4 font-sans">
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 border-2 border-brand-emerald border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-xs tracking-wider uppercase">Loading Secure Session...</span>
        </div>
        
        <button 
          onClick={() => {
            logout();
            window.location.reload();
          }}
          className="mt-8 px-4 py-2 border border-red-500/20 text-red-500 rounded-lg text-[10px] font-semibold tracking-wider hover:bg-red-500/5 transition-colors cursor-pointer uppercase"
        >
          Reset Session
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
          {/* Public / Splash / Auth */}
          <Route path="/splash" element={<SplashScreen onDismiss={() => navigate('/auth')} />} />
          <Route path="/auth" element={<AuthWrapper />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Customer Routes (Protected) */}
          <Route path="/" element={
            isAuthenticated && user?.role === 'customer' ? (
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout />
              </ProtectedRoute>
            ) : (
              <LandingPage />
            )
          }>
            <Route index element={
              isAuthenticated && user?.role === 'customer' ? (
                <HomeWrapper />
              ) : (
                <LandingPage />
              )
            } />
          </Route>

          {/* Sub-pages under Customer Layout (Protected) */}
          <Route element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout />
            </ProtectedRoute>
          }>
            <Route path="stations" element={
              <NearbyStationPage 
                stations={stations} 
                selectedStation={selectedStation} 
                onSelectStation={setSelectedStation}
                onStartRefuelFlow={(station) => {
                  setSelectedStation(station);
                  navigate('/purchase');
                }}
                isLoadingStations={isLoadingStations}
              />
            } />
            <Route path="vehicle-reg" element={<VehicleRegistrationWrapper />} />
            <Route path="purchase" element={<PurchaseWrapper />} />
            
            {/* Flow routes that require activeTransaction */}
            <Route path="payment" element={
              activeTransaction ? (
                <PaymentPage 
                  totalPrice={activeTransaction.totalPrice}
                  paymentMethod={activeTransaction.paymentMethod}
                  onPaymentSuccess={async () => {
                    const generatedQueueNumber = Math.floor(100 + Math.random() * 899).toString();
                    const success = await asyncUpdateTransactionStatus(activeTransaction.id, 'queued', generatedQueueNumber);
                    if (success) {
                      voiceService.speak("Payment verified. System routing to smart queue lane.");
                      navigate('/queue');
                    } else {
                      console.error('Failed to update transaction status to queued.');
                    }
                  }}
                  onCancelPayment={async () => {
                    const success = await asyncUpdateTransactionStatus(activeTransaction.id, 'cancelled');
                    if (success) {
                      setActiveTransaction(null);
                      navigate('/purchase');
                    }
                  }}
                />
              ) : <Navigate to="/" replace />
            } />
            <Route path="queue" element={
              activeTransaction ? (
                <QueueSystemPage 
                  transaction={activeTransaction}
                  onAdvanceToGate={async () => {
                    const success = await asyncUpdateTransactionStatus(activeTransaction.id, 'refueling');
                    if (success) {
                      voiceService.speak("Barrier unlocked. Proceed to designated dispenser.");
                      navigate('/qr-verify');
                    }
                  }}
                />
              ) : <Navigate to="/" replace />
            } />
            <Route path="qr-verify" element={
              activeTransaction ? (
                <QRVerificationPage 
                  transaction={activeTransaction}
                  onQRScanConfirmed={() => navigate('/barrier')}
                />
              ) : <Navigate to="/" replace />
            } />
            <Route path="barrier" element={
              activeTransaction ? (
                <SmartBarrierGatePage 
                  transaction={activeTransaction}
                  onGatePassed={() => navigate('/refueling')}
                />
              ) : <Navigate to="/" replace />
            } />
            <Route path="refueling" element={
              activeTransaction ? (
                <RefuelingProcessPage 
                  transaction={activeTransaction}
                  onRefuelingCompleted={async () => {
                    const success = await asyncUpdateTransactionStatus(activeTransaction.id, 'completed');
                    if (success) {
                      voiceService.speak("Refueling complete. Generating digital receipt. Have a safe journey.");
                      navigate('/receipt');
                    }
                  }}
                />
              ) : <Navigate to="/" replace />
            } />
            <Route path="receipt" element={
              activeTransaction ? (
                <DigitalReceiptPage 
                  transaction={activeTransaction}
                  onFinishFlow={() => {
                    setActiveTransaction(null);
                    navigate('/');
                  }}
                />
              ) : <Navigate to="/" replace />
            } />
            <Route path="history" element={
              <TransactionHistoryPage 
                transactions={history}
                isLoadingHistory={isLoadingHistory}
                onViewReceipt={(tx) => {
                  setActiveTransaction(tx);
                  navigate('/receipt');
                }}
              />
            } />
            <Route path="vehicles" element={
              <VehiclesPage 
                vehicles={vehicles}
                onRegisterVehicle={async (v) => {
                  if (user?.id) {
                    const success = await asyncAddVehicle(user.id, v as any);
                    if (success) {
                      useNotificationStore.getState().asyncCreateNotification(user.id, {
                        title: 'Vehicle Registered Successfully',
                        message: `Your ${v.brand} ${v.model} (${v.plateNumber}) has been added to your smart fleet.`,
                        type: 'success',
                        category: 'vehicle',
                        actionUrl: '/vehicles'
                      });
                    } else {
                      throw new Error("Backend rejected the vehicle data. Check schema and RLS policies.");
                    }
                  } else {
                    throw new Error("No authenticated user session.");
                  }
                }}
                onDeleteVehicle={async (id) => {
                  const vehicleToDelete = vehicles.find(v => v.id === id);
                  const success = await asyncDeleteVehicle(id);
                  if (success && user?.id && vehicleToDelete) {
                    useNotificationStore.getState().asyncCreateNotification(user.id, {
                      title: 'Vehicle Removed',
                      message: `Your ${vehicleToDelete.brand} ${vehicleToDelete.model} (${vehicleToDelete.plateNumber}) has been removed from your smart fleet.`,
                      type: 'info',
                      category: 'vehicle',
                      actionUrl: '/vehicles'
                    });
                  }
                }}
                isLoadingVehicles={isLoadingVehicles}
              />
            } />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="faq" element={<FAQPage />} />
            <Route path="settings" element={
              <SettingsPage 
                userEmail={user?.email || 'driver@sfrt.io'}
                onLogout={logout}
              />
            } />
            <Route path="profile" element={<Navigate to="/settings" replace />} />
          </Route>

          {/* Admin Routes (Protected) */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'operator']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="queue" element={<AdminQueueFlow />} />
            <Route path="stations" element={<AdminStations />} />
            <Route path="devices" element={<AdminDevices />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/') : '/splash'} replace />} />
        </Routes>
      </AnimatePresence>
  );
}

// Global App Component
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
