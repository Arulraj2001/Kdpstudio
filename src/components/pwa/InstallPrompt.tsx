import React, { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare, Zap, WifiOff, Bell, Sparkles, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('desktop');
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect Platform
    const ua = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIos) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // 3. Check 7-day dismissal cooldown in localStorage
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const daysSinceDismissal = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) {
        return; // Don't bother user yet
      }
    }

    // 4. Track Page Navigation count in sessionStorage
    const pageVisits = parseInt(sessionStorage.getItem('pwa-page-visits') || '1', 10);
    sessionStorage.setItem('pwa-page-visits', (pageVisits + 1).toString());

    const shouldTriggerNow = pageVisits >= 3;

    // Timer trigger: 30 seconds
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, shouldTriggerNow ? 2000 : 30000);

    // 5. Listen for Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (shouldTriggerNow) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
    setShowIosGuide(false);
  };

  const handleInstallClick = async () => {
    if (platform === 'ios') {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback for browsers that support install without beforeinstallprompt
      alert('To install KDP Studio: Click your browser address bar icon or menu (⋮) and select "Install KDP Studio".');
      return;
    }

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true');
        setShowPrompt(false);
      } else {
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        setShowPrompt(false);
      }
    } catch (err) {
      console.error('PWA installation error:', err);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <>
      {/* ── Desktop Corner Banner (Bottom-Right) ── */}
      <div className="hidden md:block fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="w-96 p-5 rounded-2xl bg-[#130f30]/95 backdrop-blur-md border border-purple-500/30 text-white shadow-2xl shadow-purple-950/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20 overflow-hidden">
                <img src="/brand-icon.png?v=20260831" alt="KDP Studio" className="w-full h-full object-cover rounded-lg" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
                  KDP Studio App
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/30 text-purple-200">
                    Desktop
                  </span>
                </h4>
                <p className="text-xs text-purple-200/80">Book Publishing Suite</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close install prompt"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-3 leading-relaxed">
            Install the native desktop app for 2x faster page loads, offline drafts, and quick-launch shortcuts.
          </p>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl border border-slate-700/60 hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              Not Now
            </button>
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex-1 py-2 px-3 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Install App</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Sheet (Slides up from bottom) ── */}
      <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full bg-[#130f30] border-t border-purple-500/40 rounded-t-[28px] p-6 text-white shadow-2xl animate-in slide-in-from-bottom duration-300 space-y-5">
          {/* Header Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20 overflow-hidden">
                <img src="/brand-icon.png?v=20260831" alt="KDP Studio" className="w-full h-full object-cover rounded-lg" />
              </div>
              <div>
                <h3 className="font-black text-base text-white tracking-tight leading-tight">
                  KDP Studio
                </h3>
                <p className="text-xs text-purple-300/80 font-medium">Book Publishing Suite</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1.5 rounded-full bg-white/5"
              aria-label="Dismiss install banner"
            >
              <X size={18} />
            </button>
          </div>

          {/* Message */}
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Add to your home screen for instant access
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Enjoy fullscreen writing, offline manuscript access, and desktop-grade publishing tools.
            </p>
          </div>

          {/* 3 Feature Pills */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Zap size={16} className="text-amber-300 mb-1" />
              <span className="text-[11px] font-bold text-slate-200">Faster Load</span>
            </div>
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <WifiOff size={16} className="text-indigo-300 mb-1" />
              <span className="text-[11px] font-bold text-slate-200">Works Offline</span>
            </div>
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Bell size={16} className="text-violet-300 mb-1" />
              <span className="text-[11px] font-bold text-slate-200">Job Alerts</span>
            </div>
          </div>

          {/* iOS Specific Instructions if open */}
          {showIosGuide && (
            <div className="p-4 rounded-2xl bg-purple-950/80 border border-purple-400/40 text-xs text-purple-100 space-y-2.5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Share2 size={16} className="text-purple-300" />
                <span>How to Install on iPhone / iPad:</span>
              </div>
              <ol className="space-y-1.5 list-decimal list-inside text-slate-300 text-[12px] leading-relaxed">
                <li>Tap the <strong>Share button</strong> <span className="inline-block px-1.5 py-0.5 rounded bg-white/20 text-white font-mono">⎋</span> at the bottom of Safari.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong> <span className="inline-block px-1.5 py-0.5 rounded bg-white/20 text-white">⊕</span>.</li>
                <li>Tap <strong>Add</strong> in top right corner.</li>
              </ol>
            </div>
          )}

          {/* Buttons Row */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 text-xs font-bold text-slate-400 rounded-xl border border-slate-700/80 hover:bg-slate-800/80 transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex-2 py-3 px-4 text-xs font-extrabold text-white rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download size={16} />
              <span>{platform === 'ios' ? 'Show How to Install' : 'Add to Home Screen'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
