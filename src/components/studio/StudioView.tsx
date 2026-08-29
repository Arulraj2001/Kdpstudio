import React, { useState } from 'react';
import { useBookStore } from '../../lib/store';
import { NewBookForm } from './NewBookForm';
import { ChapterStudio } from './ChapterStudio';
import { BookPlus, BookOpen, Layers, ArrowLeft } from 'lucide-react';

interface StudioViewProps {
  initialBookId?: string | null;
  onNavigateToRoute?: (route: any) => void;
}

export const StudioView: React.FC<StudioViewProps> = ({ initialBookId, onNavigateToRoute }) => {
  const books = useBookStore((state) => state.books);
  const currentBook = useBookStore((state) => state.currentBook);
  const setCurrentBook = useBookStore((state) => state.setCurrentBook);

  // If there are no books yet or user is creating a new one, show setup form
  const [isCreatingNew, setIsCreatingNew] = useState(() => books.length === 0);
  const [activeBookId, setActiveBookId] = useState<string | null>(() => {
    if (initialBookId) return initialBookId;
    if (currentBook) return currentBook.id;
    if (books.length > 0) return books[0].id;
    return null;
  });

  const handleBookCreated = (newBookId: string) => {
    setActiveBookId(newBookId);
    setCurrentBook(newBookId);
    setIsCreatingNew(false);
  };

  if (isCreatingNew || books.length === 0 || !activeBookId) {
    return (
      <div className="space-y-6">
        {books.length > 0 && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setActiveBookId(books[0].id);
                setCurrentBook(books[0].id);
                setIsCreatingNew(false);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Current Manuscript ({books[0].title})</span>
            </button>
          </div>
        )}
        <NewBookForm onBookCreated={handleBookCreated} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick switcher if multiple books exist */}
      {books.length > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-[#1a1a2e] px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Switch Project:</span>
            <select
              value={activeBookId}
              onChange={(e) => {
                setActiveBookId(e.target.value);
                setCurrentBook(e.target.value);
              }}
              className="px-2.5 py-1 bg-gray-50 dark:bg-[#131320] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.trimSize}, {b.genre})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline font-semibold"
          >
            <BookPlus className="w-3.5 h-3.5" />
            <span>+ New Book</span>
          </button>
        </div>
      )}

      <ChapterStudio
        bookId={activeBookId}
        onBackToDashboard={() => {
          if (onNavigateToRoute) {
            onNavigateToRoute('dashboard');
          }
        }}
      />
    </div>
  );
};
