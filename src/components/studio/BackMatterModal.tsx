import React, { useState } from 'react';
import { X, Check, BookmarkCheck } from 'lucide-react';
import { BackMatter } from '../../types/index';

interface BackMatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  backMatter: BackMatter;
  onSave: (updated: BackMatter) => void;
}

export const BackMatterModal: React.FC<BackMatterModalProps> = ({
  isOpen,
  onClose,
  backMatter,
  onSave,
}) => {
  const [data, setData] = useState<BackMatter>({ ...backMatter });

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
            <BookmarkCheck className="w-5 h-5" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Configure Back Matter
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
            Back matter appears after your final chapter. This helps you build your reader list, cross-sell other catalog titles, and provide valuable worksheets or resources.
          </p>

          {/* About Author */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              About the Author
            </label>
            <textarea
              rows={4}
              value={data.aboutAuthor}
              onChange={(e) => setData({ ...data, aboutAuthor: e.target.value })}
              placeholder="Brief biography, credentials, social links, and author newsletter call-to-action..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Other Books */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              Also By the Author (Other Books in Catalog)
            </label>
            <textarea
              rows={3}
              value={data.otherBooks}
              onChange={(e) => setData({ ...data, otherBooks: e.target.value })}
              placeholder="List your previous titles, series order, and upcoming releases..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Resources / Links */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              Resources, Downloadables & Reader Links
            </label>
            <textarea
              rows={3}
              value={data.resources}
              onChange={(e) => setData({ ...data, resources: e.target.value })}
              placeholder="Bonus chapter download link, companion spreadsheet, bibliography or references..."
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
            <span>Save Back Matter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
