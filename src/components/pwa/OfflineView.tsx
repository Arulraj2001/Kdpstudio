import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, XCircle, Sparkles, BookOpen, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

interface OfflineViewProps {
  onRetry?: () => void;
}

export const OfflineView: React.FC<OfflineViewProps> = ({ onRetry }) => {
  const [countdown, setCountdown] = useState<number>(10);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    // 1. Listen for browser coming back online
    const handleOnline = () => {
      if (onRetry) {
        onRetry();
      } else {
        window.location.reload();
      }
    };

    window.addEventListener('online', handleOnline);

    // 2. 10-second countdown auto-retry
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Check connection
          if (navigator.onLine) {
            handleOnline();
          }
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [onRetry]);

  const handleManualRetry = () => {
    setIsChecking(true);
    if (navigator.onLine) {
      if (onRetry) onRetry();
      else window.location.reload();
    } else {
      setTimeout(() => {
        setIsChecking(false);
        setCountdown(10);
      }, 600);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0718] text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="max-w-xl w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Glowing Offline Icon */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-purple-600/30 rounded-full blur-2xl animate-pulse pointer-events-none" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-900/90 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-2xl mx-auto">
            <WifiOff size={48} className="text-purple-300" />
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <span>● No Internet Connection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            You're Currently Offline
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-md mx-auto leading-relaxed">
            Your connection was interrupted. The app shell is cached, and your existing data is safe.
          </p>
        </div>

        {/* Feature Capabilities Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* Works Offline */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={15} />
              <span>Available Offline</span>
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span> Reading saved manuscripts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span> Viewing your book library
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span> Reviewing local analytics
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span> Previewing cover templates
              </li>
            </ul>
          </div>

          {/* Requires Internet */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <XCircle size={15} />
              <span>Requires Connection</span>
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <li className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">✕</span> Gemini 2.0 AI chapter drafting
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">✕</span> 300 DPI PDF & EPUB export
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">✕</span> Cloud syncing & backups
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">✕</span> Live Amazon niche metrics
              </li>
            </ul>
          </div>
        </div>

        {/* Retry Actions & Auto-retry countdown */}
        <div className="space-y-4 pt-2">
          <button
            onClick={handleManualRetry}
            disabled={isChecking}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 mx-auto cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? 'Checking Connection...' : 'Check Connection Now'}</span>
          </button>

          <p className="text-xs text-slate-400">
            Auto-reconnecting in <span className="font-mono text-purple-300 font-bold">{countdown}s</span>...
          </p>
        </div>
      </div>
    </div>
  );
};
