import React from 'react';
import { BookOpen } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="auth-layout" className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Minimal Header */}
      <header className="p-6 flex items-center justify-center sm:justify-start max-w-7xl mx-auto w-full">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <BookOpen size={18} className="stroke-[2.2]" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            KDP<span className="text-purple-600">Studio</span>
          </span>
        </a>
      </header>

      {/* Main Form Centerpiece */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-6 text-center text-xs text-slate-400">
        © 2026 KDP Studio. All rights reserved.
      </footer>
    </div>
  );
}
