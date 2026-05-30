/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Key, Mail, Cpu, User, CreditCard, ChevronRight, CheckCircle, Car, X } from 'lucide-react';
import GlassCard from '../GlassCard';
import { Vehicle } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

// ==========================================
// 1. SPLASH SCREEN COMPONENT
// ==========================================
interface SplashScreenProps {
  onDismiss: () => void;
}

export function SplashScreen({ onDismiss }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const { t, language } = useTranslation();

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => onDismiss(), 600);
          return 100;
        }
        return prev + 1.25;
      });
    }, 25);

    return () => clearInterval(timer);
  }, [onDismiss]);

  return (
    <div className="absolute inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden" id="splash-module">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-emerald/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-emerald/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* HUD Telemetry Top */}
      <div className="absolute top-6 left-6 right-6 flex justify-between font-mono text-[9px] text-zinc-500 tracking-wider">
        <span>{language === 'id' ? 'Sistem Boot: Aktif' : 'System Boot: Active'}</span>
        <span>Version 1.0.0</span>
      </div>

      <div className="relative flex flex-col items-center max-w-sm w-full gap-8 z-10">
        {/* Futuristic Glowing Fuel Nozzle Logo Layout */}
        <div className="relative">
          {/* Pulsing Backlight */}
          <div className="absolute inset-0 bg-brand-emerald/10 rounded-full blur-2xl animate-pulse" />
          
          <svg className="w-24 h-24 stroke-brand-emerald fill-none" viewBox="0 0 100 100">
            {/* Outer Tech Ring */}
            <circle cx="50" cy="50" r="45" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="1" strokeDasharray="3, 3" />
            <circle cx="50" cy="50" r="42" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1.5" strokeDasharray="120, 60" />
            
            {/* Inner Hex */}
            <path d="M50 20 L76 35 L76 65 L50 80 L24 65 L24 35 Z" strokeWidth="1" stroke="rgba(16, 185, 129, 0.3)" />
            
            {/* Core Sleek Lightning Bolt and Tank */}
            <path d="M45 35 L58 45 L42 55 L55 65" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M40 32 L40 28 Q50 22 60 28 L60 32 M35 72 L65 72" strokeWidth="1.5" strokeLinecap="round" />
          </svg>

          {/* Micro Orbit Nodes */}
          <span className="absolute top-0 right-2 w-2 h-2 bg-brand-emerald rounded-full animate-ping" />
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <h1 className="font-display font-semibold text-3xl tracking-[0.2em] text-white">
            SFRT
          </h1>
          <p className="font-sans text-[10px] text-brand-emerald tracking-[0.3em] uppercase font-semibold">
            Super Fast Refueling Technology
          </p>
          <p className="font-sans text-xs text-zinc-400 tracking-wide max-w-[280px] mx-auto mt-2 leading-relaxed">
            {language === 'id' 
              ? 'Mengalibrasi komponen sistem, tautan hambatan optik AI, dan buku besar transaksi digital.'
              : 'Calibrating system components, AI optical barrier links, and digital transaction ledger.'}
          </p>
        </div>

        {/* Startup Progress Indicator */}
        <div className="w-full space-y-2.5 mt-4">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-zinc-500">{language === 'id' ? 'Memulai Sistem' : 'Initializing System'}</span>
            <span className="text-brand-emerald font-semibold">{Math.floor(progress)}%</span>
          </div>
          
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/40">
            <div
              className="h-full bg-brand-emerald transition-all duration-75 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Micro Logs footer */}
        <div className="w-full font-mono text-[9px] text-zinc-500 text-left bg-zinc-950 border border-zinc-800/40 p-3 rounded-xl max-h-[70px] overflow-hidden leading-relaxed shadow-inner">
          <div>&gt; BARRIER ACCESS PROTOCOLS [OK]</div>
          {progress > 30 && <div>&gt; PAYMENT GATEWAY LINKED [OK]</div>}
          {progress > 65 && <div>&gt; VEHICLE TELEMETRY SYNC [OK]</div>}
          {progress > 85 && <div>&gt; SYSTEM ACTIVE. ENGAGING INTERFACE.</div>}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. AUTHENTICATION (LOGIN/REGISTER/SOCIAL)
// ==========================================
import { useAuthStore } from '../../lib/authStore';
import { supabase } from '../../lib/supabase';

interface AuthPagesProps {
  onSuccess: (userEmail: string) => void;
}

