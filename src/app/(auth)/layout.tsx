import React from 'react';
import { BookOpen } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="auth-layout" className="min-h-screen bg-slate-50 flex items-center justify-center p-2 sm:p-4 font-sans">
      <div className="w-full max-w-6xl">
        {children}
      </div>
    </div>
  );
}
