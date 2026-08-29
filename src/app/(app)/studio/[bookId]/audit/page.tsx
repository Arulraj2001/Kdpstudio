'use client';

import React, { useState, useEffect } from 'react';
import { useBookStore } from '../../../../../lib/store';
import { ContentAuditReport } from '../../../../../types/audit';
import { FullAuditReportView } from '../../../../../components/audit/FullAuditReportView';
import { compileBasicReport } from '../../../../../lib/audit/localChecks';
import { useAuthStore } from '../../../../../lib/authStore';
import { Loader2 } from 'lucide-react';

export default function BookAuditPage() {
  const books = useBookStore((state) => state.books);
  const currentBook = useBookStore((state) => state.currentBook);
  const user = useAuthStore((state) => state.user);

  // Extract bookId from window pathname if in browser
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const match = pathname.match(/\/studio\/([^/]+)\/audit/);
  const bookId = match ? match[1] : '';

  const book = (bookId ? books.find((b) => b.id === bookId) : null) || currentBook || books[0];
  const [report, setReport] = useState<ContentAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (book) {
      const basic = compileBasicReport(book, user?.uid || 'user');
      setReport(basic);
      setIsLoading(false);
    }
  }, [book?.id]);

  if (!book || isLoading || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-sm text-slate-400 font-mono">Loading Content Audit Report...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <FullAuditReportView
        report={report}
        book={book}
        onBack={() => {
          window.location.href = '/studio';
        }}
        onRerunAudit={() => {
          const newReport = compileBasicReport(book, user?.uid || 'user');
          setReport(newReport);
        }}
      />
    </div>
  );
}