export function AuthPages({ onSuccess }: AuthPagesProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const forgotInputRef = useRef<HTMLInputElement>(null);

  const { signIn, signUp, signInWithGoogle, requestPasswordReset, error, isLoading, clearError } = useAuthStore();
  const [localError, setLocalError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const { t, language } = useTranslation();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password || (isRegister && (!fullName || !phoneNumber))) {
      setLocalError(language === 'id' ? 'Harap isi semua kredensial akses.' : 'Please fill in all access credentials.');
      return;
    }

    if (isRegister) {
      const { success, needsEmailConfirmation } = await signUp(email, password, fullName, phoneNumber);
      if (success) {
        if (needsEmailConfirmation) {
          setVerificationSent(true);
        } else {
          onSuccess(email);
        }
      }
    } else {
      const success = await signIn(email, password);
      if (success) {
        onSuccess(email);
      }
    }
  };

  const handleForgotPasswordToggle = () => {
    setShowForgotPassword(true);
    setLocalError('');
    setTimeout(() => forgotInputRef.current?.focus(), 80);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col md:flex-row transition-colors duration-300 font-sans text-left" id="auth-module">
      {/* Left panel: Brand Visual (Hidden on Mobile/Tablet, balanced flex split on Desktop) */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-12 border-r border-border-primary relative bg-panel-bg overflow-hidden shadow-sm text-left">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-emerald/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Header HUD */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-2.5 h-2.5 bg-brand-emerald rounded-full animate-ping" />
          <span className="font-display font-semibold tracking-wider text-text-primary text-sm">SFRT Network</span>
        </div>

        {/* Feature Highlights display */}
        <div className="space-y-8 relative z-10 my-auto max-w-lg text-left">
          <div>
            <span className="text-xs font-semibold text-brand-emerald uppercase tracking-wider">{language === 'id' ? 'Platform Ekosistem' : 'Ecosystem Platform'}</span>
            <h2 className="font-display font-semibold text-3xl lg:text-4xl leading-tight text-text-primary mt-2">
              {language === 'id' ? 'Masa Depan Pengisian BBM Hadir di Sini' : 'The Future of Fueling is Here'}
            </h2>
            <p className="text-text-secondary text-sm mt-4 leading-relaxed">
              {language === 'id' 
                ? 'Tanpa antrean pembayaran manual. Cukup berkendara masuk, nosel otomatis kami mendeteksi parameter BBM secara instan melalui simulasi logika, dan membuka pintu gerbang penghalang dalam 0,8 detik.'
                : 'No manual checkout queues. Drive in, our automatic nozzle detects fuel parameters immediately through logic simulations, and unlocks barrier gates in 0.8 seconds.'}
            </p>
          </div>

          <div className="space-y-5 pt-6 border-t border-border-primary text-left">
            {[
              { 
                id: '01', 
                title: language === 'id' ? 'Gerbang Otomatis' : 'Automatic Gates', 
                desc: language === 'id' ? 'Simulasi pengecekan plat nomor visual saat kedatangan.' : 'Simulated visual plate checking on arrival.' 
              },
              { 
                id: '02', 
                title: language === 'id' ? 'Pembayaran QRIS Terjadwal' : 'Timed QRIS Payments', 
                desc: language === 'id' ? 'Pembuatan token pembayaran aman yang terikat langsung ke pompa.' : 'Secure payment token generation tied directly to pumps.' 
              },
              { 
                id: '03', 
                title: language === 'id' ? 'Rekomendasi Oktan' : 'Recommended Octane', 
                desc: language === 'id' ? 'Mengoptimalkan performa puncak mesin melalui telemetri mekanis.' : 'Optimizes peak mechanical health engine telemetry.' 
              }
            ].map((feat) => (
              <div key={feat.id} className="flex gap-4 items-start text-left">
                <div className="w-8 h-8 rounded-lg border border-brand-emerald/20 bg-brand-emerald/10 flex items-center justify-center text-brand-emerald text-xs font-semibold shrink-0 shadow-xs">
                  {feat.id}
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-sm text-text-primary">{feat.title}</h4>
                  <p className="text-xs text-text-secondary mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Secure Banner */}
        <div className="flex items-center gap-2 text-xs text-text-secondary relative z-10 font-medium">
          <Shield className="w-4 h-4 text-brand-emerald" />
          <span>{language === 'id' ? 'Dilekatkan dengan enkripsi ujung-ke-ujung' : 'Secured with end-to-end encryption'}</span>
        </div>
      </div>

      {/* Right panel: Active Registration Form (Full width mobile, stacked desktop) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 relative z-10 bg-bg-primary overflow-y-auto w-full min-h-screen md:min-h-0 text-left">
        <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8 text-left">
          
          {/* Header Mobile Logo */}
          <div className="md:hidden flex flex-col items-center mb-6">
            <div className="font-display text-3xl font-semibold text-text-primary tracking-wide flex items-center gap-2 justify-center">
              <span className="w-2.5 h-2.5 bg-brand-emerald rounded-full shadow-sm" />
              SFRT
            </div>
            <span className="text-[10px] text-brand-emerald font-semibold uppercase tracking-wider mt-1.5">Super Fast Refueling Tech</span>
          </div>

          {/* Form Header */}
          <div className="text-center md:text-left">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
              {verificationSent 
                ? (language === 'id' ? 'Verifikasi Diperlukan' : 'Verification Required') 
                : isRegister 
                  ? (language === 'id' ? 'Daftar Akun' : 'Create Account') 
                  : (language === 'id' ? 'Masuk' : 'Sign In')}
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed">
              {verificationSent 
                ? (language === 'id' ? 'Tautan verifikasi telah dikirim ke kotak masuk email Anda. Silakan verifikasi untuk mengaktifkan akun SFRT Anda.' : 'A verification link has been sent to your email inbox. Please verify to activate your SFRT account.') 
                : isRegister 
                  ? (language === 'id' ? 'Daftarkan kendaraan Anda untuk mengotomatiskan kode akses penghalang pintu gerbang.' : 'Register your vehicle to automate the fueling barrier codes.') 
                  : (language === 'id' ? 'Akses dasbor kendaraan cerdas Anda dan token bahan bakar digital terintegrasi.' : 'Access your smart vehicle dashboard and linked digital fuel tokens.')}
            </p>
          </div>

          {displayError && !verificationSent && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-xs font-sans flex items-center gap-3 shadow-xs text-left">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" />
              {displayError}
            </div>
          )}

          {verificationSent ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-panel-bg border border-border-primary rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center space-y-4 shadow-sm"
            >
              <div className="w-14 h-14 rounded-full bg-brand-emerald/10 flex items-center justify-center mb-2">
                <Mail className="w-6 h-6 text-brand-emerald" />
              </div>
              <h3 className="font-display font-semibold text-base text-brand-emerald">
                {language === 'id' ? 'Email Berhasil Dikirim' : 'Email Sent Successfully'}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {language === 'id' 
                  ? `Kami telah mengirim tautan aman ke ${email}. Periksa folder spam Anda jika tidak kunjung tiba.`
                  : `We've sent a secure link to ${email}. Check your spam folder if it doesn't arrive.`}
              </p>
              
              <div className="flex flex-col gap-3 mt-6 w-full">
                <button
                  onClick={async () => {
                    setLocalError('');
                    const { error } = await supabase.auth.resend({ type: 'signup', email });
                    if (error) setLocalError(error.message);
                    else alert(language === 'id' ? 'Email verifikasi telah dikirim ulang!' : 'Verification email resent!');
                  }}
                  className="w-full bg-brand-emerald text-white py-2.5 rounded-xl text-xs font-sans font-medium transition-all hover:scale-[1.01] shadow-xs cursor-pointer"
                >
                  {language === 'id' ? 'Kirim ulang email verifikasi' : 'Resend verification email'}
                </button>
                <button
                  onClick={() => {
                    setVerificationSent(false);
                    setIsRegister(false);
                    setLocalError('');
                    clearError();
                  }}
                  className="w-full bg-panel-bg border border-border-primary hover:border-brand-emerald/30 text-text-primary py-2.5 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer"
                >
                  {language === 'id' ? 'Kembali ke halaman masuk' : 'Return to sign in'}
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Core Interactive Credentials Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
                <AnimatePresence mode="popLayout">
                  {isRegister && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      className="space-y-4 text-left"
                    >
                      <div className="space-y-1.5 text-left">
                        <label className="block text-xs font-semibold text-text-secondary ml-1">{language === 'id' ? 'Nama Lengkap Pengemudi' : 'Driver Full Name'}</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-3.5 w-4 h-4 text-text-secondary group-focus-within:text-brand-emerald transition-colors" />
                          <input
                            type="text"
                            placeholder="e.g. Diandra Abiyyu"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-panel-bg border border-border-primary rounded-xl py-3 pl-11 pr-4 text-xs font-sans text-text-primary placeholder-text-secondary/50 focus:border-brand-emerald/40 focus:outline-none transition-all shadow-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="block text-xs font-semibold text-text-secondary ml-1">{language === 'id' ? 'Nomor Telepon Aman' : 'Secure Phone Number'}</label>
                        <div className="relative group">
                          <span className="absolute left-4 top-3.5 text-text-secondary text-xs group-focus-within:text-brand-emerald transition-colors">+62</span>
                          <input
                            type="tel"
                            placeholder="812 3456 7890"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full bg-panel-bg border border-border-primary rounded-xl py-3 pl-12 pr-4 text-xs font-sans text-text-primary placeholder-text-secondary/50 focus:border-brand-emerald/40 focus:outline-none transition-all shadow-xs"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-text-secondary ml-1">{language === 'id' ? 'Alamat Email Aman' : 'Secure Email Address'}</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-text-secondary group-focus-within:text-brand-emerald transition-colors" />
                    <input
                      type="email"
                      placeholder="e.g. driver@sfrt.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-panel-bg border border-border-primary rounded-xl py-3 pl-11 pr-4 text-xs font-sans text-text-primary placeholder-text-secondary/50 focus:border-brand-emerald/40 focus:outline-none transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-text-secondary ml-1">Password</label>
                  <div className="relative group">
                    <Key className="absolute left-4 top-3.5 w-4 h-4 text-text-secondary group-focus-within:text-brand-emerald transition-colors" />
                    <input
                      type="password"
                      placeholder="••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-panel-bg border border-border-primary rounded-xl py-3 pl-11 pr-4 text-xs font-sans text-text-primary placeholder-text-secondary/50 focus:border-brand-emerald/40 focus:outline-none transition-all shadow-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-emerald text-white font-sans font-medium transition-all hover:scale-[1.01] py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50 disabled:hover:scale-100 shadow-sm uppercase font-bold tracking-wider"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Cpu className="w-4 h-4" />
                  )}
                  {isRegister ? (language === 'id' ? 'Daftar' : 'Create account') : (language === 'id' ? 'Masuk' : 'Sign in')}
                </button>
              </form>

              {/* Forgot Password link — only show on login mode */}
              {!isRegister && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleForgotPasswordToggle}
                    className="text-xs font-sans text-text-secondary hover:text-brand-emerald transition-colors tracking-wide underline underline-offset-2 cursor-pointer"
                  >
                    {language === 'id' ? 'Lupa password?' : 'Forgot password?'}
                  </button>
                </div>
              )}

              {/* Inline Forgot Password Form */}
              <AnimatePresence>
                {showForgotPassword && !forgotSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="bg-panel-bg border border-border-primary rounded-2xl p-5 space-y-4 shadow-sm text-left"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
                      <span className="text-[10px] text-brand-emerald uppercase tracking-wider font-semibold">{language === 'id' ? 'Pemulihan Identitas' : 'Identity Recovery'}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {language === 'id' 
                        ? 'Masukkan email terdaftar Anda. Kami akan mengirimkan tautan pemulihan jika akun ditemukan.'
                        : 'Enter your registered email. We will send a recovery link if an account exists.'}
                    </p>
                    <div className="space-y-1.5 text-left">
                      <label className="block text-[11px] font-sans font-semibold text-text-secondary ml-1">{language === 'id' ? 'Email Pemulihan' : 'Recovery Email'}</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 w-4 h-4 text-text-secondary group-focus-within:text-brand-emerald transition-colors" />
                        <input
                          ref={forgotInputRef}
                          type="email"
                          placeholder="e.g. driver@sfrt.io"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full bg-panel-bg border border-border-primary rounded-xl py-3 pl-11 pr-4 text-xs font-sans text-text-primary placeholder-text-secondary/50 focus:border-brand-emerald/40 focus:outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!forgotEmail) return;
                          setForgotLoading(true);
                          await requestPasswordReset(forgotEmail);
                          setForgotLoading(false);
                          setForgotSent(true);
                        }}
                        disabled={!forgotEmail || forgotLoading}
                        className="flex-1 bg-brand-emerald text-white py-2.5 rounded-xl text-xs font-sans font-medium uppercase tracking-wider hover:scale-[1.01] transition-all disabled:opacity-40 disabled:hover:scale-100 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        {forgotLoading ? (
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        {language === 'id' ? 'Kirim Tautan' : 'Send Recovery Link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowForgotPassword(false); setForgotEmail(''); }}
                        className="px-4 bg-panel-bg border border-border-primary hover:border-brand-emerald/30 text-text-secondary py-2.5 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer shadow-xs"
                      >
                        {language === 'id' ? 'Batal' : 'Cancel'}
                      </button>
                    </div>
                  </motion.div>
                )}
                {showForgotPassword && forgotSent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-panel-bg border border-border-primary rounded-2xl p-6 flex flex-col items-center text-center space-y-3 shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-full bg-brand-emerald/10 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-brand-emerald" />
                    </div>
                    <h4 className="font-display font-semibold text-sm text-brand-emerald">
                      {language === 'id' ? 'Tautan Pemulihan Dikirim' : 'Recovery Link Dispatched'}
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {language === 'id' 
                        ? `Jika akun ditemukan untuk ${forgotEmail}, sebuah tautan pemulihan telah dikirim. Periksa kotak masuk email Anda.`
                        : `If an account exists for ${forgotEmail}, a recovery link has been sent. Check your inbox.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail(''); }}
                      className="mt-2 text-xs font-sans font-semibold text-brand-emerald hover:underline transition-colors cursor-pointer"
                    >
                      {language === 'id' ? 'Kembali ke halaman masuk' : 'Back to login'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Switch Register/Login */}
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setLocalError('');
                    clearError();
                    setShowForgotPassword(false);
                    setForgotSent(false);
                  }}
                  className="text-xs sm:text-sm font-semibold text-brand-emerald hover:text-brand-emerald/80 transition-colors tracking-wide cursor-pointer"
                >
                  {isRegister 
                    ? (language === 'id' ? 'Sudah memiliki akun? Masuk' : 'Already registered? Sign in') 
                    : (language === 'id' ? 'Pengemudi baru? Buat akun' : 'New driver? Create account')}
                </button>
              </div>

              {/* Google OAuth — Single provider */}
              <div className="space-y-4 pt-6 sm:pt-8 border-t border-border-primary w-full text-left">
                <div className="relative flex justify-center text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                  <span className="bg-bg-primary px-4 relative z-10">
                    {language === 'id' ? 'Lanjutkan dengan Google' : 'Continue with Google'}
                  </span>
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-primary"></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-panel-bg border border-border-primary hover:border-brand-emerald/30 hover:bg-brand-emerald/5 text-text-primary py-3.5 rounded-xl text-xs font-sans font-semibold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group shadow-xs"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-brand-emerald border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  <span className="group-hover:text-brand-emerald transition-colors">
                    {isLoading 
                      ? (language === 'id' ? 'Mengalihkan ke Google...' : 'Redirecting to Google...') 
                      : (language === 'id' ? 'Masuk dengan Google' : 'Sign in with Google')}
                  </span>
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// ==========================================
// 14. PROFILE & SETTINGS PAGE
// ==========================================
interface ProfileSettingsPageProps {
  userEmail: string;
  savedVehicles: Vehicle[];
  onAddVehicleTrigger: () => void;
  onLogout: () => void;
  onDeleteVehicle: (id: string) => void;
  isLoadingVehicles?: boolean;
}

export function ProfileSettingsPage({
  userEmail,
  savedVehicles,
  onAddVehicleTrigger,
  onLogout,
  onDeleteVehicle,
  isLoadingVehicles = false
}: ProfileSettingsPageProps) {
  const [notifyPreferences, setNotifyPreferences] = useState({
    smartGateAlert: true,
    fuelPriceFluctuation: true,
    instantPaymentSummary: true,
    nearbyStationDetect: false,
  });

  return (
    <div className="flex-1 space-y-6 text-text-primary font-sans" id="profile-settings-module">
      
      {/* 2-Column Responsive Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Driver Credentials Panel */}
        <div className="space-y-6">
          <GlassCard title="Driver Certificate" subtitle="Secured RFID Link">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-brand-emerald/10 flex items-center justify-center text-brand-emerald text-base font-semibold">
                {userEmail.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1 text-left">
                <span className="text-[10px] text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded-full font-semibold">
                  Authenticated Driver
                </span>
                <h3 className="font-semibold text-sm text-text-primary">
                  {userEmail.split('@')[0]}
                </h3>
                <p className="text-xs text-text-secondary">{userEmail}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-text-secondary">
              <div className="flex justify-between p-3 rounded-xl bg-overlay border border-border-primary/50">
                <span>Token Status</span>
                <span className="text-text-primary font-semibold">Active</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-overlay border border-border-primary/50">
                <span>NFC ID Band</span>
                <span className="text-brand-emerald font-semibold">#NFC-8392-LIDAR</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-overlay border border-border-primary/50">
                <span>Last Calibration</span>
                <span className="text-text-primary font-semibold">Today, {new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full mt-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-sans font-semibold rounded-xl text-xs transition-all cursor-pointer border border-red-500/10"
            >
              Sign out
            </button>
          </GlassCard>

          {/* Connected Virtual Wallets / Direct Linkages */}
          <GlassCard title="Payment Methods" subtitle="Secure electronic transaction gateways">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border-primary rounded-xl bg-panel-bg hover:border-brand-emerald/30 transition-all shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1e293b] flex items-center justify-center font-semibold text-brand-emerald text-xs">
                    QR
                  </div>
                  <div className="space-y-0.5 text-left">
                    <h4 className="font-semibold text-xs text-text-primary">QRIS Instant Pay</h4>
                    <span className="text-[11px] text-text-secondary">Link standard bank accounts or credit cards</span>
                  </div>
                </div>
                <span className="text-[10px] text-brand-emerald bg-brand-emerald/10 px-2.5 py-0.5 rounded-full font-semibold">Active</span>
              </div>

              <div className="flex items-center justify-between p-4 border border-border-primary rounded-xl bg-panel-bg hover:border-brand-emerald/30 transition-all shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-900/10 border border-sky-500/20 flex items-center justify-center font-semibold text-sky-500 text-xs">
                    DN
                  </div>
                  <div className="space-y-0.5 text-left">
                    <h4 className="font-semibold text-xs text-text-primary">Dana SpeedPay</h4>
                    <span className="text-[11px] text-text-secondary">Pre-authorized fuel limits</span>
                  </div>
                </div>
                <span className="text-[10px] text-text-secondary bg-overlay px-2.5 py-0.5 rounded-full font-semibold border border-border-primary cursor-pointer hover:border-brand-emerald/30 transition-colors">Connect</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Active Fleet & Notification Node preferences */}
        <div className="space-y-6">
          <GlassCard
            title="Registered Vehicles"
            subtitle={`${savedVehicles.length} vehicles verified`}
            headerAction={
              <button
                onClick={onAddVehicleTrigger}
                className="bg-brand-emerald hover:bg-brand-emerald/90 text-white px-3 py-1.5 rounded-xl text-xs font-sans font-semibold cursor-pointer shadow-xs"
              >
                Add Vehicle
              </button>
            }
          >
            {isLoadingVehicles ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 border border-border-primary rounded-xl bg-panel-bg flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-border-primary rounded-md shrink-0" />
                    <div className="space-y-2 w-full text-left">
                      <div className="h-4 bg-border-primary rounded w-1/3" />
                      <div className="h-2 bg-border-primary rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : savedVehicles.length === 0 ? (
              <div className="text-center py-8 space-y-3 border border-dashed border-border-primary rounded-xl">
                <Car className="w-10 h-10 text-text-secondary/30 mx-auto" />
                <p className="text-xs text-text-secondary font-medium">No registered vehicle plates found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="p-4 border border-border-primary rounded-xl bg-panel-bg flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-overlay border border-border-primary rounded-xl text-text-secondary shrink-0">
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 text-left">
                        <p className="text-xs font-semibold text-text-primary">
                          {vehicle.vehicleType.toUpperCase()} • <span className="text-brand-emerald font-bold">{vehicle.plateNumber}</span>
                        </p>
                        <p className="text-[11px] text-text-secondary">
                          {vehicle.brand} {vehicle.model} • {vehicle.fuelTypePreference} • {vehicle.tankCapacity}L Max
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteVehicle(vehicle.id)}
                      className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold border border-red-500/20 rounded-xl cursor-pointer transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Alerts & Notifications */}
          <GlassCard title="System Notifications" subtitle="Manage driver dashboard preferences">
            <div className="space-y-5">
              {Object.entries(notifyPreferences).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5 text-left">
                    <h5 className="font-semibold text-xs text-text-primary capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}
                    </h5>
                    <p className="text-[11px] text-text-secondary">
                      Receive alerts on status changes and summaries
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
                      value ? 'bg-brand-emerald' : 'bg-zinc-800'
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
        </div>

      </div>
    </div>
  );
}
