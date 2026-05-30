/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Flame, RefreshCw, QrCode, Wifi, Lock, Unlock, HelpCircle, ToggleLeft, Activity, VolumeX, AlertOctagon, Printer, Compass, CheckCircle, ArrowRight } from 'lucide-react';
import GlassCard from '../GlassCard';
import { Transaction, Vehicle } from '../../types';
import { queueService } from '../../services/queueService';
import { useTranslation } from '../../hooks/useTranslation';

// ==========================================
// 8. QUEUE SYSTEM PAGE COMPONENT
// ==========================================
interface QueueSystemPageProps {
  transaction: Transaction;
  onAdvanceToGate: () => void;
}

export function QueueSystemPage({ transaction, onAdvanceToGate }: QueueSystemPageProps) {
  const [queueIndex, setQueueIndex] = useState(3); // Start at #3 in queue line as fallback
  const [isJoining, setIsJoining] = useState(true);
  const { t, language } = useTranslation();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initQueue = async () => {
      // Join the queue in Supabase
      const { success, queuePosition } = await queueService.joinQueue(
        transaction.id, 
        transaction.stationId
      );
      
      const startPos = (success && queuePosition > 0) ? queuePosition : 4; // Default to 4 if DB fails
      setQueueIndex(startPos);
      
      // DEMO ONLY: Automatically move up the queue so the user can proceed
      if (startPos > 1) {
        const timer = setInterval(() => {
          setQueueIndex(prev => {
            if (prev <= 2) {
              clearInterval(timer);
              return 1;
            }
            return prev - 1;
          });
        }, 2500);
      }
      
      setIsJoining(false);

      // Subscribe to real-time updates for this station
      unsubscribe = queueService.subscribeToStationQueue(transaction.stationId, (newQueueCount) => {
        setQueueIndex(prev => prev > 1 ? prev - 1 : 1);
      });
    };

    initQueue();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [transaction.id, transaction.stationId]);

  return (
    <div className="flex-grow space-y-6 text-text-primary text-left" id="queue-module">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
        
        {/* Left column: Visual list of queuing vehicles (Col 1 to 5) */}
        <div className="md:col-span-5 flex flex-col gap-4 text-left">
          <GlassCard title={language === 'id' ? 'Lajur Pengisian' : 'Refueling Lane'} subtitle={language === 'id' ? 'Posisi antrean kendaraan waktu nyata' : 'Real-time vehicle position queue'}>
            <div className="space-y-4 text-left">
              <span className="font-sans text-[11px] text-text-secondary uppercase tracking-wider font-semibold block">{language === 'id' ? 'Status antrean lajur' : 'Lane queue status'}</span>

              {/* Lane stack rendering */}
              <div className="space-y-3 relative border-l-2 border-dashed border-border-primary pl-4 py-2 text-left">
                
                {/* Visual cars in lane simulator */}
                <div className={`p-4 rounded-xl border transition-all flex justify-between items-center ${
                  queueIndex === 1 ? 'border-brand-emerald bg-brand-emerald/5' : 'border-border-primary bg-panel-bg'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs text-brand-emerald font-semibold">{language === 'id' ? '[ Posisi Gerbang ]' : '[ Gate Position ]'}</span>
                    <span className="font-sans text-xs text-text-primary font-medium">{transaction.plateNumber}</span>
                  </div>
                  <span className="font-sans text-[10px] text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded-lg font-medium">
                    {queueIndex === 1 ? (language === 'id' ? 'Aktif' : 'Active') : (language === 'id' ? 'Menunggu' : 'Waiting')}
                  </span>
                </div>

                <div className={`p-4 rounded-xl border transition-all flex justify-between items-center ${
                  queueIndex === 2 ? 'border-amber-500/50 bg-amber-500/5' : 'border-border-primary bg-panel-bg'
                }`}>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span className="font-sans text-xs font-medium text-text-secondary">{language === 'id' ? '[ Posisi 2 ]' : '[ Position 2 ]'}</span>
                    <span className="font-sans text-xs">B 9845 TZY (Cybertruck)</span>
                  </div>
                  <span className="font-sans text-[10px] text-text-secondary font-medium">{language === 'id' ? 'Berikutnya' : 'Next'}</span>
                </div>

                <div className={`p-4 rounded-xl border transition-all flex justify-between items-center border-border-primary bg-panel-bg`}>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span className="font-sans text-xs font-medium text-text-secondary">{language === 'id' ? '[ Posisi 3 ]' : '[ Position 3 ]'}</span>
                    <span className="font-sans text-xs">B 1104 SQT (Model X)</span>
                  </div>
                  <span className="font-sans text-[10px] text-text-secondary font-medium">{language === 'id' ? 'Mengantre' : 'Queued'}</span>
                </div>
              </div>

              {/* Queue timing summaries */}
              <div className="pt-4 border-t border-border-primary text-center font-sans text-xs">
                <span className="text-text-secondary">{language === 'id' ? 'Estimasi Rilis:' : 'Estimated Release:'}</span>
                <span className="text-text-primary block font-bold text-sm mt-1">
                  {queueIndex * 2} {language === 'id' ? 'menit' : 'minutes'}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right column: HUD queue credentials & prompt (Col 6 to 12) */}
        <div className="md:col-span-7 flex flex-col justify-center">
          <GlassCard title={language === 'id' ? 'Tiket Aktif' : 'Active Ticket'} subtitle={language === 'id' ? 'Kode izin untuk gerbang stasiun' : 'Clearance code for station gate'}>
            <div className="text-center py-8 space-y-5">
              <span className="font-sans text-[11px] text-brand-emerald bg-brand-emerald/10 px-3 py-1 rounded-full border border-brand-emerald/20 inline-block font-semibold uppercase tracking-wider">
                {language === 'id' ? 'Lajur 1 Antrean Aktif' : 'Lane 1 Active Queue'}
              </span>

              <div className="space-y-1">
                <span className="font-sans text-[11px] text-text-secondary block font-semibold uppercase tracking-wider">{language === 'id' ? 'NOMOR ANDA' : 'YOUR NUMBER'}</span>
                <h2 className="font-display font-bold text-5xl text-text-primary tracking-wider">
                  Q-{transaction.queueNumber}
                </h2>
              </div>

              <div className="max-w-md mx-auto text-xs text-text-secondary leading-relaxed px-4">
                {queueIndex > 1 ? (
                  language === 'id' ? (
                    <>
                      Silakan sejajarkan bumper kendaraan Anda ke garis antrean lajur pintar.
                      Kamera kami akan mengidentifikasi plat nomor <span className="text-text-primary font-sans font-semibold">{transaction.plateNumber}</span> saat Anda maju.
                    </>
                  ) : (
                    <>
                      Please align your vehicle bumper to the smart lane queue lines.
                      Our cameras will identify license plate <span className="text-text-primary font-sans font-semibold">{transaction.plateNumber}</span> as you advance.
                    </>
                  )
                ) : (
                  <span className="text-brand-emerald font-semibold">
                    {language === 'id' 
                      ? `✓ Bumper teridentifikasi! Plat nomor cocok. Silakan pindai QR masuk Anda di gerbang untuk membuka penghalang.`
                      : `✓ Bumper identified! License matched successfully. Please scan your entry QR at the gate to open barrier.`}
                  </span>
                )}
              </div>

              {queueIndex === 1 && (
                <button
                  onClick={onAdvanceToGate}
                  className="bg-brand-emerald text-white font-sans font-medium py-3.5 px-6 rounded-xl text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer mt-4 uppercase tracking-wider font-bold"
                  id="btn-advance-to-gate"
                >
                  {language === 'id' ? 'Lanjut ke Gerbang' : 'Proceed to Gate'}
                  <Wifi className="w-4 h-4" />
                </button>
              )}
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 9. QR VERIFICATION PAGE COMPONENT
// ==========================================
interface QRVerificationPageProps {
  transaction: Transaction;
  onQRScanConfirmed: () => void;
}

export function QRVerificationPage({ transaction, onQRScanConfirmed }: QRVerificationPageProps) {
  const [countdown, setCountdown] = useState(90); // 90 second QR security TTL
  const [hasTappedNfc, setHasTappedNfc] = useState(false);
  const { t, language } = useTranslation();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleNfcTapSimulator = () => {
    setHasTappedNfc(true);
    setTimeout(() => {
      onQRScanConfirmed();
    }, 1500);
  };

  return (
    <div className="flex-grow flex items-center justify-center min-h-[450px] text-text-primary p-4" id="qr-verify-module">
      <div className="max-w-md w-full relative">
        <GlassCard
          title={language === 'id' ? 'Tiket Akses' : 'Access Ticket'}
          subtitle={language === 'id' ? 'Integrasi pemindai gerbang & interkom NFC' : 'Gate scanner & NFC intercom integration'}
          className="relative overflow-hidden"
        >
          {hasTappedNfc && (
            <div className="absolute inset-0 bg-bg-primary/95 z-30 flex flex-col items-center justify-center text-center p-6 gap-4">
              <Wifi className="w-12 h-12 text-brand-emerald animate-ping" />
              <div className="space-y-1">
                <h4 className="font-display font-semibold text-sm">
                  {language === 'id' ? 'Mentransmisikan NFC' : 'NFC Transmitting'}
                </h4>
                <p className="font-sans text-xs text-brand-emerald animate-pulse">
                  {language === 'id' ? 'Mengirim kredensial gerbang masuk...' : 'Sending barrier clearance credentials...'}
                </p>
              </div>
            </div>
          )}

          {/* Secure Header Instruction */}
          <div className="text-center py-4 border-b border-border-primary space-y-1.5">
            <span className="font-sans text-[11px] text-text-secondary uppercase tracking-wider font-semibold block">{language === 'id' ? 'Sejajarkan kode QR dengan pemindai' : 'Align QR code with scanner'}</span>
            <p className="text-xs text-text-secondary max-w-[280px] mx-auto leading-relaxed">
              {language === 'id' 
                ? 'Pegang kode QR sekitar 20-30cm dari lensa terminal konsol.'
                : 'Hold the QR code 20-30cm from the console\'s terminal lens.'}
            </p>
          </div>

          <div className="flex flex-col items-center py-6 space-y-6">
            
            {/* Massive Secure QR generator box */}
            <div className="p-4 bg-white rounded-2xl border-2 border-brand-emerald/25 shadow-md relative">
              <svg className="w-48 h-48 fill-zinc-900 mx-auto" viewBox="0 0 100 100">
                <rect x="0" y="0" width="25" height="25" />
                <rect x="5" y="5" width="15" height="15" fill="white" />
                <rect x="0" y="75" width="25" height="25" />
                <rect x="5" y="80" width="15" height="15" fill="white" />
                <rect x="75" y="0" width="25" height="25" />
                <rect x="80" y="5" width="15" height="15" fill="white" />
                <rect x="30" y="30" width="10" height="10" />
                <rect x="45" y="45" width="10" height="10" />
                <rect x="50" y="10" width="20" height="10" />
                <rect x="35" y="60" width="10" height="20" />
                <rect x="15" y="40" width="15" height="10" />
                <rect x="70" y="35" width="15" height="10" />
                <rect x="65" y="65" width="25" height="25" />
                <rect x="70" y="70" width="15" height="15" fill="white" />
              </svg>
            </div>

            {/* Countdown indicators */}
            <div className="text-center space-y-1 font-sans">
              <span className="text-xs text-text-secondary block">{language === 'id' ? 'Kode kedaluwarsa dalam' : 'Code expires in'}</span>
              <span className="font-semibold text-base text-red-500 font-mono">
                {countdown} {language === 'id' ? 'detik' : 'seconds'}
              </span>
            </div>

            {/* NFC tap mock prompt details */}
            <div className="w-full text-center pt-5 border-t border-border-primary space-y-3">
              <span className="font-sans text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">{language === 'id' ? 'Atau ketuk perangkat di pemancar' : 'Or tap device at transmitter'}</span>
              <button
                onClick={handleNfcTapSimulator}
                id="btn-simulate-nfc-tap"
                className="py-2.5 px-5 bg-panel-bg border border-border-primary text-text-primary hover:border-brand-emerald/40 font-sans font-medium rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Wifi className="w-4 h-4 text-brand-emerald" />
                {language === 'id' ? 'Simulasi Ketukan NFC' : 'Simulate NFC Tap'}
              </button>
            </div>

            {/* Manual confirm logic */}
            <button
              onClick={onQRScanConfirmed}
              className="font-sans text-xs text-text-secondary underline hover:text-brand-emerald cursor-pointer"
              id="btn-manual-qr-clear"
            >
              {language === 'id' ? 'Lewati pemindaian QR [Mode Demo]' : 'Skip QR scanning [Demo Mode]'}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ==========================================
// 10. SMART BARRIER GATE COMPONENT
// ==========================================
interface SmartBarrierGatePageProps {
  transaction: Transaction;
  onGatePassed: () => void;
}

export function SmartBarrierGatePage({ transaction, onGatePassed }: SmartBarrierGatePageProps) {
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [scanningCompleted, setScanningCompleted] = useState(false);
  const { t, language } = useTranslation();

  useEffect(() => {
    // Stage 1: Auto scanner scan
    const timer1 = setTimeout(() => {
      setScanningCompleted(true);
    }, 1800);

    // Stage 2: Lock open
    const timer2 = setTimeout(() => {
      setGateUnlocked(true);
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="flex-grow flex items-center justify-center min-h-[450px] text-text-primary p-4 text-left" id="barrier-module">
      <div className="max-w-md w-full relative">
        <GlassCard
          title={language === 'id' ? 'Gerbang Pemeriksaan Keamanan' : 'Security Clearance Gate'}
          subtitle={language === 'id' ? 'Terminal pemindai bumper otomatis' : 'Automatic bumper scanner terminal'}
          className="overflow-hidden"
        >
          <div className="relative py-6 flex flex-col items-center gap-6">
            
            {/* Gate visualization graphics */}
            <div className="w-full h-32 bg-overlay rounded-xl relative flex flex-col items-center justify-center border border-border-primary overflow-hidden">
              
              {/* Hydraulic visual pole line */}
              <motion.div
                className={`absolute w-full h-2 left-0 z-20 ${
                  gateUnlocked ? 'bg-brand-emerald shadow-sm' : 'bg-red-500 shadow-sm'
                }`}
                animate={gateUnlocked ? { rotate: -35, y: -45, x: 10 } : { rotate: 0, y: 0, x: 0 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
                style={{ originX: 0, originY: 'center', top: '50%' }}
              />

              {/* Neon indicators */}
              <div className="absolute top-4 right-4 flex gap-2 font-sans text-xs items-center">
                <span className="text-text-secondary uppercase text-[10px] font-semibold">System:</span>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  gateUnlocked ? 'bg-brand-emerald animate-pulse' : 'bg-red-500'
                }`} />
              </div>

              {/* Gate display labels */}
              <div className="text-center z-10 space-y-1">
                <h4 className="font-display font-semibold text-lg text-text-primary uppercase">
                  {gateUnlocked ? (language === 'id' ? 'Silakan Masuk' : 'Proceed to Nozzle') : (language === 'id' ? 'Menunggu...' : 'Waiting...')}
                </h4>
                <p className="font-sans text-[10px] text-text-secondary block font-semibold uppercase">
                  {language === 'id' ? 'Lajur Nosel Pompa #1' : 'Nozzle Lane Pump #1'}
                </p>
              </div>
            </div>

            {/* Diagnostic Logs telemetry list */}
            <div className="w-full space-y-2.5 font-sans text-xs bg-overlay border border-border-primary p-4 rounded-xl text-left">
              <div className="flex justify-between">
                <span className="text-text-secondary">{language === 'id' ? 'Pindaian Plat Nomor:' : 'License Plate scan:'}</span>
                <span className={scanningCompleted ? 'text-brand-emerald font-medium' : 'text-amber-500 font-medium animate-pulse'}>
                  {scanningCompleted ? (language === 'id' ? 'Terverifikasi' : 'Verified') : (language === 'id' ? 'Memindai...' : 'Scanning...')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">{language === 'id' ? 'Identitas Kendaraan:' : 'Vehicle license:'}</span>
                <span className="text-text-primary font-medium">{transaction.plateNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">{language === 'id' ? 'Status Pembayaran:' : 'Payment status:'}</span>
                <span className="text-brand-emerald font-medium">{language === 'id' ? 'Lunas' : 'Settled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">{language === 'id' ? 'Akses Gerbang:' : 'Gate access:'}</span>
                <span className={gateUnlocked ? 'text-brand-emerald font-medium' : 'text-text-secondary font-medium'}>
                  {gateUnlocked ? (language === 'id' ? 'Terbuka' : 'Unlocked') : (language === 'id' ? 'Terkunci' : 'Engaged')}
                </span>
              </div>
            </div>

            {/* Direct pass trigger button */}
            {gateUnlocked && (
              <button
                onClick={onGatePassed}
                className="w-full bg-brand-emerald text-white font-sans font-medium py-3.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer uppercase font-bold"
                id="btn-gate-passed"
              >
                {language === 'id' ? 'Lewati Penghalang Gerbang' : 'Drive Through Barrier'}
              </button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ==========================================
// 11. REFUELING PROCESS PAGE COMPONENT
// ==========================================
interface RefuelingProcessPageProps {
  transaction: Transaction;
  onRefuelingCompleted: () => void;
}

export function RefuelingProcessPage({ transaction, onRefuelingCompleted }: RefuelingProcessPageProps) {
  const [litersPumped, setLitersPumped] = useState(0);
  const [isLatchingNozzle, setIsLatchingNozzle] = useState(true);
  const [isFlowing, setIsFlowing] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState(false);
  const { t, language } = useTranslation();

  // Nozzle latch delay simulator
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLatchingNozzle(false);
      setIsFlowing(true);
    }, 2000); // 2 Secs setup nozzle parameters
    return () => clearTimeout(timer);
  }, []);

  // Volumetric count-up refuel loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFlowing && litersPumped < transaction.liters && !emergencyAlert) {
      interval = setInterval(() => {
        setLitersPumped((prev) => {
          const nextVal = Number((prev + 0.35).toFixed(2));
          if (nextVal >= transaction.liters) {
            clearInterval(interval);
            setIsFlowing(false);
            // Wait 1.5s to display success receipts
            setTimeout(() => {
              onRefuelingCompleted();
            }, 1800);
            return transaction.liters;
          }
          return nextVal;
        });
      }, 80); // Fast fueling
    }
    return () => clearInterval(interval);
  }, [isFlowing, litersPumped, transaction.liters, emergencyAlert, onRefuelingCompleted]);

  const handleEmergencyStop = () => {
    setIsFlowing(false);
    setEmergencyAlert(true);
  };

  const handleManualResume = () => {
    setEmergencyAlert(false);
    setIsFlowing(true);
  };

  const percentProgress = Math.min(100, Math.floor((litersPumped / transaction.liters) * 100));

  return (
    <div className="flex-grow space-y-6 text-text-primary animate-fade-in text-left" id="refueling-module">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center text-left">
        
        {/* Left Column: Volumetric telemetry progress display (Col 1 to 5) */}
        <div className="md:col-span-5 flex flex-col items-center">
          <GlassCard title={language === 'id' ? 'Status Aliran BBM' : 'Fuel Flow Status'} subtitle={language === 'id' ? 'Ringkasan volume terdispensi' : 'Liters dispensed summary'} glow={isFlowing} className="w-full text-center">
            <div className="relative py-6 flex flex-col items-center justify-center">
              
              {/* Dynamic Rotating Progress Loop Gauge */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 80}
                    strokeDashoffset={2 * Math.PI * 80 * (1 - percentProgress / 100)}
                    className="transition-all duration-300"
                  />
                </svg>

                {/* Liters Text counter inside Ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-sans text-[10px] text-text-secondary block uppercase tracking-wider font-semibold">{language === 'id' ? 'Mengisi' : 'Refueling'}</span>
                  <span className="font-display font-bold text-3xl inline-block text-text-primary leading-none my-1">
                    {litersPumped.toFixed(2)}
                  </span>
                  <span className="font-sans text-[11px] text-brand-emerald font-medium leading-none block">
                    / {transaction.liters} L
                  </span>
                </div>
              </div>

              {/* Progress Bar Label percentages */}
              <div className="mt-5">
                <span className="font-sans text-xs text-text-secondary font-medium">
                  {language === 'id' ? `Kemajuan Pengisian: ${percentProgress}%` : `Refueling Progress: ${percentProgress}%`}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Diagnostic specs & Safety systems (Col 6 to 12) */}
        <div className="md:col-span-7 space-y-6 text-left">
          <GlassCard title={language === 'id' ? 'Panel Diagnostik' : 'Diagnostics Panel'} subtitle={language === 'id' ? 'Telemetri nosel dan keselamatan' : 'Nozzle and safety telemetry'}>
            
            {/* ALERT EMBED if emergency triggered */}
            {emergencyAlert && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl text-xs font-sans space-y-3 shadow-sm text-left">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="font-bold">!! {language === 'id' ? 'INTERSEPSI DIAKTIFKAN: VALVE KESELAMATAN AKTIF' : 'INTERCEPT INITIATED: SAFETY OVERRIDE ACTIVE'} !!</span>
                </div>
                <p className="text-xs leading-relaxed text-text-secondary">
                  {language === 'id' 
                    ? 'Katup aliran terkunci secara mekanis. Untuk melanjutkan pengisian, lepas katup pengaman secara manual.'
                    : 'Flow valve locked mechanically. To resume fueling, release the safety valve manually.'}
                </p>
                <button
                  type="button"
                  onClick={handleManualResume}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-sans font-medium text-xs transition-colors cursor-pointer"
                >
                  {language === 'id' ? 'Lepaskan Katup Pengaman' : 'Release Safety Valve'}
                </button>
              </div>
            )}

            <div className="space-y-5 text-left">
              
              {/* Telemetry rows */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-1 font-sans text-xs text-text-secondary text-left">
                <div className="bg-overlay p-3 rounded-xl border border-border-primary text-left">
                  <span className="text-text-secondary block uppercase text-[10px] tracking-wider font-semibold">{language === 'id' ? 'Status Nosel' : 'Nozzle status'}</span>
                  <span className={`font-semibold block mt-1 ${isLatchingNozzle ? 'text-amber-500 animate-pulse' : 'text-brand-emerald'}`}>
                    {isLatchingNozzle ? (language === 'id' ? 'Mengunci...' : 'Latching...') : (language === 'id' ? 'Terhubung' : 'Connected')}
                  </span>
                </div>
                <div className="bg-overlay p-3 rounded-xl border border-border-primary text-left">
                  <span className="text-text-secondary block uppercase text-[10px] tracking-wider font-semibold">{language === 'id' ? 'Kecepatan Aliran' : 'Flow speed'}</span>
                  <span className="text-text-primary font-bold block mt-1">
                    {isFlowing ? '3.8 L/sec' : '0.0 L/sec'}
                  </span>
                </div>
                <div className="bg-overlay p-3 rounded-xl border border-border-primary col-span-2 sm:col-span-1 text-left">
                  <span className="text-text-secondary block uppercase text-[10px] tracking-wider font-semibold">{language === 'id' ? 'Status Pelindung' : 'Shield Status'}</span>
                  <span className="text-brand-emerald font-semibold block mt-1">{language === 'id' ? 'Aman' : 'Secure'}</span>
                </div>
              </div>

              {/* Sinewave compression visualizer */}
              <div className="bg-overlay p-4 rounded-xl border border-border-primary space-y-3 text-left">
                <span className="font-sans text-[10px] text-text-secondary uppercase tracking-wider font-semibold block">{language === 'id' ? 'Kompresi Aliran Pompa' : 'Pump Compression Flow'}</span>
                <div className="h-6 flex items-end gap-[4px] py-1">
                  {[...Array(28)].map((_, i) => {
                    const h = isFlowing ? 10 + Math.sin(i * 0.5 + litersPumped) * 12 : 3;
                    return (
                      <div
                        key={i}
                        className="flex-grow bg-brand-emerald/70 rounded-full transition-all duration-100"
                        style={{ height: `${Math.max(3, h)}px` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Action grid options */}
              <div className="flex items-center justify-between gap-4 text-left">
                <span className="font-sans text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                  {language === 'id' ? 'Intervensi Manual Darurat' : 'Operational Safety Override'}
                </span>

                <button
                  onClick={handleEmergencyStop}
                  disabled={isLatchingNozzle || emergencyAlert}
                  type="button"
                  className="bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-sans font-medium text-xs px-4 py-2.5 rounded-xl cursor-pointer disabled:opacity-30 flex items-center gap-1.5 shadow-sm"
                  id="btn-emergency-stop"
                >
                  <AlertOctagon className="w-4 h-4" />
                  {language === 'id' ? 'Berhenti Darurat' : 'Emergency Stop'}
                </button>
              </div>

            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 12. DIGITAL RECEIPT PAGE COMPONENT
// ==========================================
interface DigitalReceiptPageProps {
  transaction: Transaction;
  onFinishFlow: () => void;
}

export function DigitalReceiptPage({ transaction, onFinishFlow }: DigitalReceiptPageProps) {
  const [printStampVisible, setPrintStampVisible] = useState(false);
  const { t, language } = useTranslation();

  useEffect(() => {
    // Reveal verified hologram stamp in 1.2s
    const timer = setTimeout(() => {
      setPrintStampVisible(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-grow flex items-center justify-center min-h-[480px] text-text-primary p-4" id="receipt-module">
      <div className="max-w-md w-full relative">
        
        {/* Futuristic Printed aesthetics Receipt frame */}
        <div className="bg-white text-zinc-900 p-6 rounded-2xl border border-zinc-200 flex flex-col gap-6 relative font-sans text-xs select-none shadow-2xl">
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-900 rounded-t-2xl" />

          {/* Core Receipt Brand Header */}
          <div className="text-center space-y-1.5">
            <h1 className="font-display font-semibold text-xl tracking-[0.2em] text-zinc-900 border-b border-dashed border-zinc-200 pb-3">
              SFRT
            </h1>
            <p className="text-[10px] font-semibold text-zinc-500 tracking-wider">
              SUPER FAST REFUELING TECHNOLOGY
            </p>
            <p className="text-[9px] text-zinc-400 font-medium">
              AUTOPUMP LANE #01
            </p>
          </div>

          {/* Secure details table */}
          <div className="space-y-2 border-b border-dashed border-zinc-200 pb-4 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-zinc-500">{language === 'id' ? 'ID Struk / Transaksi:' : 'Invoice ID:'}</span>
              <span className="font-semibold text-zinc-900">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">{language === 'id' ? 'Waktu Transaksi:' : 'Timestamp:'}</span>
              <span className="text-zinc-900 font-mono">{transaction.date} • {transaction.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">{language === 'id' ? 'Nomor Plat:' : 'Vehicle Profile:'}</span>
              <span className="text-zinc-900 font-semibold">{transaction.plateNumber}</span>
            </div>
          </div>

          {/* Volumetric transaction summary */}
          <div className="space-y-2.5 border-b border-dashed border-zinc-200 pb-4 text-xs text-left">
            <div className="flex justify-between font-bold text-zinc-900">
              <span>{language === 'id' ? 'Jenis BBM:' : 'Fuel Spec:'}</span>
              <span className="uppercase">{transaction.fuelTypeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Volume:</span>
              <span className="text-zinc-900">{transaction.liters} {transaction.fuelTypeName.toLowerCase().includes('charge') ? 'kWh' : 'Liters'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">{language === 'id' ? 'Harga per Satuan:' : 'Price/Unit:'}</span>
              <span className="text-zinc-800">Rp {transaction.pricePerLiter.toLocaleString()}</span>
            </div>
          </div>

          {/* Invoice Pricing final total */}
          <div className="flex justify-between items-center text-zinc-900 py-1 text-xs text-left">
            <span className="font-sans font-bold uppercase tracking-wider">{language === 'id' ? 'Total Pembayaran' : 'Grand Total'}</span>
            <span className="font-display font-bold text-lg text-brand-emerald">
              Rp {transaction.totalPrice.toLocaleString()}
            </span>
          </div>

          {/* Hologram visual QR verification stamps */}
          <div className="flex items-center justify-between gap-4 bg-zinc-50 p-3.5 rounded-xl border border-zinc-100 relative overflow-hidden text-left">
            <div>
              <span className="font-bold text-[9px] text-zinc-700 block uppercase">{language === 'id' ? 'Barcode verifikasi gerbang' : 'Gate Verification barcode'}</span>
              <span className="text-[8px] text-zinc-400 block mt-0.5 font-mono">SEC_ID: G-NODE_A9</span>
            </div>
            
            {/* Minimal SVG Barcode lines */}
            <div className="h-8 flex gap-[2px] items-center shrink-0 w-24 bg-white p-1 rounded border border-zinc-100">
              {[1,3,2,1,4,1,2,3,1,2,1,4,2].map((w, idx) => (
                <div key={idx} className="bg-zinc-900 h-full" style={{ width: `${w * 1.5}px` }} />
              ))}
            </div>

            {/* Pulsing stamp overlay */}
            {printStampVisible && (
              <motion.div
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-y-0 right-4 flex items-center pointer-events-none"
              >
                <div className="border-4 border-brand-emerald rounded-xl px-3 py-1 text-brand-emerald uppercase font-bold tracking-widest text-xs rotate-12 bg-white/60 backdrop-blur-xs select-none">
                  {language === 'id' ? '✓ Lunas' : '✓ Paid'}
                </div>
              </motion.div>
            )}
          </div>

          {/* Return button */}
          <button
            onClick={onFinishFlow}
            type="button"
            className="w-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors font-sans font-semibold py-3.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer text-center font-bold"
            id="btn-finish-refuels-done"
          >
            {language === 'id' ? 'Selesai & Keluar' : 'Dismiss Ticket'}
          </button>
        </div>

      </div>
    </div>
  );
}
