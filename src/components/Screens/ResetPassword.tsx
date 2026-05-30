import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Eye, EyeOff, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ==========================================
// PASSWORD STRENGTH CALCULATOR
// ==========================================
function getStrength(password: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string; width: string } {
  if (!password) return { score: 0, label: '', color: '', width: '0%' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map = [
    { score: 0 as const, label: '', color: '', width: '0%' },
    { score: 1 as const, label: 'Weak', color: 'bg-red-500', width: '25%' },
    { score: 2 as const, label: 'Fair', color: 'bg-yellow-500', width: '50%' },
    { score: 3 as const, label: 'Strong', color: 'bg-brand-emerald', width: '75%' },
    { score: 4 as const, label: 'Very Strong', color: 'bg-brand-emerald', width: '100%' },
  ];
  return map[score];
}

function getValidations(password: string, confirm: string) {
  return [
    { label: 'Minimum 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter (A–Z)', met: /[A-Z]/.test(password) },
    { label: 'Number (0–9)', met: /[0-9]/.test(password) },
    { label: 'Special character (!@#$...)', met: /[^A-Za-z0-9]/.test(password) },
    { label: 'Passwords match', met: password.length > 0 && password === confirm },
  ];
}

// ==========================================
// RESET PASSWORD PAGE
// ==========================================
export function ResetPasswordPage() {
  const navigate = useNavigate();

  // Session states
  const [sessionStatus, setSessionStatus] = useState<'checking' | 'ready' | 'invalid'>('checking');

  // Form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const strength = getStrength(newPassword);
  const validations = getValidations(newPassword, confirmPassword);
  const allValid = validations.every((v) => v.met);

  // ── Listen for Supabase PASSWORD_RECOVERY event ──
  useEffect(() => {
    // Check for an existing recovery session first (page reload case)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionStatus('ready');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionStatus('ready');
      } else if (event === 'SIGNED_OUT' && sessionStatus !== 'ready') {
        setSessionStatus('invalid');
      }
    });

    // Timeout fallback — if no event fires in 8s, mark invalid
    const timeout = setTimeout(() => {
      setSessionStatus((prev) => prev === 'checking' ? 'invalid' : prev);
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // ── Countdown redirect after success ──
  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) { navigate('/auth', { replace: true }); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [success, countdown, navigate]);

  // ── Submit handler ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError('');

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setSubmitError(error.message || 'Failed to update password. Please try again.');
      setIsSubmitting(false);
      return;
    }

    setSuccess(true);
    setIsSubmitting(false);
  };

  // ── LOADING / CHECKING STATE ──
  if (sessionStatus === 'checking') {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-6 p-6 font-sans text-text-primary">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-emerald/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-brand-emerald rounded-full animate-pulse" />
            <span className="font-display font-semibold tracking-wider text-text-primary">SFRT</span>
          </div>
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-brand-emerald/10" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-emerald animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-sm">Verifying Recovery Session</p>
            <p className="text-xs text-text-secondary">Establishing secure connection...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── INVALID / EXPIRED SESSION ──
  if (sessionStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-6 p-6 font-sans text-text-primary">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-emerald/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-5 max-w-sm text-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2.5 bg-brand-emerald rounded-full" />
            <span className="font-display font-semibold tracking-wider text-text-primary">SFRT</span>
          </div>
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-red-500 tracking-wide">Recovery Link Expired</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              This recovery link is invalid or has expired. Recovery links are valid for 60 minutes.
            </p>
          </div>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="w-full bg-brand-emerald text-white py-3 rounded-xl text-xs font-sans font-semibold uppercase tracking-wider hover:scale-[1.01] transition-all shadow-xs"
          >
            Request New Recovery Link
          </button>
        </div>
      </div>
    );
  }

  // ── SUCCESS STATE ──
  if (success) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-6 p-6 font-sans text-text-primary">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-emerald/5 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 flex flex-col items-center gap-5 max-w-sm w-full text-center"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-brand-emerald rounded-full animate-pulse" />
            <span className="font-display font-semibold tracking-wider text-text-primary">SFRT</span>
          </div>

          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-brand-emerald/10 animate-ping opacity-45" />
            <div className="absolute inset-0 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-brand-emerald" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold text-lg text-brand-emerald">Password Updated</h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Your access credentials have been updated successfully.
            </p>
          </div>

          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="w-full bg-brand-emerald text-white py-3 rounded-xl text-xs font-sans font-semibold uppercase tracking-wider hover:scale-[1.01] transition-all shadow-xs"
          >
            Sign In ({countdown}s)
          </button>
        </motion.div>
      </div>
    );
  }

  // ── MAIN RESET FORM ──
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center p-6 font-sans" id="reset-password-module">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-emerald/5 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-md space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2.5">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-brand-emerald rounded-full animate-pulse" />
            <span className="font-display font-semibold tracking-wider text-text-primary">SFRT</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-brand-emerald">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Secure Driver Recovery</span>
          </div>
          <h1 className="font-display font-semibold text-2xl text-text-primary">
            Set New Password
          </h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            Create a strong new password for your SFRT account.
          </p>
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-xs flex items-center gap-3 shadow-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary ml-1">
              New Password
            </label>
            <div className="relative group">
              <Key className="absolute left-4 top-3.5 w-4 h-4 text-text-secondary group-focus-within:text-brand-emerald transition-colors" />
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-panel-bg border border-border-primary rounded-xl py-3 pl-11 pr-11 text-xs text-text-primary placeholder-text-secondary/50 focus:border-brand-emerald/40 focus:outline-none transition-all shadow-xs"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-3.5 text-text-secondary hover:text-brand-emerald transition-colors cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength bar */}
            {newPassword && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5 px-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-text-secondary font-medium uppercase tracking-wider">Strength</span>
                  <span className={`font-semibold tracking-wider ${
                    strength.score <= 1 ? 'text-red-500' :
                    strength.score === 2 ? 'text-yellow-500' : 'text-brand-emerald'
                  }`}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-1 bg-border-primary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${strength.color}`}
                    initial={{ width: '0%' }}
                    animate={{ width: strength.width }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary ml-1">
              Confirm Password
            </label>
            <div className="relative group">
              <Key className="absolute left-4 top-3.5 w-4 h-4 text-text-secondary group-focus-within:text-brand-emerald transition-colors" />
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-panel-bg border rounded-xl py-3 pl-11 pr-11 text-xs text-text-primary placeholder-text-secondary/50 focus:outline-none transition-all shadow-xs ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-border-primary focus:border-brand-emerald/40'
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-3.5 text-text-secondary hover:text-brand-emerald transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Validation checklist */}
          {newPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-panel-bg border border-border-primary rounded-xl p-4 space-y-2.5 shadow-xs"
            >
              {validations.map((v) => (
                <div key={v.label} className="flex items-center gap-2.5">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                    v.met ? 'bg-brand-emerald/10 border-brand-emerald' : 'bg-transparent border-border-primary'
                  }`}>
                    {v.met && <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />}
                  </div>
                  <span className={`text-[11px] font-medium transition-colors ${v.met ? 'text-brand-emerald' : 'text-text-secondary'}`}>
                    {v.label}
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!allValid || isSubmitting}
            className="w-full bg-brand-emerald text-white font-sans font-semibold py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer mt-4 shadow-sm"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            {isSubmitting ? 'Securing...' : 'Update Password'}
          </button>
        </form>

        <p className="text-center text-[10px] text-text-secondary font-medium tracking-wide">
          This recovery session expires in 60 minutes from when the link was sent.
        </p>
      </motion.div>
    </div>
  );
}
