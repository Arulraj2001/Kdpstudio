import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

export const UpdatePrompt: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      setShowUpdate(true);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Also check for waiting worker on page load
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) {
        setShowUpdate(true);
      }
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300 max-w-sm w-full p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-400/50 text-white shadow-2xl shadow-purple-950/80">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
            <RefreshCw size={16} className="animate-spin text-amber-300" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">App Update Available</h4>
            <p className="text-[11px] text-purple-200/80">A new version of KDP Studio is ready.</p>
          </div>
        </div>
        <button
          onClick={() => setShowUpdate(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/10 flex justify-end">
        <button
          onClick={handleReload}
          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw size={12} />
          <span>Refresh App</span>
        </button>
      </div>
    </div>
  );
};
