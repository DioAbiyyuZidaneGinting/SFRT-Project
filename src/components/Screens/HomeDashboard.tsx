/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Fuel, 
  Users, 
  MapPin, 
  Sparkles, 
  Navigation as NavIcon, 
  Bell, 
  Layers, 
  Clock, 
  ArrowRight, 
  Zap, 
  RefreshCw, 
  Car,
  ChevronDown,
  Shield,
  Gauge
} from 'lucide-react';
import GlassCard from '../GlassCard';
import { Station, Vehicle, FuelType, Transaction } from '../../types';
import { useDataStore } from '../../lib/dataStore';
import { useTranslation } from '../../hooks/useTranslation';

interface HomeDashboardProps {
  userEmail: string;
  stations: Station[];
  mountedVehicle: Vehicle | null;
  activeTransaction: Transaction | null;
  fuels: FuelType[];
  onTriggerQuickRefill: () => void;
  onNavigateToScreen: (screenId: any) => void;
  onSelectStation: (station: Station) => void;
}

export function HomeDashboard({
  userEmail,
  stations,
  mountedVehicle,
  activeTransaction,
  fuels,
  onTriggerQuickRefill,
  onNavigateToScreen,
  onSelectStation,
}: HomeDashboardProps) {

  const { history } = useDataStore();
  const { t, language } = useTranslation();

  const handleStationRecommendationClick = (st: Station) => {
    onSelectStation(st);
    onNavigateToScreen('stations');
  };

  const hasLiveTransaction = activeTransaction && activeTransaction.status !== 'completed';

  const userName = userEmail.split('@')[0].toUpperCase();

  // Nearest Hub calculation
  const nearestStation = stations[0] || {
    name: 'Central Hub',
    distance: 0,
    status: 'OPEN',
    estWaitMinutes: 0,
  };

  // Dynamic values based on history
  const completedTx = history ? history.filter((tx) => tx.status === 'completed') : [];
  const totalRefuelCount = completedTx.length || 2;
  const totalLitersCount = completedTx.reduce((acc, tx) => acc + (tx.liters || 0), 0) || 48.6;
  const totalCostCount = completedTx.reduce((acc, tx) => acc + (tx.totalPrice || 0), 0) || 725000;
  const avgEfficiency = 2.45;

  return (
    <div className="flex-grow space-y-8 text-text-primary font-sans" id="home-dashboard-module">
      
      {/* Row 1: Welcome Hero Banner & Nearest Smart Hub Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Immersive Welcome Hero Banner */}
        <div className="lg:col-span-8 bg-panel-bg border border-border-primary rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 min-h-[300px]">
          {/* Subtle grid background for high-end feel */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Top Row: System Active Pill */}
          <div className="flex justify-between items-start z-10 w-full">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-600 text-[9px] font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              {language === 'id' ? 'Sistem SFRT Aktif' : 'SFRT System Active'}
            </div>
            <div className="text-[10px] text-text-secondary font-mono">
              v1.4.2 // ONLINE
            </div>
          </div>

          {/* Middle Row: Spacious Grid Layout with Profile Avatar & Sans-serif typography */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 z-10 mt-6 items-center w-full">
            <div className="sm:col-span-7 flex items-center gap-5 text-left">
              {/* Profile Avatar Container */}
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-sans font-bold text-lg shadow-sm shrink-0 select-none">
                {userName.substring(0, Math.min(userName.length, 2))}
              </div>
              <div className="space-y-1">
                <span className="font-sans font-semibold text-[10px] text-text-secondary uppercase tracking-widest block">
                  {t('dashboard.welcome')}
                </span>
                <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight leading-none uppercase">
                  {userName}
                </h1>
                <p className="text-[11px] text-text-secondary leading-normal font-medium max-w-xs mt-1">
                  {t('dashboard.subtitle')}
                </p>
              </div>
            </div>

            {/* Premium EV Sports Car - Custom Schematic SVG */}
            <div className="sm:col-span-5 relative w-full h-28 flex items-center justify-center shrink-0">
              <svg 
                viewBox="0 0 240 100" 
                className="w-full h-full stroke-text-primary stroke-[1.5] fill-none relative z-10 drop-shadow-sm hover:-translate-y-0.5 transition-transform duration-300"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Chassis Shadow / Silhouette */}
                <path 
                  d="M 40 72 C 45 72, 45 44, 75 44 L 150 44 C 165 44, 175 52, 185 72 Z"
                  className="fill-emerald-500/5 dark:fill-emerald-500/10 stroke-none" 
                />

                {/* Ground plane helper line */}
                <line x1="10" y1="72" x2="230" y2="72" className="stroke-border-primary stroke-[1]" strokeDasharray="3 3" />

                {/* Wheels */}
                <circle cx="65" cy="72" r="16" className="stroke-text-primary fill-bg-primary stroke-[1.5]" />
                <circle cx="65" cy="72" r="8" className="stroke-text-primary stroke-[1.5]" />
                <circle cx="65" cy="72" r="2.5" className="fill-text-primary" />
                <path d="M 65 56 L 65 88 M 49 72 L 81 72 M 54 61 L 76 83 M 54 83 L 76 61" className="stroke-text-primary/60 stroke-[1]" />

                <circle cx="175" cy="72" r="16" className="stroke-text-primary fill-bg-primary stroke-[1.5]" />
                <circle cx="175" cy="72" r="8" className="stroke-text-primary stroke-[1.5]" />
                <circle cx="175" cy="72" r="2.5" className="fill-text-primary" />
                <path d="M 175 56 L 175 88 M 159 72 L 191 72 M 164 61 L 186 83 M 164 83 L 186 61" className="stroke-text-primary/60 stroke-[1]" />

                {/* Chassis Car Profile Outline */}
                <path d="M 20 72 
                         L 45 72 
                         C 47 58, 83 58, 85 72
                         L 155 72 
                         C 157 58, 193 58, 195 72
                         L 220 72
                         C 225 72, 230 68, 230 62
                         C 230 55, 225 52, 218 52
                         L 208 52
                         L 202 46
                         C 196 38, 183 28, 158 28
                         L 108 28
                         C 93 28, 78 38, 68 48
                         L 48 52
                         C 36 52, 24 60, 20 72
                         Z" 
                      className="stroke-text-primary stroke-[1.5]" />

                {/* Spoiler */}
                <path d="M 218 52 L 226 38 L 210 38 L 206 46" className="stroke-text-primary stroke-[1.5]" />

                {/* Door lines and Window */}
                <path d="M 105 28 L 105 72" className="stroke-border-primary stroke-[1.5]" />
                <path d="M 148 28 L 148 72" className="stroke-border-primary stroke-[1.5]" />
                
                {/* Side windows */}
                <path d="M 110 33 L 145 33 L 145 52 L 105 52 L 105 33 Z" className="stroke-emerald-500/50 fill-emerald-500/10 dark:fill-emerald-500/20 stroke-[1.2]" />
                <path d="M 78 48 C 84 40, 94 33, 102 33 L 102 52 L 78 52 Z" className="stroke-emerald-500/50 fill-emerald-500/10 dark:fill-emerald-500/20 stroke-[1.2]" />
                <path d="M 148 33 L 160 33 C 172 33, 182 40, 186 48 L 186 52 L 148 52 Z" className="stroke-emerald-500/50 fill-emerald-500/10 dark:fill-emerald-500/20 stroke-[1.2]" />

                {/* EV Battery schematic detail under car */}
                <rect x="91" y="64" width="58" height="5" rx="1.5" className="stroke-emerald-500 fill-emerald-500/20 stroke-[1.2]" />
                <path d="M 97 66.5 L 143 66.5" className="stroke-emerald-500 stroke-[1]" />
                <circle cx="95" cy="66.5" r="0.7" className="fill-emerald-500" />
                <circle cx="145" cy="66.5" r="0.7" className="fill-emerald-500" />

                {/* Headlight and Tail light */}
                <path d="M 21 66 L 27 66" className="stroke-amber-500 stroke-[2] stroke-linecap-round" />
                <path d="M 226 58 L 229 58" className="stroke-red-500 stroke-[2] stroke-linecap-round" />
              </svg>
            </div>
          </div>

          {/* Bottom Row: Quick Refill Button (Selective Brutalist Accent CTA) */}
          <div className="mt-6 z-10 flex items-center gap-4 flex-wrap w-full">
            <button
              onClick={onTriggerQuickRefill}
              className="py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black dark:border-zinc-800 rounded-xl font-sans font-bold text-xs flex items-center gap-2 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none shadow-[2px_2px_0px_#000] transition-all tracking-wider uppercase cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              {t('dashboard.quickRefill')}
            </button>
          </div>
        </div>

        {/* Nearest Smart Hub Premium Warm Gradient Card */}
        <div 
          onClick={() => handleStationRecommendationClick(nearestStation as Station)}
          className="lg:col-span-4 bg-gradient-to-br from-orange-50/50 to-amber-50/20 dark:from-orange-950/10 dark:to-transparent border border-orange-500/10 dark:border-orange-500/20 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden hover:border-orange-500/30 transition-all duration-300 cursor-pointer group min-h-[300px]"
        >
          <div className="flex justify-between items-start z-10 w-full">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <div className="text-left space-y-0.5">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
                  {language === 'id' ? 'HUB PINTAR TERDEKAT' : 'NEAREST SMART HUB'}
                </span>
                <h3 className="font-sans font-bold text-sm tracking-wide uppercase text-text-primary mt-1">
                  {nearestStation.name.replace('SFRT - ', '')}
                </h3>
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  {nearestStation.distance} KM • {nearestStation.status}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
                {language === 'id' ? 'ESTIMASI' : 'EST. WAIT'}
              </span>
              <div className="font-sans font-extrabold text-3xl text-text-primary mt-1">
                {nearestStation.estWaitMinutes}
              </div>
              <span className="text-[8px] font-bold text-text-secondary uppercase tracking-wider block mt-0.5">
                {language === 'id' ? 'MENIT' : 'MINS'}
              </span>
            </div>
          </div>

          <div className="mt-8 z-10 flex items-center justify-between border-t border-border-primary/40 pt-4 w-full">
            <span className="text-[10px] text-text-secondary font-medium">
              {language === 'id' ? 'Sistem RFID aktif' : 'RFID checking ready'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToScreen('stations');
              }}
              className="py-2 px-3.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-600 font-sans font-bold text-[10px] rounded-xl transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              {language === 'id' ? 'Cari Peta' : 'Browse Map'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Quick Metrics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* CO2 Saved Widget */}
        <div className="bg-panel-bg border border-border-primary rounded-2xl p-5 flex items-center justify-between shadow-xs hover:shadow-sm hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
                {language === 'id' ? 'Emisi Karbon Ditekan' : 'CO2 Saved'}
              </span>
              <div className="font-display font-black text-2xl text-text-primary mt-1.5">
                -14.8%
              </div>
              <span className="text-[10px] text-text-secondary font-medium">
                {language === 'id' ? 'vs 30 hari terakhir' : 'vs last 30 days'}
              </span>
            </div>
          </div>

          {/* Green Line Sparkline */}
          <div className="w-24 h-10 shrink-0 pr-1">
            <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 30" fill="none">
              <path d="M0,25 Q15,10 30,18 T60,5 T90,15 T100,2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Total Specs Checked */}
        <div className="bg-panel-bg border border-border-primary rounded-2xl p-5 flex items-center justify-between shadow-xs hover:shadow-sm hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
                {language === 'id' ? 'Jumlah Cek Kalibrasi' : 'Total Specs Checked'}
              </span>
              <div className="font-display font-black text-2xl text-text-primary mt-1.5">
                24
              </div>
              <span className="text-[10px] text-text-secondary font-medium">
                {language === 'id' ? 'Spesifikasi Terverifikasi' : 'Specs Calibrated'}
              </span>
            </div>
          </div>

          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs shadow-emerald-500/10 mr-1">
            <Layers className="w-4.5 h-4.5" />
          </div>
        </div>

      </div>

      {/* Row 3: Active Vehicle & Carbon Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Active Vehicle (2/3 width) */}
        <div className="lg:col-span-8 bg-panel-bg border border-border-primary rounded-3xl p-6 flex flex-col justify-between shadow-xs transition-all duration-300">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="text-left space-y-0.5">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
                  {t('dashboard.activeVehicle')}
                </span>
                <h4 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  {language === 'id' ? 'Log telemetri sasis pintar' : 'Autonomous chassis telemetry'}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-emerald-600 text-[9px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {language === 'id' ? 'NFC Terkalibrasi' : 'NFC Calibrated'}
              </div>
            </div>

            {mountedVehicle ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-overlay border border-border-primary/40 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-4 text-left">
                  {/* Sports car thumbnail */}
                  <div className="w-20 h-14 bg-bg-primary rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-border-primary/40 p-1">
                    <svg 
                      viewBox="0 0 240 100" 
                      className="w-full h-full stroke-text-primary stroke-[1.5] fill-none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Ground line */}
                      <line x1="10" y1="72" x2="230" y2="72" className="stroke-border-primary stroke-[1]" />
                      
                      {/* Wheels */}
                      <circle cx="65" cy="72" r="16" className="stroke-text-primary fill-bg-primary stroke-[1.5]" />
                      <circle cx="65" cy="72" r="8" className="stroke-text-primary" />
                      <circle cx="175" cy="72" r="16" className="stroke-text-primary fill-bg-primary stroke-[1.5]" />
                      <circle cx="175" cy="72" r="8" className="stroke-text-primary" />

                      {/* Chassis */}
                      <path d="M 20 72 L 45 72 C 47 58, 83 58, 85 72 L 155 72 C 157 58, 193 58, 195 72 L 220 72 C 225 72, 230 68, 230 62 C 230 55, 225 52, 218 52 L 208 52 L 202 46 C 196 38, 183 28, 158 28 L 108 28 C 93 28, 78 38, 68 48 L 48 52 C 36 52, 24 60, 20 72 Z" className="stroke-text-primary stroke-[1.5]" />
                      
                      {/* Windows */}
                      <path d="M 110 33 L 145 33 L 145 52 L 105 52 Z" className="stroke-emerald-500/50 fill-emerald-500/10" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-base text-emerald-600 tracking-wide">
                        {mountedVehicle.plateNumber}
                      </span>
                      <span className="text-[9px] font-bold text-text-secondary bg-overlay border border-border-primary px-2 py-0.5 rounded uppercase">
                        {mountedVehicle.vehicleType === 'car' ? (language === 'id' ? 'Mobil' : 'Car') : (language === 'id' ? 'Motor' : 'Motorcycle')}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary font-medium">
                      {mountedVehicle.brand} {mountedVehicle.model} • STATUS: <span className="text-emerald-500 font-semibold uppercase">READY</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest block">
                    {language === 'id' ? 'Rekomendasi RON' : 'Fuel Code'}
                  </span>
                  <div className="font-sans font-extrabold text-3xl text-emerald-600 leading-none mt-0.5">
                    {mountedVehicle.fuelTypePreference === 'Pertamax Turbo' ? '98' : '92'}
                  </div>
                  <button 
                    onClick={() => onNavigateToScreen('vehicles')}
                    className="text-[10px] font-semibold text-text-secondary hover:text-emerald-600 transition-colors underline underline-offset-2 mt-1.5 block"
                  >
                    {language === 'id' ? 'Detail' : 'Details'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3 bg-overlay/30 border border-dashed border-border-primary rounded-2xl p-4">
                <Car className="w-8 h-8 text-text-secondary/50 mx-auto" />
                <p className="text-xs text-text-secondary font-semibold">{t('dashboard.noVehicle')}</p>
                <button
                  onClick={() => onNavigateToScreen('vehicles')}
                  className="px-4 py-2 bg-text-primary text-bg-primary hover:bg-text-secondary rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {t('vehicles.addVehicle')}
                </button>
              </div>
            )}
          </div>

          {/* Bottom specifications */}
          {mountedVehicle && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: t('dashboard.ronGrade'), val: mountedVehicle.fuelTypePreference === 'Pertamax Turbo' ? '98 RON' : '92 RON' },
                { label: language === 'id' ? 'Tipe Bahan Bakar' : 'Fuel Type', val: mountedVehicle.fuelTypePreference === 'Pertamax Turbo' ? 'TURBO' : 'GASOLINE' },
                { label: language === 'id' ? 'Kapasitas Tangki' : 'Tank Capacity', val: `${mountedVehicle.tankCapacity} L` },
                { label: language === 'id' ? 'Volume Terisi' : 'Utilized', val: '24.8 L' }
              ].map((spec) => (
                <div key={spec.label} className="p-3 bg-overlay rounded-xl border border-border-primary/50 text-left">
                  <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest block">{spec.label}</span>
                  <span className="text-xs font-bold text-text-primary mt-1 block">{spec.val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Carbon Efficiency Summary (1/3 width) */}
        <div className="lg:col-span-4 bg-panel-bg border border-border-primary rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all duration-300">
          <div className="text-left space-y-0.5">
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
              {language === 'id' ? 'Ringkasan Efisiensi Karbon' : 'Carbon Efficiency Summary'}
            </span>
            <h4 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
              {language === 'id' ? 'Metrik perhitungan lingkungan' : 'Environmental calculation metrics'}
            </h4>
          </div>

          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {/* Radial progress ring */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-border-primary/60"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray="75, 100"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest block leading-none">CO2 Saved</span>
                <span className="text-sm font-extrabold text-emerald-600 mt-0.5 block leading-none">-14.8%</span>
                <span className="text-[7px] text-text-secondary font-medium">vs last 30d</span>
              </div>
            </div>

            {/* Score rating leaf */}
            <div className="space-y-1 text-center">
              <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest block">Green Score</span>
              <div className="flex justify-center gap-0.5 text-emerald-500">
                {[1, 2, 3, 4].map((i) => (
                  <Sparkles key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
                <Sparkles className="w-3.5 h-3.5 text-text-secondary/30" />
              </div>
              <div className="text-[9px] font-bold text-text-primary mt-1">
                24 SPECS <span className="text-text-secondary font-medium">• Total Specs Checked</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Row 4: Pricing Matrix & Live Station Map & Refuel Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Price Chart Matrix (1/3 width) */}
        <div className="lg:col-span-4 bg-panel-bg border border-border-primary rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all duration-300">
          <div className="space-y-4">
            <div className="text-left space-y-0.5">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
                {language === 'id' ? 'Matriks Harga BBM Real-time' : 'Real-time Price Index'}
              </span>
              <h4 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                {language === 'id' ? 'Indeks energi dan bahan bakar terkini' : 'Real-time fuel and EN indices'}
              </h4>
            </div>

            <div className="space-y-2.5">
              {fuels.map((fuel) => {
                const isRed = fuel.name === 'Pertamax Turbo';
                return (
                  <div key={fuel.id} className="flex justify-between items-center p-3 rounded-xl bg-overlay border border-border-primary/50">
                    <div className="text-left space-y-0.5">
                      <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
                        {fuel.name.replace(' Turbo', '').substring(0, 12)}
                      </span>
                      <span className="text-[10px] font-bold text-text-primary block leading-none">
                        Rp {fuel.pricePerLiter.toLocaleString()}
                      </span>
                    </div>

                    {/* Small Graph Sparkline */}
                    <div className="w-16 h-6">
                      <svg className={`w-full h-full ${isRed ? 'text-red-500' : 'text-emerald-500'}`} viewBox="0 0 100 30" fill="none">
                        <path d="M0,25 Q20,10 40,22 T80,8 T100,18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigateToScreen('purchase')}
            className="w-full mt-6 py-2.5 bg-panel-bg border border-border-primary hover:border-emerald-500/30 text-text-primary font-sans font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <span className="uppercase tracking-wider">{language === 'id' ? 'Lihat Semua Harga' : 'View Full Price Chart'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
          </button>
        </div>

        {/* Live Station Map (1/3 width) */}
        <div className="lg:col-span-4 bg-panel-bg border border-border-primary rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all duration-300">
          <div className="space-y-4 flex-grow flex flex-col justify-between">
            <div className="text-left space-y-0.5">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
                {language === 'id' ? 'Peta Stasiun Terkini' : 'Live Station Map'}
              </span>
              <h4 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                {language === 'id' ? 'Lokasi stasiun pengisian terdekat' : 'Real-time station locator'}
              </h4>
            </div>

            {/* Futuristic map grid centerpiece preview */}
            <div className="h-40 bg-overlay rounded-2xl border border-border-primary/50 relative overflow-hidden flex items-center justify-center my-4 select-none">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808004_1px,transparent_1px),linear-gradient(to_bottom,#80808004_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
              
              {/* Radar circular sweeps */}
              <div className="absolute w-32 h-32 border border-emerald-500/10 rounded-full flex items-center justify-center animate-pulse" />
              <div className="absolute w-20 h-20 border border-emerald-500/20 rounded-full flex items-center justify-center" />
              
              {/* Pulsing map pin marker */}
              <div className="relative z-10 flex flex-col items-center">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute" />
                <MapPin className="w-6 h-6 text-emerald-500 filter drop-shadow-[0_2px_6px_rgba(16,185,129,0.3)]" />
              </div>

              {/* Float some smaller green dots */}
              <div className="absolute top-10 left-10 w-1.5 h-1.5 bg-emerald-500/80 rounded-full animate-pulse" />
              <div className="absolute bottom-12 right-12 w-2 h-2 bg-emerald-500/60 rounded-full animate-pulse" />
            </div>
          </div>

          <button
            onClick={() => onNavigateToScreen('stations')}
            className="w-full py-2.5 bg-panel-bg border border-border-primary hover:border-emerald-500/30 text-text-primary font-sans font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <span>{language === 'id' ? 'Buka Peta' : 'View Map'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
          </button>
        </div>

        {/* Today's Refuel Summary (1/3 width) */}
        <div className="lg:col-span-4 bg-panel-bg border border-border-primary rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all duration-300">
          <div className="space-y-4">
            <div className="text-left space-y-0.5">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
                {language === 'id' ? 'Ringkasan Aktivitas Refuel' : "Today's Refuel Summary"}
              </span>
              <h4 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                {language === 'id' ? 'Rangkuman aktivitas pengisian Anda' : 'Overview of your activity'}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              {[
                { label: language === 'id' ? 'Total Refuel' : 'Total Refuel', val: `${totalRefuelCount} x`, icon: Fuel },
                { label: language === 'id' ? 'Total Liter' : 'Total Liter', val: `${totalLitersCount.toFixed(1)} L`, icon: Gauge },
                { label: language === 'id' ? 'Total Biaya' : 'Total Cost', val: `Rp ${totalCostCount.toLocaleString()}`, icon: Shield },
                { label: language === 'id' ? 'Rerata Efisiensi' : 'Avg Efficiency', val: `${avgEfficiency.toFixed(2)} KM/L`, icon: Sparkles }
              ].map((card) => (
                <div key={card.label} className="p-3 bg-overlay rounded-xl border border-border-primary/50 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <card.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest block leading-none">{card.label}</span>
                  </div>
                  <span className="text-xs font-extrabold text-text-primary block truncate leading-none pt-0.5">
                    {card.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateToScreen('history')}
            className="w-full mt-6 py-2.5 bg-text-primary text-bg-primary hover:bg-text-secondary font-sans font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all uppercase tracking-wider"
          >
            <span>{language === 'id' ? 'Lihat Laporan Lengkap' : 'View Full Report'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
          </button>
        </div>

      </div>

    </div>
  );
}
