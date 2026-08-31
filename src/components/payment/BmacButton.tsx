import React from 'react';
import { Coffee, Zap, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useGeoStore } from '../../lib/geoStore';

export type BmacButtonVariant = 'support' | 'credits' | 'lifetime';

interface BmacButtonProps {
  variant?: BmacButtonVariant;
  coffees?: number;
  className?: string;
  showNotice?: boolean;
  onClick?: () => void;
}

export const BmacButton: React.FC<BmacButtonProps> = ({
  variant = 'support',
  coffees,
  className = '',
  showNotice = true,
  onClick,
}) => {
  const { user } = useAuthStore();
  const { pricingTable, pricingOverrides } = useGeoStore();

  const lifetimeUsd = pricingOverrides?.lifetime || pricingTable?.lifetime?.USD || 129;
  const lifetimeCoffees = Math.ceil(lifetimeUsd / 3) || 43;

  const rawBmacUrl = 
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BMAC_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BMAC_URL) ||
    'https://buymeacoffee.com/x4kqsD0lkA';

  // Determine coffee count and label based on variant
  let targetCoffees = coffees || 1;
  let title = 'Buy Me a Coffee';
  let subtitle = 'Support KDP Studio development';
  let badgeText = '$6 / coffee';
  let Icon = Coffee;

  if (variant === 'credits') {
    targetCoffees = coffees || 1;
    title = 'Buy 50 Bonus AI Credits';
    subtitle = 'Never expires • Extends daily generation quotas';
    badgeText = '$6 (1 Coffee)';
    Icon = Zap;
  } else if (variant === 'lifetime') {
    targetCoffees = coffees || lifetimeCoffees;
    title = 'Get Lifetime Pro Access';
    subtitle = 'One-time payment • Permanent unlimited access';
    badgeText = `$${lifetimeUsd} (${targetCoffees} Coffees)`;
    Icon = Sparkles;
  }

  // Construct target link
  const targetUrl = new URL(rawBmacUrl);
  if (targetCoffees > 1 && !targetUrl.searchParams.has('coffees')) {
    targetUrl.searchParams.set('coffees', targetCoffees.toString());
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <a
        id={`bmac-btn-${variant}`}
        href={targetUrl.toString()}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="group relative flex flex-col justify-between p-4 sm:p-5 bg-gradient-to-br from-[#FFDE02] via-[#FFD700] to-[#FBBF24] text-slate-950 rounded-2xl font-bold transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-amber-300/80 text-left cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Icon size={20} className="text-black" />
          </div>
          <span className="shrink-0 bg-slate-950 text-[#FFDE02] text-xs font-black px-3 py-1 rounded-full shadow-xs tracking-tight">
            {badgeText}
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-sm sm:text-base font-black leading-snug flex items-center gap-1.5 text-slate-950">
            <span>{title}</span>
            <ExternalLink size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
          <p className="text-xs font-medium text-slate-900/80 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </a>

      {showNotice && (
        <div className="flex items-start gap-1.5 px-1 text-[11px] text-slate-500">
          <ShieldCheck size={13} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Crucial:</strong> Use your KDP account email{' '}
            <span className="text-slate-800 font-bold underline">
              ({user?.email || 'your account email'})
            </span>{' '}
            on the checkout page so your credits/plan activate automatically.
          </span>
        </div>
      )}
    </div>
  );
};
