/**
 * KDP Studio — Amazon KDP CSV Report Importer Modal
 * Phase 15B
 */

import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  BookOpen,
  Plus,
} from 'lucide-react';
import { PublishedBook, ParsedKdpReport, BookPerformanceEntry } from '../../types/analytics';
import { parseKdpReportFile } from '../../lib/kdpCsvParser';
import { batchAddPerformanceEntries, addPublishedBook } from '../../lib/analyticsService';
import { useToastStore } from '../../lib/toastStore';

interface CsvImportModalProps {
  uid: string;
  publishedBooks: PublishedBook[];
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  uid,
  publishedBooks,
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedReport, setParsedReport] = useState<ParsedKdpReport | null>(null);

  // Book matching map: { csvTitle: selectedPublishedBookId | '__create__' | '__skip__' }
  const [titleMappings, setTitleMappings] = useState<Record<string, string>>({});

  // Import Progress
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [totalToImport, setTotalToImport] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.csv') && !lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xls')) {
      alert('Please upload a valid .csv or .xlsx Amazon KDP report file');
      return;
    }

    setCsvFileName(file.name);
    try {
      const report = await parseKdpReportFile(file);
      setParsedReport(report);

      // Auto-match titles if exact/partial match exists in publishedBooks
      const initialMappings: Record<string, string> = {};
      for (const title of report.bookTitles) {
        const match = publishedBooks.find(
          (b) => b.title.toLowerCase() === title.toLowerCase() || title.toLowerCase().includes(b.title.toLowerCase())
        );
        if (match) {
          initialMappings[title] = match.id;
        } else {
          initialMappings[title] = '__create__'; // default to auto-create
        }
      }
      setTitleMappings(initialMappings);
      setStep(2);
    } catch (err: any) {
      alert(err.message || 'Failed to parse report file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleStartImport = async () => {
    if (!parsedReport || !parsedReport.entries.length) return;

    setStep(3);
    setIsImporting(true);
    const rawEntries = parsedReport.entries;
    setTotalToImport(rawEntries.length);

    // Cache of newly created books for this run: { csvTitle: newBookId }
    const createdBookMap: Record<string, string> = {};
    const entriesToBatch: Omit<BookPerformanceEntry, 'id' | 'createdAt' | 'updatedAt' | 'netUnitsSold' | 'revenueUSD'>[] = [];
    let initialSkipped = 0;

    for (let i = 0; i < rawEntries.length; i++) {
      const entry = rawEntries[i];
      const titleMatch = parsedReport.bookTitles.find((t) => (entry.notes || '').includes(t)) || parsedReport.bookTitles[0] || 'KDP Title';
      const mapping = titleMappings[titleMatch] || '__create__';

      if (mapping === '__skip__') {
        initialSkipped++;
        continue;
      }

      let targetBookId = mapping;

      if (mapping === '__create__') {
        if (!createdBookMap[titleMatch]) {
          try {
            const newId = await addPublishedBook(uid, {
              uid,
              bookId: null,
              title: titleMatch,
              subtitle: '',
              author: 'KDP Author',
              asin: '',
              royaltyType: entry.royaltyType || 'paperback',
              marketplace: entry.marketplace || 'amazon-us',
              publishedDate: entry.date || new Date().toISOString().substring(0, 10),
              listPrice: 9.99,
              currency: entry.currency || 'USD',
              royaltyPlan: '70',
              pageCount: 100,
              trimSize: '8.5x11',
              amazonUrl: '',
              kdpDashboardUrl: 'https://kdp.amazon.com',
              coverImageUrl: null,
              status: 'live',
            });
            createdBookMap[titleMatch] = newId;
          } catch (err) {
            console.warn('Auto-create book failed during report import:', err);
          }
        }
        targetBookId = createdBookMap[titleMatch];
      }

      if (targetBookId && targetBookId !== '__skip__') {
        entriesToBatch.push({
          uid,
          bookId: targetBookId,
          date: entry.date || new Date().toISOString().substring(0, 10),
          week: entry.date ? `${entry.year}-W01` : '2026-W01',
          month: entry.month || new Date().toISOString().substring(0, 7),
          year: entry.year || new Date().getFullYear(),
          marketplace: entry.marketplace || 'amazon-us',
          royaltyType: entry.royaltyType || 'paperback',
          unitsSold: entry.unitsSold || 0,
          unitsReturned: entry.unitsReturned || 0,
          grossRevenue: entry.grossRevenue || 0,
          royaltyEarned: entry.royaltyEarned || 0,
          currency: entry.currency || 'USD',
          bsr: entry.bsr || null,
          categoryRank: null,
          categoryName: null,
          kenpPageReads: entry.kenpPageReads || 0,
          kenpRoyalty: entry.kenpRoyalty || 0,
          entryMethod: 'import',
          notes: entry.notes || `Imported via KDP Report`,
        });
      } else {
        initialSkipped++;
      }
    }

    // High-speed Firestore batch ingestion with deterministic deduplication
    const batchResult = await batchAddPerformanceEntries(uid, entriesToBatch);
    setImportedCount(batchResult.added);
    setSkippedCount(initialSkipped + batchResult.skipped);
    setIsImporting(false);
    useToastStore.getState().addToast({
      message: `Successfully imported ${batchResult.added} KDP sales entries (${initialSkipped + batchResult.skipped} duplicate/skipped records)! 📊`,
      type: 'success',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Import KDP Royalty Report</h2>
              <p className="text-xs text-slate-400">
                Upload your official Amazon KDP royalty CSV or Excel (.xlsx) report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: FILE UPLOAD */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-file-input')?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-3xl p-8 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-purple-950/10 flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-800 text-purple-400 flex items-center justify-center">
                <UploadCloud size={28} />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  Drop your KDP royalty report here
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  or <span className="text-purple-400 underline font-semibold">browse files</span> (.csv or .xlsx)
                </span>
              </div>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </div>

            {/* Step-by-step download instructions */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block text-purple-400">
                💡 How to download your KDP report:
              </span>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                <li>Log in to <strong className="text-white">kdp.amazon.com</strong></li>
                <li>Navigate to <strong className="text-white">Reports ➔ Royalties / Historical</strong></li>
                <li>Select your desired date range (e.g. Last 90 Days or Year to Date)</li>
                <li>Click <strong className="text-white">Download (.csv or .xlsx)</strong></li>
                <li>Upload the generated file here</li>
              </ol>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & BOOK MATCHING */}
        {step === 2 && parsedReport && (
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Entries</span>
                <span className="text-base font-extrabold text-white block mt-0.5">
                  {parsedReport.entries.length} rows
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Net Units Sold</span>
                <span className="text-base font-extrabold text-emerald-400 block mt-0.5 font-mono">
                  {parsedReport.totalUnits}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Estimated Royalties</span>
                <span className="text-base font-extrabold text-purple-400 block mt-0.5 font-mono">
                  ${parsedReport.totalRevenue}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Unique Titles</span>
                <span className="text-base font-extrabold text-white block mt-0.5 font-mono">
                  {parsedReport.bookTitles.length} books
                </span>
              </div>
            </div>

            {/* Warnings Alert Box */}
            {parsedReport.warnings.length > 0 && (
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle size={14} className="text-amber-400" />
                  <span>Report Warnings ({parsedReport.warnings.length})</span>
                </div>
                <p className="text-[11px] text-amber-200/80">
                  {parsedReport.warnings[0]}
                </p>
              </div>
            )}

            {/* Book Matching Section */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <BookOpen size={14} className="text-purple-400" />
                <span>Map CSV Titles to Analytics Catalog</span>
              </h3>

              <div className="space-y-2">
                {parsedReport.bookTitles.map((csvTitle) => (
                  <div
                    key={csvTitle}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <span className="font-bold text-white line-clamp-1">{csvTitle}</span>
                      <span className="text-[11px] text-slate-400">From KDP CSV</span>
                    </div>

                    <select
                      value={titleMappings[csvTitle] || '__create__'}
                      onChange={(e) =>
                        setTitleMappings((prev) => ({
                          ...prev,
                          [csvTitle]: e.target.value,
                        }))
                      }
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none max-w-xs"
                    >
                      <option value="__create__">✨ Create New Book in Catalog</option>
                      <option value="__skip__">🚫 Skip (Do not import)</option>
                      {publishedBooks.map((b) => (
                        <option key={b.id} value={b.id}>
                          📖 Match to: {b.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleStartImport}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>Import {parsedReport.entries.length} Sales Entries</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PROGRESS & COMPLETE */}
        {step === 3 && (
          <div className="p-8 text-center space-y-5">
            {isImporting ? (
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full border-3 border-purple-500 border-t-transparent animate-spin mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-white">Importing KDP Sales Data...</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Processing entry {importedCount + skippedCount} of {totalToImport}
                  </p>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 max-w-md mx-auto">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-emerald-400 transition-all duration-200"
                    style={{
                      width: `${totalToImport > 0 ? Math.round(((importedCount + skippedCount) / totalToImport) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-3xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Import Complete!</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Successfully recorded <strong className="text-emerald-400">{importedCount} sales entries</strong> into your analytics database.
                  </p>
                  {skippedCount > 0 && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ({skippedCount} entries skipped as requested)
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      onImportComplete();
                      onClose();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    View Analytics Dashboard →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
