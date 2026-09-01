import React from 'react';
import { ShieldCheck, Lock, Award, EyeOff, FileCheck } from 'lucide-react';

interface AuthorIpShieldBannerProps {
  compact?: boolean;
  className?: string;
}

export const AuthorIpShieldBanner: React.FC<AuthorIpShieldBannerProps> = ({
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-900 text-xs font-semibold shadow-2xs ${className}`}
      >
        <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
        <span>100% Author IP Guarantee: Private &amp; Never Used to Train AI</span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 text-white border border-emerald-500/30 shadow-md space-y-3 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
            <Lock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                Author Security Shield
              </span>
              <span className="text-xs font-bold text-slate-300">Enterprise 256-Bit SSL</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
              100% Manuscript Intellectual Property &amp; Privacy Guarantee
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/40 self-start sm:self-auto shrink-0">
          <Award size={15} />
          <span>You Retain 100% Rights</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
        <div className="flex items-start gap-2">
          <EyeOff size={15} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-white">Zero AI Training:</strong> Your manuscripts and chapters are never used to train public AI models.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <FileCheck size={15} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-white">100% Royalties &amp; Rights:</strong> You own all text, designs, covers, and formatted files generated.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Lock size={15} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-white">Encrypted Storage:</strong> All uploaded Word, EPUB, and PDF proofs are stored in isolated encrypted cloud buckets.
          </span>
        </div>
      </div>
    </div>
  );
};
