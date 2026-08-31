import React from 'react';

interface SectionShadowTransitionProps {
  type?: 'dark-to-light' | 'light-to-dark' | 'dark-to-white' | 'white-to-dark';
  className?: string;
}

/**
 * SectionShadowTransition
 * Generates a smooth, medium-depth atmospheric shadow & vignette gradient blend
 * between contrasting light and dark sections across all marketing pages.
 */
export const SectionShadowTransition: React.FC<SectionShadowTransitionProps> = ({
  type = 'dark-to-light',
  className = '',
}) => {
  if (type === 'dark-to-light') {
    return (
      <div className={`relative w-full h-16 sm:h-24 overflow-hidden pointer-events-none -mt-px ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-50" />
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/40 to-transparent blur-xs" />
      </div>
    );
  }

  if (type === 'dark-to-white') {
    return (
      <div className={`relative w-full h-16 sm:h-24 overflow-hidden pointer-events-none -mt-px ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/60 to-white" />
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/40 to-transparent blur-xs" />
      </div>
    );
  }

  if (type === 'light-to-dark') {
    return (
      <div className={`relative w-full h-14 sm:h-20 overflow-hidden pointer-events-none -mb-px ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-900/50 to-slate-950" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
    );
  }

  // white-to-dark
  return (
    <div className={`relative w-full h-14 sm:h-20 overflow-hidden pointer-events-none -mb-px ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-900/50 to-slate-950" />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  );
};
