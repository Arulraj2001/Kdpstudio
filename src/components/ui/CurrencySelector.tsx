import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe, Sparkles, RefreshCw } from 'lucide-react';
import { useGeoStore } from '../../lib/geoStore';
import { Currency, SUPPORTED_CURRENCIES } from '../../lib/geo';

export const CurrencySelector: React.FC = () => {
  const { 
    currency, 
    manualOverride, 
    setCurrencyManually, 
    resetToAutoDetection, 
    location,
    isDetecting 
  } = useGeoStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCurrencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === currency) || SUPPORTED_CURRENCIES[1];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Currency) => {
    setCurrencyManually(code);
    setIsOpen(false);
  };

  return (
    <div id="currency-selector-container" className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="currency-selector-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 border border-slate-200 transition-all duration-150 active:scale-98 focus:outline-none focus:ring-2 focus:ring-purple-400"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={manualOverride ? 'Manual currency selection' : `Auto-detected from ${location?.countryName || 'your location'}`}
      >
        <span className="text-sm leading-none">{activeCurrencyInfo.flag}</span>
        <span className="font-bold text-slate-900 tracking-tight">{activeCurrencyInfo.code}</span>
        
        {/* Subtle status tag */}
        <span className={`hidden sm:inline-block text-[9px] px-1 py-0.2 rounded font-medium ${
          manualOverride 
            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
        }`}>
          {manualOverride ? 'Manual' : 'Auto'}
        </span>

        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="currency-dropdown-menu"
          className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-white shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 focus:outline-none"
        >
          {/* Header */}
          <div className="px-3.5 py-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Select Currency
              </span>
              {!manualOverride ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  <Sparkles size={10} />
                  <span>Auto-detected</span>
                </span>
              ) : (
                <button
                  onClick={() => {
                    resetToAutoDetection();
                    setIsOpen(false);
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                  title="Reset to auto IP detection"
                >
                  <RefreshCw size={9} className={isDetecting ? 'animate-spin' : ''} />
                  <span>Reset Auto</span>
                </button>
              )}
            </div>
            {location?.countryName && (
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Globe size={11} className="text-slate-400" />
                <span>Detected in {location.countryName} ({location.country})</span>
              </div>
            )}
          </div>

          {/* Currencies List */}
          <div className="py-1">
            {SUPPORTED_CURRENCIES.map((curr) => {
              const isSelected = curr.code === currency;
              return (
                <button
                  key={curr.code}
                  onClick={() => handleSelect(curr.code)}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    isSelected 
                      ? 'bg-purple-50 text-purple-900 font-semibold' 
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{curr.flag}</span>
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">
                        {curr.code} <span className="text-slate-400 font-normal">({curr.symbol})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {curr.label}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={14} className="text-purple-600 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 mt-1 border-t border-slate-100 bg-slate-50/70 text-[10px] text-slate-500">
            Payment gateways will dynamically adapt to chosen currency.
          </div>
        </div>
      )}
    </div>
  );
};
