import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useBrandStore } from '../../lib/brandStore';
import { useGeoStore } from '../../lib/geoStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, isInitialized } = useAuthStore();
  const { loadBrandKit } = useBrandStore();
  const { initPricingListener, fetchPricing } = useGeoStore();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Safety timeout: Never keep the user on the splash screen for more than 1.2 seconds
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    initPricingListener?.();
    fetchPricing?.();
  }, [initPricingListener, fetchPricing]);

  useEffect(() => {
    if (user?.uid) {
      loadBrandKit(user.uid);
    }
  }, [user?.uid, loadBrandKit]);

  if (!isInitialized && !timedOut) {
    return (
      <div 
        id="auth-provider-loading"
        className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 animate-in fade-in duration-300"
      >
        <div className="relative flex items-center justify-center mb-4">
          {/* Outer ring spinner */}
          <div className="w-16 h-16 rounded-full border-3 border-purple-100 border-t-purple-600 animate-spin" />
          
          {/* Center Logo Icon */}
          <div className="absolute w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
            <BookOpen size={16} className="text-white" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-lg font-black text-slate-900 tracking-tight">
            KDP Studio
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Initializing secure author workspace...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthProvider;
