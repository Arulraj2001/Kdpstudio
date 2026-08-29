import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  Sparkles,
  FileText,
  BookmarkCheck,
  Save,
  Check,
  Loader2,
  ArrowLeft,
  Settings,
  BookOpen,
  ChevronRight,
  Maximize2,
  Play,
  RotateCw,
} from 'lucide-react';
import { Book, Chapter, FrontMatter, BackMatter } from '../../types/index';
import { useBookStore } from '../../lib/store';
import { ChapterList } from './ChapterList';
import { TiptapToolbar } from './TiptapToolbar';
import { FrontMatterModal } from './FrontMatterModal';
import { BackMatterModal } from './BackMatterModal';
import { AiWriteModal } from './AiWriteModal';
import { AiImproveBubble } from './AiImproveBubble';
import { callGemini } from '../../lib/gemini';

interface ChapterStudioProps {
  bookId: string;
  onBackToDashboard: () => void;
  onNavigateToFormatter?: () => void;
}

export const ChapterStudio: React.FC<ChapterStudioProps> = ({
  bookId,
  onBackToDashboard,
  onNavigateToFormatter,
}) => {
  const books = useBookStore((state) => state.books);
  const currentBook = books.find((b) => b.id === bookId) || null;
  const updateBook = useBookStore((state) => state.updateBook);
  const addChapter = useBookStore((state) => state.addChapter);
  const updateChapter = useBookStore((state) => state.updateChapter);
  const deleteChapter = useBookStore((state) => state.deleteChapter);
  const reorderChapters = useBookStore((state) => state.reorderChapters);
  const duplicateChapter = useBookStore((state) => state.duplicateChapter);

  // Selected chapter state
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(() => {
    return currentBook?.chapters?.[0]?.id || null;
  });

  const activeChapter = currentBook?.chapters.find((c) => c.id === selectedChapterId) || currentBook?.chapters[0] || null;

  // Modals state
  const [isFrontMatterOpen, setIsFrontMatterOpen] = useState(false);
  const [isBackMatterOpen, setIsBackMatterOpen] = useState(false);
  const [isAiWriteOpen, setIsAiWriteOpen] = useState(false);

  // Save states
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<Date>(new Date());

  // AI Continue state
  const [isAiContinuing, setIsAiContinuing] = useState(false);

  // Selected text improvement bubble state
  const [selectedText, setSelectedText] = useState('');
  const [bubblePosition, setBubblePosition] = useState<{ x: number; y: number } | null>(null);

  // Editable chapter title in editor
  const [chapterTitleInput, setChapterTitleInput] = useState(activeChapter?.title || '');

  // Keep title input in sync when switching chapters
  useEffect(() => {
    if (activeChapter) {
      setChapterTitleInput(activeChapter.title);
      if (selectedChapterId !== activeChapter.id) {
        setSelectedChapterId(activeChapter.id);
      }
    }
  }, [activeChapter?.id]);

  // Initialize Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
    ],
    content: activeChapter?.content || '<p>Start writing your chapter here...</p>',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-purple max-w-none focus:outline-none min-h-[420px] px-6 py-6 text-gray-900 dark:text-gray-100 leading-relaxed font-serif text-base',
      },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved');
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        if (text.trim().length > 3) {
          setSelectedText(text);
          // Calculate screen position
          try {
            const { top, left } = editor.view.coordsAtPos(from);
            setBubblePosition({ x: left, y: top - 45 });
          } catch (e) {
            setBubblePosition(null);
          }
          return;
        }
      }
      setSelectedText('');
      setBubblePosition(null);
    },
  });

  // Load chapter content into editor when switching chapters
  useEffect(() => {
    if (editor && activeChapter) {
      const currentHtml = editor.getHTML();
      if (currentHtml !== activeChapter.content) {
        editor.commands.setContent(activeChapter.content || '<p></p>');
      }
    }
  }, [selectedChapterId, editor]);

  // Live word count
  const liveWordCount = editor
    ? editor.state.doc.textContent.split(/\s+/).filter(Boolean).length
    : 0;

  // Save chapter to store
  const handleSave = useCallback(() => {
    if (!currentBook || !activeChapter || !editor) return;
    setSaveStatus('saving');

    const html = editor.getHTML();
    updateChapter(currentBook.id, activeChapter.id, {
      title: chapterTitleInput.trim() || activeChapter.title,
      content: html,
      wordCount: liveWordCount,
    });

    setTimeout(() => {
      setSaveStatus('saved');
      setLastSavedTime(new Date());
    }, 200);
  }, [currentBook, activeChapter, editor, chapterTitleInput, liveWordCount, updateChapter]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (saveStatus === 'unsaved') {
        handleSave();
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [saveStatus, handleSave]);

  // Chapter List Actions
  const handleAddChapter = () => {
    if (!currentBook) return;
    // Save current before adding
    handleSave();
    const newChap = addChapter(currentBook.id);
    setSelectedChapterId(newChap.id);
  };

  const handleSelectChapter = (id: string) => {
    if (id === selectedChapterId) return;
    handleSave();
    setSelectedChapterId(id);
  };

  const handleRenameChapter = (id: string, newTitle: string) => {
    if (!currentBook) return;
    updateChapter(currentBook.id, id, { title: newTitle });
    if (id === selectedChapterId) {
      setChapterTitleInput(newTitle);
    }
  };

  const handleDeleteChapter = (id: string) => {
    if (!currentBook) return;
    if (currentBook.chapters.length <= 1) {
      alert('A manuscript must have at least one chapter.');
      return;
    }
    deleteChapter(currentBook.id, id);
    const remaining = currentBook.chapters.filter((c) => c.id !== id);
    if (remaining.length > 0) {
      setSelectedChapterId(remaining[0].id);
    }
  };

  const handleDuplicateChapter = (id: string) => {
    if (!currentBook) return;
    const duplicated = duplicateChapter(currentBook.id, id);
    if (duplicated) {
      setSelectedChapterId(duplicated.id);
    }
  };

  const handleReorderChapters = (newChapters: Chapter[]) => {
    if (!currentBook) return;
    reorderChapters(currentBook.id, newChapters);
  };

  // AI Continue Writing handler
  const handleAiContinue = async () => {
    if (!editor || !currentBook || isAiContinuing) return;
    setIsAiContinuing(true);

    const docText = editor.state.doc.textContent;
    const words = docText.split(/\s+/).filter(Boolean);
    const lastSnippet = words.slice(-500).join(' ');

    const prompt = `You are a bestselling author writing a ${currentBook.genre} book titled "${currentBook.title}".
Continue this chapter manuscript naturally for approximately 300 more words, maintaining the current tone, pacing, style, and narrative momentum.

Recent Manuscript Context:
"${lastSnippet || 'The story begins...'}"

Output ONLY the continuation formatted in valid HTML paragraphs (<p>...</p>) without any introductory or concluding comments.`;

    try {
      const continuation = await callGemini(
        prompt,
        'You are an elite ghostwriter generating natural literary continuations for publication.'
      );

      if (continuation && editor) {
        editor.commands.insertContent(continuation);
        setSaveStatus('unsaved');
      }
    } catch (err) {
      console.error('Failed to continue writing with AI:', err);
    } finally {
      setIsAiContinuing(false);
    }
  };

  // Accept AI Generated Chapter
  const handleAcceptAiChapter = (htmlContent: string) => {
    if (editor && currentBook && activeChapter) {
      editor.commands.setContent(htmlContent);
      handleSave();
    }
  };

  // Apply improvement from floating bubble
  const handleApplyImprovement = (improvedText: string) => {
    if (editor) {
      editor.commands.insertContent(improvedText);
      setSaveStatus('unsaved');
    }
  };

  if (!currentBook) {
    return (
      <div className="text-center py-24">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Book Not Found</h2>
        <p className="text-sm text-gray-500 mt-1 mb-4">The requested book project could not be loaded.</p>
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div id="chapter-studio-viewport" className="flex flex-col h-[calc(100vh-6rem)] -m-4 sm:-m-8 bg-white dark:bg-[#131320] overflow-hidden">
      {/* Top Action Bar */}
      <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a2e] px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 shrink-0">
              {currentBook.trimSize}
            </span>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {currentBook.title}
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Front Matter Modal Button */}
          <button
            type="button"
            id="btn-open-front-matter"
            onClick={() => setIsFrontMatterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">Front Matter</span>
          </button>

          {/* Back Matter Modal Button */}
          <button
            type="button"
            id="btn-open-back-matter"
            onClick={() => setIsBackMatterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">Back Matter</span>
          </button>

          {/* AI Write Button */}
          <button
            type="button"
            id="btn-open-ai-write"
            onClick={() => setIsAiWriteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Write Chapter</span>
          </button>

          {/* AI Continue Button */}
          <button
            type="button"
            id="btn-ai-continue-writing"
            onClick={handleAiContinue}
            disabled={isAiContinuing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white shadow-xs transition-colors"
          >
            {isAiContinuing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Continuing...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>AI Continue</span>
              </>
            )}
          </button>

          {/* Manual Save Button */}
          <button
            type="button"
            id="btn-manual-save"
            onClick={handleSave}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              saveStatus === 'saved'
                ? 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                : 'border-purple-500 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold'
            }`}
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
            ) : saveStatus === 'saved' ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Save className="w-3.5 h-3.5 text-purple-600" />
            )}
            <span className="hidden md:inline">
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Studio Body: Left Panel 30% + Right Panel 70% */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel (30% width) - Chapter List */}
        <aside className="w-72 sm:w-80 lg:w-[30%] shrink-0 h-full">
          <ChapterList
            chapters={currentBook.chapters}
            currentChapterId={selectedChapterId}
            onSelectChapter={handleSelectChapter}
            onAddChapter={handleAddChapter}
            onReorderChapters={handleReorderChapters}
            onRenameChapter={handleRenameChapter}
            onDeleteChapter={handleDeleteChapter}
            onDuplicateChapter={handleDuplicateChapter}
          />
        </aside>

        {/* Right Panel (70% width) - Editor Surface */}
        <main className="flex-1 flex flex-col h-full bg-gray-50/40 dark:bg-[#0f0f17] overflow-hidden">
          {/* Tiptap Toolbar */}
          <TiptapToolbar editor={editor} />

          {/* Chapter Title Editor Bar */}
          <div className="px-6 py-3 bg-white dark:bg-[#1a1a2e] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <input
              id="input-chapter-active-title"
              type="text"
              value={chapterTitleInput}
              onChange={(e) => {
                setChapterTitleInput(e.target.value);
                setSaveStatus('unsaved');
              }}
              onBlur={handleSave}
              placeholder="Chapter Title..."
              className="text-base sm:text-lg font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-700 focus:border-purple-500 focus:outline-none w-full max-w-xl transition-colors"
            />
          </div>

          {/* Editor Canvas Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center relative">
            <div className="w-full max-w-3xl bg-white dark:bg-[#1a1a2e] rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 min-h-[600px] flex flex-col relative">
              <EditorContent editor={editor} className="flex-1" />

              {/* Floating AI Improvement Bubble */}
              {selectedText && bubblePosition && (
                <div
                  style={{
                    position: 'fixed',
                    top: Math.max(10, bubblePosition.y),
                    left: Math.max(10, bubblePosition.x),
                  }}
                >
                  <AiImproveBubble
                    selectedText={selectedText}
                    onApplyImprovement={handleApplyImprovement}
                    onClose={() => setSelectedText('')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Editor Status Bar */}
          <footer className="h-9 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a2e] px-6 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 shrink-0">
            <div className="flex items-center gap-4">
              <span>
                {activeChapter?.title || 'Chapter'}
              </span>
              <span className="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>
              <span className="hidden sm:inline">
                Auto-saved: {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-4 font-mono">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {liveWordCount.toLocaleString()} words
              </span>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span>
                ~{Math.max(1, Math.ceil(liveWordCount / 250))} book pages ({currentBook.trimSize})
              </span>
            </div>
          </footer>
        </main>
      </div>

      {/* Front Matter Modal */}
      <FrontMatterModal
        isOpen={isFrontMatterOpen}
        onClose={() => setIsFrontMatterOpen(false)}
        frontMatter={currentBook.frontMatter}
        onSave={(updated) => updateBook(currentBook.id, { frontMatter: updated })}
      />

      {/* Back Matter Modal */}
      <BackMatterModal
        isOpen={isBackMatterOpen}
        onClose={() => setIsBackMatterOpen(false)}
        backMatter={currentBook.backMatter}
        onSave={(updated) => updateBook(currentBook.id, { backMatter: updated })}
      />

      {/* AI Write Chapter Modal */}
      <AiWriteModal
        isOpen={isAiWriteOpen}
        onClose={() => setIsAiWriteOpen(false)}
        bookTitle={currentBook.title}
        bookGenre={currentBook.genre}
        chapterTitle={activeChapter?.title || 'New Chapter'}
        onAcceptContent={handleAcceptAiChapter}
      />
    </div>
  );
};
