import React, { useState } from 'react';
import { X, BookOpen, Check, FileText } from 'lucide-react';
import { FrontMatter } from '../../types/index';

interface FrontMatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  frontMatter: FrontMatter;
  onSave: (updated: FrontMatter) => void;
}

export const FrontMatterModal: React.FC<FrontMatterModalProps> = ({
  isOpen,
  onClose,
  frontMatter,
  onSave,
}) => {
  const [data, setData] = useState<FrontMatter>({ ...frontMatter });

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#151525]">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <FileText className="w-5 h-5" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Configure Front Matter
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Front matter includes the introductory pages before Chapter 1. These will be formatted with roman numerals (i, ii, iii) during PDF generation.
          </p>

          {/* Toggles */}
          <div className="space-y-3 bg-gray-50 dark:bg-[#131320] p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Include Title Page (Half-title & Full title)
              </span>
              <input
                type="checkbox"
                checked={data.titlePage}
                onChange={(e) => setData({ ...data, titlePage: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Include Copyright & Disclaimer Page
              </span>
              <input
                type="checkbox"
                checked={data.copyrightPage}
                onChange={(e) => setData({ ...data, copyrightPage: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Generate Auto Table of Contents
              </span>
              <input
                type="checkbox"
                checked={data.tableOfContents}
                onChange={(e) => setData({ ...data, tableOfContents: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>
          </div>

          {/* Dedication */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              Dedication
            </label>
            <textarea
              rows={3}
              value={data.dedication}
              onChange={(e) => setData({ ...data, dedication: e.target.value })}
              placeholder="e.g. For Eleanor, who believed in the journey before the first word was written."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Preface / Foreword */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              Preface or Foreword
            </label>
            <textarea
              rows={4}
              value={data.preface}
              onChange={(e) => setData({ ...data, preface: e.target.value })}
              placeholder="Introductory remarks from the author or an invited guest writer..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#151525]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Front Matter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
