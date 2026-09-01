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
  Clock,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
  ListChecks
} from 'lucide-react';
import { Book, Chapter } from '../../types';
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
  onDeleteMultipleChapters?: (ids: string[]) => void;
  onClearAllChapters?: () => void;
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
  isBulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onSelect: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleStatus: (newStatus: 'draft' | 'review' | 'final') => void;
}

const SortableChapterRow: React.FC<SortableChapterRowProps> = ({
  chapter,
  isActive,
  isBulkMode = false,
  isSelected = false,
  onToggleSelect,
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
  } = useSortable({ id: chapter.id, disabled: isBulkMode });

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(chapter.title);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: menuOpen ? 9999 : isDragging ? 999 : isActive ? 2 : 1,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative',
  };

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
      onClick={() => {
        if (isBulkMode && onToggleSelect) {
          onToggleSelect();
        } else {
          onSelect();
        }
      }}
      className={`group relative flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
        menuOpen ? 'z-30' : isActive ? 'z-10' : 'z-0'
      } ${
        isSelected
          ? 'bg-purple-50/90 border-purple-400 shadow-xs'
          : isActive
          ? 'bg-purple-50 border-purple-500/70 shadow-xs'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Bulk Checkbox vs Drag Handle */}
        {isBulkMode ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.();
            }}
            className="text-purple-600 focus:outline-none p-0.5"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-purple-600 fill-purple-100" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
          </button>
        ) : (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="opacity-40 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing shrink-0"
            title="Drag to reorder chapter"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Chapter Order Badge */}
        <span className="w-5 text-[11px] font-mono font-bold text-slate-400 shrink-0">
          #{chapter.order}
        </span>

        {/* Title / Renaming */}
        <div className="flex-1 min-w-0">
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
              onClick={(e) => e.stopPropagation()}
              className="w-full text-xs font-semibold px-1.5 py-0.5 rounded border border-purple-500 bg-white text-slate-900 focus:outline-none"
            />
          ) : (
            <>
              <div
                className={`text-xs truncate font-medium ${
                  isActive ? 'text-purple-950 font-bold' : 'text-slate-800'
                }`}
                title={chapter.title}
              >
                {chapter.title}
              </div>

              {/* Word count & Reading time */}
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                <span>{words.toLocaleString()} words</span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5 inline" />
                  {readingTimeMins}m
                </span>
                <span>•</span>
                {/* Clickable Status Tag */}
                <button
                  type="button"
                  onClick={cycleStatus}
                  title="Click to cycle status (Draft -> Review -> Final)"
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
                    status === 'final'
                      ? 'bg-emerald-100 text-emerald-700'
                      : status === 'review'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
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
      {!isBulkMode && (
        <div className="relative ml-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setIsEditingTitle(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
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
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
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
  onDeleteMultipleChapters,
  onClearAllChapters,
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
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);

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

  const isAllSelected = filteredChapters.length > 0 && selectedChapterIds.length === filteredChapters.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedChapterIds([]);
    } else {
      setSelectedChapterIds(filteredChapters.map((c) => c.id));
    }
  };

  const handleToggleSingleSelect = (id: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExecuteDeleteSelected = () => {
    if (onDeleteMultipleChapters && selectedChapterIds.length > 0) {
      onDeleteMultipleChapters(selectedChapterIds);
      setSelectedChapterIds([]);
      setShowDeleteSelectedConfirm(false);
      setIsBulkMode(false);
    }
  };

  const handleExecuteClearAll = () => {
    if (onClearAllChapters) {
      onClearAllChapters();
    } else if (onDeleteMultipleChapters) {
      onDeleteMultipleChapters(book.chapters.map((c) => c.id));
    }
    setSelectedChapterIds([]);
    setShowClearConfirm(false);
    setIsBulkMode(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/80 border-r border-slate-200 select-none">
      {/* 1. Sidebar Top Header & Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between px-3 pt-2.5 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 truncate">
              Studio Suite
            </span>
          </div>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'outline'
                ? 'bg-purple-100 text-purple-700 shadow-2xs font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="Manuscript Tree & Chapters"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Outline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('copilot')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'copilot'
                ? 'bg-purple-100 text-purple-700 shadow-2xs font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="AI Co-Writer Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden lg:inline">AI Copilot</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bible')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'bible'
                ? 'bg-purple-100 text-purple-700 shadow-2xs font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="Characters & World Notes"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Bible</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'goals'
                ? 'bg-purple-100 text-purple-700 shadow-2xs font-bold'
                : 'text-slate-500 hover:bg-slate-100'
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
            {/* Search & Bulk Mode Header Bar */}
            <div className="p-2.5 border-b border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chapters..."
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Bulk Select Toggle Button */}
                <button
                  type="button"
                  id="btn-toggle-bulk-chapter-manage"
                  onClick={() => {
                    setIsBulkMode(!isBulkMode);
                    setSelectedChapterIds([]);
                  }}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    isBulkMode
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-purple-600'
                  }`}
                  title={isBulkMode ? 'Exit Bulk Selection' : 'Select All / Bulk Delete Chapters'}
                >
                  <ListChecks className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bulk Mode Action Bar */}
              {isBulkMode && (
                <div className="p-2 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="font-bold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isAllSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      <span>{isAllSelected ? 'Deselect All' : 'Select All'} ({filteredChapters.length})</span>
                    </button>

                    <span className="font-semibold text-slate-600 text-[11px]">
                      {selectedChapterIds.length} selected
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-purple-100">
                    <button
                      type="button"
                      id="btn-bulk-delete-selected-chapters"
                      disabled={selectedChapterIds.length === 0}
                      onClick={() => setShowDeleteSelectedConfirm(true)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Selected ({selectedChapterIds.length})</span>
                    </button>

                    <button
                      type="button"
                      id="btn-bulk-delete-all-chapters"
                      onClick={() => setShowClearConfirm(true)}
                      className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tree Items Container */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {/* Front Matter Button Item */}
              <button
                type="button"
                onClick={onOpenFrontMatter}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/40 transition-all text-left text-xs shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-purple-100 text-purple-700">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Front Matter</div>
                    <div className="text-[10px] text-slate-400">Title, Copyright, Dedication</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-purple-600">Edit</span>
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
                        isBulkMode={isBulkMode}
                        isSelected={selectedChapterIds.includes(chapter.id)}
                        onToggleSelect={() => handleToggleSingleSelect(chapter.id)}
                        onSelect={() => onSelectChapter(chapter.id)}
                        onRename={(newTitle) => onRenameChapter(chapter.id, newTitle)}
                        onDelete={() => onDeleteChapter(chapter.id)}
                        onDuplicate={() => onDuplicateChapter(chapter.id)}
                        onToggleStatus={(newStatus) => {
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
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/40 transition-all text-left text-xs shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-purple-100 text-purple-700">
                    <BookmarkCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Back Matter</div>
                    <div className="text-[10px] text-slate-400">Author Bio, Also by Author</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-purple-600">Edit</span>
              </button>
            </div>

            {/* Bottom Add Chapter & Stats */}
            <div className="p-2.5 border-t border-slate-200 bg-white space-y-2 shrink-0">
              <button
                type="button"
                id="btn-sidebar-add-chapter"
                onClick={onAddChapter}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Chapter</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
                <span>{book.chapters.length} Chapters</span>
                <span className="font-semibold text-slate-700">{totalWords.toLocaleString()} Total Words</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI CO-WRITER COPILOT */}
        {activeTab === 'copilot' && (
          <StudioAiCopilot
            book={book}
            currentChapterId={currentChapterId}
            selectedText={selectedText}
            onInsertContent={onInsertContent}
            onReplaceSelection={onReplaceSelection}
          />
        )}

        {/* TAB 3: STORY BIBLE (Characters & Notes) */}
        {activeTab === 'bible' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cast & Lore</span>
              <button
                type="button"
                onClick={() => setIsAddingChar(!isAddingChar)}
                className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {isAddingChar && (
              <div className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
                <input
                  type="text"
                  placeholder="Character name..."
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  className="w-full p-1.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-none"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingChar(false)}
                    className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (newCharName.trim()) {
                        setCharacterNotes([
                          ...characterNotes,
                          { id: Date.now().toString(), name: newCharName.trim(), role: 'Character', notes: '' },
                        ]);
                        setNewCharName('');
                        setIsAddingChar(false);
                      }
                    }}
                    className="px-2.5 py-1 text-[11px] bg-purple-600 text-white rounded-lg font-semibold"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {characterNotes.map((char) => (
                <div key={char.id} className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{char.name}</span>
                    <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-medium">{char.role}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{char.notes || 'No description yet.'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: KDP SPECS & ESTIMATOR */}
        {activeTab === 'goals' && (
          <StudioKdpEstimator book={book} />
        )}
      </div>

      {/* Confirmation Modal: Delete Selected Chapters */}
      {showDeleteSelectedConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Delete {selectedChapterIds.length} Chapters?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete these <strong>{selectedChapterIds.length} selected chapters</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteSelectedConfirm(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-selected"
                onClick={handleExecuteDeleteSelected}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear All Chapters */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Clear All Chapters?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will remove all chapters and reset the book manuscript to a clean starting Chapter 1.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-clear-all"
                onClick={handleExecuteClearAll}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
