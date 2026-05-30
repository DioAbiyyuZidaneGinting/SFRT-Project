/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Car, 
  Trash2, 
  Plus, 
  CheckCircle, 
  Sparkles, 
  ShieldCheck, 
  Camera, 
  RefreshCw,
  Info
} from 'lucide-react';
import GlassCard from '../GlassCard';
import { useTranslation } from '../../hooks/useTranslation';

interface VehiclesPageProps {
  vehicles: Vehicle[];
  onRegisterVehicle: (v: any) => Promise<void>;
  onDeleteVehicle: (id: string) => Promise<void>;
  isLoadingVehicles?: boolean;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  vehicleType: 'car' | 'motorcycle';
  fuelTypePreference: string;
  tankCapacity: number;
}

export function VehiclesPage({
  vehicles,
  onRegisterVehicle,
  onDeleteVehicle,
  isLoadingVehicles = false
}: VehiclesPageProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car');
  const [brand, setBrand] = useState('Tesla');
  const [model, setModel] = useState('');
  const [fuelPref, setFuelPref] = useState('Pertamax Turbo');
  const [tankCapacity, setTankCapacity] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { t, language } = useTranslation();

  // Scanner simulation
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [simulatedScannedPlate, setSimulatedScannedPlate] = useState('');

  useEffect(() => {
    let timer: any;
    let characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (isScanning) {
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            const mockPlate = `B ${Math.floor(1000 + Math.random() * 8999)} S${characters[Math.floor(Math.random() * 35)]}${characters[Math.floor(Math.random() * 35)]}`;
            setPlateNumber(mockPlate);
            setBrand('Tesla');
            setModel('Model Y');
            return 100;
          }
          const tempPlate = `B ${Math.floor(1000 + Math.random() * 8999)} ` + 
                             characters[Math.floor(Math.random() * 35)] + 
                             characters[Math.floor(Math.random() * 35)];
          setSimulatedScannedPlate(tempPlate);
          return prev + 8;
        });
      }, 60);
    }
    return () => clearInterval(timer);
  }, [isScanning]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onRegisterVehicle({
        plateNumber: plateNumber.toUpperCase(),
        vehicleType,
        brand: brand || 'Generic',
        model: model || 'Standard',
        fuelTypePreference: fuelPref,
        tankCapacity: tankCapacity || 40,
      });
      // Reset form on success
      setPlateNumber('');
      setModel('');
    } catch (err: any) {
      setError(err.message || t('vehicles.errorMsg'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow space-y-8 text-text-primary font-sans" id="vehicles-page-module">
      
      <div className="flex justify-between items-center border-b border-border-primary/50 pb-5">
        <div className="space-y-1">
          <h1 className="font-sans font-extrabold text-2xl tracking-tight text-text-primary uppercase">
            {t('vehicles.title')}
          </h1>
          <p className="text-xs text-text-secondary">
            {t('vehicles.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-600 text-[9px] font-bold uppercase tracking-wider select-none shrink-0">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          {vehicles.length} {language === 'id' ? 'Armada Terdaftar' : 'Auth Fleet'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Registered Vehicles List (Col 1 to 7) */}
        <div className="lg:col-span-7 space-y-8">
          <GlassCard title={language === 'id' ? 'Armada Terverifikasi' : 'Registered Fleet'} subtitle={language === 'id' ? 'Daftar chassis kendaraan terotorisasi' : 'Authorized vehicle chassis list'}>
            {isLoadingVehicles ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="p-5 border border-border-primary rounded-2xl bg-panel-bg/50 flex items-center gap-4 animate-pulse">
                    <div className="w-14 h-10 bg-border-primary/30 rounded-xl" />
                    <div className="space-y-2 w-full text-left">
                      <div className="h-4 bg-border-primary/30 rounded w-1/3" />
                      <div className="h-3 bg-border-primary/30 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-16 space-y-4 border border-dashed border-border-primary rounded-2xl p-6 bg-overlay/20">
                <Car className="w-12 h-12 text-text-secondary/35 mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">
                    {language === 'id' ? 'Belum ada armada terdaftar' : 'No vehicles linked yet'}
                  </h4>
                  <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                    {language === 'id' 
                      ? 'Tautkan nomor plat kendaraan Anda untuk mengaktifkan peminiangan gerbang pintar otomatis dan pembayaran pra-otorisasi RFID.' 
                      : 'Link your vehicle\'s license plate number to enable autonomous gate checking and pre-authorized RFID payments.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {vehicles.map((v) => {
                  return (
                    <div 
                      key={v.id}
                      className="p-4 border border-border-primary bg-panel-bg hover:border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-4 truncate">
                        {/* Immersive Vehicle Icon/Avatar */}
                        <div className="w-16 h-12 bg-overlay border border-border-primary/60 rounded-xl flex items-center justify-center shrink-0 p-1 relative overflow-hidden select-none">
                          <img src="/ev_sports_car.png" alt="EV Sports Car" className="w-full h-full object-contain" />
                        </div>

                        <div className="truncate space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-bold text-sm text-emerald-600">
                              {v.plateNumber}
                            </span>
                            <span className="text-[8px] font-bold text-text-secondary bg-overlay px-1.5 py-0.5 rounded border border-border-primary uppercase">
                              {v.vehicleType === 'car' ? (language === 'id' ? 'Mobil' : 'Car') : (language === 'id' ? 'Motor' : 'Motorcycle')}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary font-medium">
                            {v.brand} {v.model} • {v.fuelTypePreference} • {v.tankCapacity}L Max
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Compatibility Status badge */}
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {t('vehicles.calibrationActive')}
                        </div>

                        <button
                          onClick={() => {
                            if (confirm(language === 'id' ? `Hapus kendaraan ${v.plateNumber}?` : `Delete vehicle ${v.plateNumber}?`)) {
                              onDeleteVehicle(v.id);
                            }
                          }}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/15 cursor-pointer transition-colors"
                          title="Remove vehicle link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Smart Telemetry Info Card */}
          <GlassCard title={t('dashboard.telemetry')} subtitle={language === 'id' ? 'Mekanisme kompatibilitas bahan bakar & RFID' : 'RFID and fuel compatibility mechanics'}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {[
                { title: t('vehicles.calibrationActive'), desc: language === 'id' ? 'Menyelaraskan nosel pompa secara nirkabel saat sensor terdeteksi.' : 'Securely syncs nozzle parameters on insertion.', val: '13.56 MHz' },
                { title: t('dashboard.ronGrade'), desc: language === 'id' ? 'Pencocokan waktu pembakaran silinder mesin secara presisi.' : 'Matches engine timing map automatically.', val: 'Dynamic' },
                { title: language === 'id' ? 'Gerbang Otorisasi' : 'Payment Linkage', desc: language === 'id' ? 'Validasi token aktif sebelum barrier gerbang terbuka otomatis.' : 'Checks token registration before gate unlocks.', val: 'QRIS Pre-Auth' },
              ].map((item) => (
                <div key={item.title} className="p-4 bg-overlay border border-border-primary/50 rounded-2xl space-y-1">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block leading-none">{item.title}</span>
                  <span className="text-xs font-bold text-text-primary block pt-0.5">{item.val}</span>
                  <p className="text-[10px] text-text-secondary leading-relaxed font-medium pt-1">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Register Vehicle Form (Col 8 to 12) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <GlassCard title={language === 'id' ? 'Pemindai Plat Nomor' : 'License Plate Scanner'} subtitle={language === 'id' ? 'Pindai otomatis kamera telemetri' : 'Scan to auto-fill vehicle data'}>
            {/* Immersive Scan Frame with Modern Neo-Brutalist Border Focus */}
            <div className="flex flex-col items-center justify-center relative py-6 min-h-[160px] bg-overlay/30 border-2 border-black rounded-2xl shadow-[3px_3px_0px_#000] select-none mb-4 overflow-hidden">
              {/* Subtle tech focus corners */}
              <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-500" />
              <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-500" />
              <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-500" />
              <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-500" />

              {isScanning ? (
                <div className="text-center space-y-2 z-10 bg-panel-bg p-4 rounded-xl border border-border-primary shadow-xs">
                  <span className="text-xs text-emerald-500 flex items-center gap-1.5 justify-center font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {language === 'id' ? `Memindai: ${scanProgress}%` : `Scanning: ${scanProgress}%`}
                  </span>
                  <div className="font-sans font-bold text-xl text-text-primary">
                    {simulatedScannedPlate}
                  </div>
                </div>
              ) : plateNumber ? (
                <div className="text-center space-y-1.5 z-10 bg-panel-bg p-4 rounded-xl border border-emerald-500/30 shadow-xs">
                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">{language === 'id' ? 'Plat Terdeteksi' : 'Plate Captured'}</span>
                  <div className="font-sans font-bold text-2xl text-text-primary py-1.5 px-6 bg-overlay rounded-lg border border-border-primary/60">
                    {plateNumber}
                  </div>
                </div>
              ) : (
                <div className="text-center p-3">
                  <Camera className="w-8 h-8 text-text-secondary/50 mx-auto mb-2" />
                  <p className="text-[11px] text-text-secondary font-medium">
                    {language === 'id' ? 'Sejajarkan nomor plat kendaraan di area kamera' : 'Align your license plate in camera field'}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsScanning(true)}
              disabled={isScanning}
              type="button"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black dark:border-zinc-800 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none shadow-[2px_2px_0px_#000] transition-all py-3 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 uppercase tracking-wider"
            >
              <Camera className="w-4 h-4" />
              {isScanning ? (language === 'id' ? 'Memindai...' : 'Scanning...') : (language === 'id' ? 'Simulasi Pemindaian Kamera' : 'Simulate Camera Scan')}
            </button>
          </GlassCard>

          <GlassCard title={t('vehicles.addVehicle')} subtitle={language === 'id' ? 'Kirim spesifikasi fisik kendaraan armada' : 'Submit physical fleet specifications'}>
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs font-medium text-left">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVehicleType('car')}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                    vehicleType === 'car'
                      ? 'border-emerald-500 bg-emerald-500/5 text-text-primary'
                      : 'border-border-primary text-text-secondary hover:border-emerald-500/30'
                  }`}
                >
                  {language === 'id' ? 'Mobil / EV' : 'Car / EV'}
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('motorcycle')}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                    vehicleType === 'motorcycle'
                      ? 'border-emerald-500 bg-emerald-500/5 text-text-primary'
                      : 'border-border-primary text-text-secondary hover:border-emerald-500/30'
                  }`}
                >
                  {language === 'id' ? 'Sepeda Motor' : 'Motorcycle'}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest">
                  {t('vehicles.plateNumber')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. B 1234 ABC"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-overlay border border-border-primary rounded-xl py-2.5 px-4 text-sm font-sans font-bold text-text-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest">
                    {t('vehicles.brand')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tesla"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-overlay border border-border-primary rounded-xl py-2.5 px-4 text-xs font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest">
                    {t('vehicles.model')}
                  </label>
                  <input
                    type="text"
                    placeholder="Model 3"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-overlay border border-border-primary rounded-xl py-2.5 px-4 text-xs font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest">
                    {language === 'id' ? 'Preferensi BBM' : 'Preferred Fuel'}
                  </label>
                  <select
                    value={fuelPref}
                    onChange={(e) => setFuelPref(e.target.value)}
                    className="w-full bg-overlay border border-border-primary rounded-xl py-2.5 px-3 text-xs font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none transition-colors"
                  >
                    <option value="Pertamax Turbo">Pertamax Turbo (RON 98)</option>
                    <option value="Pertamax">Pertamax (RON 92)</option>
                    <option value="Pertalite">Pertalite (RON 90)</option>
                    <option value="Solar">Solar Diesel (CN 48)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest">
                    {t('vehicles.tankCapacity')}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="150"
                    value={tankCapacity}
                    onChange={(e) => setTankCapacity(Number(e.target.value))}
                    className="w-full bg-overlay border border-border-primary rounded-xl py-2.5 px-4 text-xs font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isScanning}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black dark:border-zinc-800 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none shadow-[2px_2px_0px_#000] transition-all py-3 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {language === 'id' ? 'Mendaftarkan...' : 'Registering...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {t('vehicles.registerButton')}
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        </div>

      </div>

    </div>
  );
}
