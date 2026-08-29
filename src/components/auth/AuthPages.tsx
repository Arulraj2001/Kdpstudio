import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  RefreshCw, 
  AlertCircle,
  Zap,
  Check,
  ArrowLeft,
  Home
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { isFirebaseConfigured, auth } from '../../lib/firebase';
import { PageRoute } from '../../types';

interface AuthPagesProps {
  initialView?: 'login' | 'signup' | 'forgot-password' | 'verify-email';
  onNavigate?: (route: PageRoute) => void;
  onSuccess?: () => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialView = 'login',
  onNavigate,
  onSuccess,
}) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot-password' | 'verify-email'>(initialView);
  const { 
    user, 
    isLoading, 
    authError, 
    clearError,
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    sendPasswordReset, 
    sendVerificationEmail,
    refreshUserData,
    setDemoUser 
  } = useAuthStore();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [resetSent, setResetSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Sync initial view if prop changes
  useEffect(() => {
    setView(initialView);
    clearError();
  }, [initialView]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500', width: '33%' };
    if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-amber-500', width: '66%' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = getPasswordStrength(password);

  const handleGoogleSignIn = async () => {
    clearError();
    setSubmitting(true);
    try {
      await signInWithGoogle();
      // Let AppShell decide the route (onboarding vs dashboard) via onSuccess
      if (onSuccess) onSuccess();
      // Fallback: read fresh store state to decide route
      else if (onNavigate) {
        const { useAuthStore: _store } = await import('../../lib/authStore');
        const freshDoc = _store.getState().userDoc;
        onNavigate(freshDoc?.onboardingComplete === false ? 'onboarding' : 'dashboard');
      }
    } catch (err) {
      // Handled in store
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    clearError();
    setSubmitting(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kdp_onboarding_progress');
      }
      await setDemoUser({
        plan: 'pro',
        displayName: 'Alexander Vance',
        email: 'alexander.vance@kdpstudio.io',
        emailVerified: true,
        onboardingComplete: false,
      });
      if (onNavigate) {
        onNavigate('onboarding');
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Demo login error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    clearError();
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      // Let AppShell decide the route via onSuccess (reads fresh userDoc from store)
      if (onSuccess) onSuccess();
      else if (onNavigate) {
        const { useAuthStore: _store } = await import('../../lib/authStore');
        const freshDoc = _store.getState().userDoc;
        onNavigate(freshDoc?.onboardingComplete === false ? 'onboarding' : 'dashboard');
      }
    } catch (err) {
      // Handled in store
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      alert('Please agree to the Terms of Service & Privacy Policy');
      return;
    }

    clearError();
    setSubmitting(true);
    try {
      await signUpWithEmail(email, password, name);
      setView('verify-email');
    } catch (err) {
      // Handled in store
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    clearError();
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (err) {
      // Handled in store
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    try {
      await sendVerificationEmail();
      setResendCooldown(60);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckVerified = async () => {
    setVerifyError('');
    setSubmitting(true);
    try {
      // Force reload Firebase token to get the latest emailVerified status
      if (auth.currentUser) {
        await auth.currentUser.reload();
      }
      await refreshUserData();
      const isVerified = auth.currentUser?.emailVerified ?? user?.emailVerified ?? false;
      if (isVerified) {
        // Verified — go to onboarding for new users
        if (onSuccess) onSuccess();
        else if (onNavigate) onNavigate('onboarding');
      } else if (!isFirebaseConfigured) {
        // Preview/demo mode — allow bypass
        if (onSuccess) onSuccess();
        else if (onNavigate) onNavigate('onboarding');
      } else {
        // Not yet verified — show inline error, do NOT route away
        setVerifyError('Your email has not been verified yet. Please click the link in the email we sent you.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* Left Half: Brand & Hero Showcase (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle ambient lighting */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <BookOpen size={22} className="text-white" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  KDP Studio
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/30 text-purple-200">
                    Pro
                  </span>
                </span>
                <p className="text-xs text-purple-200/80">AI Publishing Platform</p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-8 leading-tight">
              Create, format and publish books with AI
            </h2>
            <p className="text-sm text-purple-200/90 mt-2 leading-relaxed">
              From blank page to bestselling Amazon paperback in hours, not weeks.
            </p>
          </div>

          {/* 3 Value Pillars */}
          <div className="relative z-10 my-8 space-y-4">
            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">AI-Powered Book Writing</h4>
                <p className="text-[11px] text-purple-200/70 mt-0.5">
                  Outline, draft & refine multi-chapter fiction and non-fiction.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                <Layers size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Cover Design & 300 DPI Engine</h4>
                <p className="text-[11px] text-purple-200/70 mt-0.5">
                  Automated spine calculation, barcodes, and Imagen 3 generation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">KDP-Ready PDF Export</h4>
                <p className="text-[11px] text-purple-200/70 mt-0.5">
                  Pass Amazon pre-flight check with guaranteed gutter & trim sizes.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Trust Stat */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-purple-300">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-400" />
              100% Amazon Print Compliant
            </span>
            <span>Worldwide Multi-Currency</span>
          </div>
        </div>

        {/* Right Half: Dynamic Forms (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          
          {/* Top Navigation: Back to Home */}
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={() => onNavigate ? onNavigate('home') : (window.location.href = '/')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-700 transition-colors cursor-pointer group py-1 px-2.5 rounded-lg hover:bg-slate-100/80 -ml-2.5"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform text-purple-600" />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/80">
                {view === 'login' ? 'Author Sign In' : view === 'signup' ? 'New Registration' : view === 'forgot-password' ? 'Password Reset' : 'Email Verification'}
              </span>
            </div>
          </div>

          {/* Quick Notice / Error Alert */}
          {authError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Authentication Notice: </span>
                {authError}
              </div>
            </div>
          )}

          {/* ================= 1. LOGIN VIEW ================= */}
          {view === 'login' && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome back to KDP Studio
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Sign in to access your manuscript workspace and published books.
                </p>
              </div>

              {/* 🌟 Prominent One-Click Instant Demo Login (Pro Author) */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 rounded-2xl blur-[2px] opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse" />
                <button
                  id="instant-demo-login-btn"
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={submitting || isLoading}
                  className="relative w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-purple-400/40 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-200 cursor-pointer overflow-hidden text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
                      <Sparkles size={18} className="text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-tight text-white">One-Click Instant Demo Login</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs">
                          Pro Author
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-200/80 mt-0.5">Explore full workspace with sample books & Pro features</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-purple-300 font-bold text-xs shrink-0 group-hover:translate-x-1 transition-transform pl-2">
                    <span>Enter</span>
                    <ArrowRight size={14} />
                  </div>
                </button>
              </div>

              {/* 1. Google OAuth Button */}
              <button
                id="google-signin-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting || isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs hover:shadow transition-all duration-150 disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* 2. Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                  or sign in with email
                </span>
              </div>

              {/* 3. Email & Password Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="author@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setView('forgot-password')}
                      className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Submit Sign In */}
                <button
                  id="submit-signin-btn"
                  type="submit"
                  disabled={submitting || isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-99 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switch to Sign up & Back to home */}
              <div className="flex flex-col items-center gap-2 pt-1 text-xs text-slate-500">
                <div>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setView('signup')}
                    className="font-bold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate('home') : (window.location.href = '/')}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Home size={12} />
                  <span>Return to Homepage</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= 2. SIGNUP VIEW ================= */}
          {view === 'signup' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Create your KDP Studio account
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Start drafting and formatting Amazon Kindle & Paperback books.
                </p>
              </div>

              {/* 🌟 Prominent One-Click Instant Demo Login (Pro Author) in Signup Form */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 rounded-2xl blur-[2px] opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse" />
                <button
                  id="signup-instant-demo-login-btn"
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={submitting || isLoading}
                  className="relative w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-purple-400/40 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-200 cursor-pointer overflow-hidden text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
                      <Sparkles size={16} className="text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-tight text-white">One-Click Instant Demo Login</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs">
                          Pro Author
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-200/80">Skip registration & explore all features instantly</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-purple-300 font-bold text-xs shrink-0 group-hover:translate-x-1 transition-transform pl-2">
                    <span>Enter</span>
                    <ArrowRight size={14} />
                  </div>
                </button>
              </div>

              {/* Google Button */}
              <button
                id="signup-google-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting || isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                  or register with email
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleEmailSignUp} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signup-name-input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. J. K. Morrison"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signup-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="author@example.com"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signup-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-1.5 space-y-1">
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{ width: strength.width }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Strength: <span className="font-bold text-slate-700">{strength.label}</span></span>
                        <span className="text-slate-400">Min. 6 chars</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signup-confirm-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">Passwords do not match</p>
                  )}
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-400"
                  />
                  <label htmlFor="terms-checkbox" className="text-[11px] text-slate-600 leading-tight">
                    I agree to the{' '}
                    <a href="#terms" className="text-purple-600 hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#privacy" className="text-purple-600 hover:underline">Privacy Policy</a>.
                  </label>
                </div>

                <button
                  id="submit-signup-btn"
                  type="submit"
                  disabled={submitting || isLoading || !agreeTerms || (password !== confirmPassword && Boolean(confirmPassword))}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-99 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              <div className="flex flex-col items-center gap-2 pt-1 text-xs text-slate-500">
                <div>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="font-bold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate('home') : (window.location.href = '/')}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Home size={12} />
                  <span>Return to Homepage</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= 3. FORGOT PASSWORD VIEW ================= */}
          {view === 'forgot-password' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Reset your password
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your account email and we'll send a secure password reset link.
                </p>
              </div>

              {resetSent ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <Check size={22} className="stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">
                      Check your inbox
                    </h3>
                    <p className="text-xs text-emerald-700 mt-1">
                      We've sent password reset instructions to <span className="font-bold">{email}</span>.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setResetSent(false);
                      setView('login');
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Account Email
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="author@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Sending reset link...</span>
                      </>
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ================= 4. VERIFY EMAIL VIEW ================= */}
          {view === 'verify-email' && (
            <div className="text-center space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
                <Mail size={32} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Check your inbox
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  We've sent a verification link to{' '}
                  <span className="font-bold text-slate-900">{email || user?.email || 'your email'}</span>.
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Please click the link inside to verify your account and activate cloud sync.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {/* Inline verification error */}
                {verifyError && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                    <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>{verifyError}</span>
                  </div>
                )}

                <button
                  id="verified-continue-btn"
                  type="button"
                  onClick={handleCheckVerified}
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>I've verified my email</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendCooldown > 0}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-50 transition-all"
                >
                  {resendCooldown > 0 ? (
                    <span>Resend email in {resendCooldown}s</span>
                  ) : (
                    <span>Resend verification email</span>
                  )}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setView('signup')}
                  className="text-xs font-semibold text-slate-500 hover:text-purple-600 hover:underline"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
