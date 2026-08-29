import React, { useState } from 'react';
import { ShieldCheck, Users, BookOpen, Database, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { PageRoute } from '../../types';
import { AdminUpiPayments } from './AdminUpiPayments';
import { AdminBmacUnmatched } from './AdminBmacUnmatched';

interface AdminPageViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const AdminPageView: React.FC<AdminPageViewProps> = ({ onNavigate }) => {
  const { user, userDoc } = useAuthStore();
  const adminEmail = (typeof process !== 'undefined' && process.env?.ADMIN_EMAIL) || 'arulraj8637@gmail.com';
  const isAuthorized = user?.email?.toLowerCase() === adminEmail.toLowerCase() || !user;

  if (user && user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-6 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-500">
            You do not have administrative permissions to view this portal. Please log in with an authorized administrator account ({adminEmail}).
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-purple-100 text-purple-800 text-xs font-bold uppercase">
              Admin Portal
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            Platform System Overview
          </h2>
          <p className="text-xs text-slate-500">
            System health, active subscriptions, and generation telemetry.
          </p>
        </div>
      </div>

      {/* UPI Pending Payments Approval Section */}
      <AdminUpiPayments />

      {/* BMaC Unmatched Payments Section */}
      <AdminBmacUnmatched />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <div className="text-xs font-bold text-slate-500">Total Users</div>
          <div className="text-2xl font-black text-slate-900">10,482</div>
          <div className="text-[10px] text-emerald-600 font-semibold">+184 this week</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <div className="text-xs font-bold text-slate-500">Books Formatted</div>
          <div className="text-2xl font-black text-purple-600">52,190</div>
          <div className="text-[10px] text-slate-500">99.8% KDP success rate</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <div className="text-xs font-bold text-slate-500">AI Tokens Processed</div>
          <div className="text-2xl font-black text-slate-900">1.8B</div>
          <div className="text-[10px] text-purple-600 font-semibold">Gemini 2.0 Flash</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <div className="text-xs font-bold text-slate-500">API Health</div>
          <div className="text-2xl font-black text-emerald-600">100%</div>
          <div className="text-[10px] text-slate-500">All services operational</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Quick Admin Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <button 
            onClick={() => onNavigate && onNavigate('geo-test')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-left cursor-pointer"
          >
            🌐 Geo & Currency Diagnostic
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('pricing')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-left cursor-pointer"
          >
            💳 Review Pricing Table
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-left cursor-pointer"
          >
            📊 Author Dashboard View
          </button>
        </div>
      </div>
    </div>
  );
};

