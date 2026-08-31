import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  BookOpen,
  FileText,
  BookmarkCheck,
  Search,
  Sparkles,
  Target,
  Users,
  ChevronLeft,
  ChevronRight,
  Circle,
  CheckCircle2,
  Clock,
  PlusCircle,
} from 'lucide-react';
import { Book, Chapter, FrontMatter, BackMatter } from '../../types';
import { StudioAiCopilot } from './StudioAiCopilot';
import { StudioKdpEstimator } from './StudioKdpEstimator';

export type StudioSidebarTab = 'outline' | 'copilot' | 'bible' | 'goals';

interface StudioSidebarProps {
  book: Book;
  currentChapterId: string | null;
  selectedText: string;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
  onReorderChapters: (chapters: Chapter[]) => void;
  onRenameChapter: (id: string, newTitle: string) => void;
  onDeleteChapter: (id: string) => void;
  onDuplicateChapter: (id: string) => void;
  onOpenFrontMatter: () => void;
  onOpenBackMatter: () => void;
  onInsertContent: (htmlOrText: string) => void;
  onReplaceSelection: (htmlOrText: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface SortableChapterRowProps {
  chapter: Chapter;
  isActive: boolean;
  onSelect: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleStatus: (newStatus: 'draft' | 'review' | 'final') => void;
}

const SortableChapterRow: React.FC<SortableChapterRowProps> = ({
  chapter,
  isActive,
  onSelect,
  onRename,
  onDelete,
  onDuplicate,
  onToggleStatus,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(chapter.title);

  // Status cycling: draft -> review -> final -> draft
  const status: 'draft' | 'review' | 'final' = (chapter as any).status || 'draft';

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = status === 'draft' ? 'review' : status === 'review' ? 'final' : 'draft';
    onToggleStatus(nextStatus);
  };

  const handleTitleSubmit = () => {
    if (titleDraft.trim()) {
      onRename(titleDraft.trim());
    } else {
      setTitleDraft(chapter.title);
    }
    setIsEditingTitle(false);
  };

  const words = chapter.wordCount || 0;
  const readingTimeMins = Math.max(1, Math.round(words / 200));

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`chapter-row-${chapter.id}`}
      className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all ${
        isActive
          ? 'bg-purple-50/90 dark:bg-purple-950/50 border-purple-400 dark:border-purple-600 shadow-xs ring-1 ring-purple-400/30'
          : 'bg-white dark:bg-[#1a1a2e] border-gray-200/80 dark:border-gray-800/80 hover:border-purple-200 dark:hover:border-gray-700 hover:shadow-xs'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
          title="Drag to reorder chapter"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Chapter content click target */}
        <div
          onClick={onSelect}
          className="flex-1 min-w-0 cursor-pointer text-left"
        >
          {isEditingTitle ? (
            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTitleDraft(chapter.title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="w-full text-xs font-semibold px-1.5 py-0.5 bg-white dark:bg-[#131320] border border-purple-500 rounded text-gray-900 dark:text-white focus:outline-none"
            />
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                  Ch.{chapter.order}
                </span>
                <span
                  className={`text-xs font-semibold truncate ${
                    isActive
                      ? 'text-purple-950 dark:text-purple-200 font-bold'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {chapter.title}
                </span>
              </div>

              {/* Word Count & Status Indicator */}
              <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 mt-1 pl-0.5">
                <span className="font-mono">{words.toLocaleString()} w</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{readingTimeMins}m read</span>
                </span>
                <span>·</span>
                {/* Clickable Status Badge */}
                <button
                  type="button"
                  onClick={cycleStatus}
                  title="Click to cycle status: Draft -> Review -> Final"
                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider transition-colors ${
                    status === 'final'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : status === 'review'
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    status === 'final' ? 'bg-emerald-500' : status === 'review' ? 'bg-blue-500' : 'bg-amber-500'
                  }`} />
                  <span>{status}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chapter Actions Menu */}
      <div className="relative ml-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#151525] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl py-1 z-50 text-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setIsEditingTitle(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Rename</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDuplicate();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>

              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  book,
  currentChapterId,
  selectedText,
  onSelectChapter,
  onAddChapter,
  onReorderChapters,
  onRenameChapter,
  onDeleteChapter,
  onDuplicateChapter,
  onOpenFrontMatter,
  onOpenBackMatter,
  onInsertContent,
  onReplaceSelection,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<StudioSidebarTab>('outline');
  const [searchQuery, setSearchQuery] = useState('');
  const [characterNotes, setCharacterNotes] = useState<Array<{ id: string; name: string; role: string; notes: string }>>([
    { id: '1', name: 'Protagonist', role: 'Main Character', notes: 'Determined, seeking truth behind the family secret.' },
    { id: '2', name: 'Antagonist', role: 'Opposing Force', notes: 'Calculating, controls resources and alliances.' },
  ]);
  const [newCharName, setNewCharName] = useState('');
  const [isAddingChar, setIsAddingChar] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = book.chapters.findIndex((c) => c.id === active.id);
      const newIndex = book.chapters.findIndex((c) => c.id === over.id);
      const newChapters = arrayMove(book.chapters, oldIndex, newIndex);
      onReorderChapters(newChapters);
    }
  };

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return book.chapters;
    const q = searchQuery.toLowerCase();
    return book.chapters.filter(
      (c) => c.title.toLowerCase().includes(q) || String(c.order).includes(q)
    );
  }, [book.chapters, searchQuery]);

  const totalWords = useMemo(
    () => book.chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0),
    [book.chapters]
  );

  const activeChapter = useMemo(
    () => book.chapters.find((c) => c.id === currentChapterId) || book.chapters[0] || null,
    [book.chapters, currentChapterId]
  );

  return (
    <div className="flex flex-col h-full bg-gray-50/60 dark:bg-[#131320] border-r border-gray-200 dark:border-gray-800 select-none">
      {/* 1. Sidebar Top Header & Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a2e] shrink-0">
        <div className="flex items-center justify-between px-3 pt-2.5 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 truncate">
              Studio Suite
            </span>
          </div>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Collapse sidebar (Focus Mode)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Multi-Tab Selector */}
        <div className="grid grid-cols-4 gap-0.5 px-2 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('outline')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === 'outline'
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 shadow-2xs'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
            title="Manuscript Tree & Chapters"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Outline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('copilot')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === 'copilot'
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 shadow-2xs'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
            title="AI Co-Writer Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden lg:inline">AI Copilot</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bible')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === 'bible'
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 shadow-2xs'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
            title="Characters & World Notes"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Bible</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === 'goals'
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 shadow-2xs'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
            title="KDP Specs & Word Goals"
          >
            <Target className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">KDP Goals</span>
          </button>
        </div>
      </div>

      {/* 2. TAB BODY */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* TAB 1: OUTLINE & MANUSCRIPT TREE */}
        {activeTab === 'outline' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Search Filter */}
            <div className="p-2.5 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#16162a]/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chapters..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-gray-100/70 dark:bg-[#131320] border border-gray-200/80 dark:border-gray-700/80 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Tree Items Container */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {/* Front Matter Button Item */}
              <button
                type="button"
                onClick={onOpenFrontMatter}
                className="w-full flex items-center justify-between p-2 rounded-xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-[#1a1a2e] hover:border-purple-300 dark:hover:border-purple-800 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-all text-left text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">Front Matter</div>
                    <div className="text-[10px] text-gray-400">Title, Copyright, Dedication</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">Edit</span>
              </button>

              {/* Sortable Chapter Items */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredChapters.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {filteredChapters.map((chapter) => (
                      <SortableChapterRow
                        key={chapter.id}
                        chapter={chapter}
                        isActive={chapter.id === currentChapterId}
                        onSelect={() => onSelectChapter(chapter.id)}
                        onRename={(newTitle) => onRenameChapter(chapter.id, newTitle)}
                        onDelete={() => onDeleteChapter(chapter.id)}
                        onDuplicate={() => onDuplicateChapter(chapter.id)}
                        onToggleStatus={(newStatus) => {
                          // Update chapter status in store
                          (chapter as any).status = newStatus;
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Back Matter Button Item */}
              <button
                type="button"
                onClick={onOpenBackMatter}
                className="w-full flex items-center justify-between p-2 rounded-xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-[#1a1a2e] hover:border-purple-300 dark:hover:border-purple-800 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-all text-left text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                    <BookmarkCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">Back Matter</div>
                    <div className="text-[10px] text-gray-400">Author Bio, Also by Author</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">Edit</span>
              </button>
            </div>

            {/* Bottom Add Chapter & Stats */}
            <div className="p-2.5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a2e] space-y-2 shrink-0">
              <button
                type="button"
                id="btn-sidebar-add-chapter"
                onClick={onAddChapter}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chapter</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 px-1 font-mono">
                <span>{book.chapters.length} chapters</span>
                <span>·</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{totalWords.toLocaleString()} words</span>
                <span>·</span>
                <span>~{Math.max(1, Math.ceil(totalWords / 250))} p</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI CO-WRITER COPILOT */}
        {activeTab === 'copilot' && (
          <StudioAiCopilot
            book={book}
            activeChapter={activeChapter}
            selectedText={selectedText}
            onInsertContent={onInsertContent}
            onReplaceSelection={onReplaceSelection}
          />
        )}

        {/* TAB 3: CHARACTER & WORLD BIBLE */}
        {activeTab === 'bible' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Story Characters & Lore</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAddingChar(!isAddingChar)}
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold"
              >
                + Add Note
              </button>
            </div>

            {isAddingChar && (
              <div className="p-2.5 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2">
                <input
                  type="text"
                  placeholder="Character or Location Name..."
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  className="w-full px-2 py-1 bg-white dark:bg-[#131320] border border-purple-300 dark:border-purple-700 rounded text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCharName.trim()) {
                      setCharacterNotes((prev) => [
                        ...prev,
                        { id: String(Date.now()), name: newCharName.trim(), role: 'Character', notes: 'Notes on character arc...' },
                      ]);
                      setNewCharName('');
                      setIsAddingChar(false);
                    }
                  }}
                  className="w-full py-1 bg-purple-600 text-white rounded text-[11px] font-semibold"
                >
                  Save Character Card
                </button>
              </div>
            )}

            <div className="space-y-2">
              {characterNotes.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-gray-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">{c.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-medium">
                      {c.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    {c.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: KDP GOALS & PRINT SPECS */}
        {activeTab === 'goals' && (
          <StudioKdpEstimator book={book} totalWords={totalWords} />
        )}
      </div>
    </div>
  );
};
