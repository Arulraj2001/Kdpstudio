import React, { useState } from 'react';
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
} from 'lucide-react';
import { Chapter } from '../../types/index';

interface ChapterListProps {
  chapters: Chapter[];
  currentChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
  onReorderChapters: (chapters: Chapter[]) => void;
  onRenameChapter: (id: string, newTitle: string) => void;
  onDeleteChapter: (id: string) => void;
  onDuplicateChapter: (id: string) => void;
}

interface SortableChapterItemProps {
  chapter: Chapter;
  isActive: boolean;
  onSelect: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const SortableChapterItem: React.FC<SortableChapterItemProps> = ({
  chapter,
  isActive,
  onSelect,
  onRename,
  onDelete,
  onDuplicate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(chapter.title);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: menuOpen ? 9999 : isDragging ? 999 : isActive ? 2 : 1,
    opacity: isDragging ? 0.7 : 1,
    position: 'relative',
  };

  const handleTitleSubmit = () => {
    if (titleDraft.trim()) {
      onRename(titleDraft.trim());
    } else {
      setTitleDraft(chapter.title);
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`chapter-item-${chapter.id}`}
      className={`group relative flex items-center justify-between p-2.5 rounded-lg border transition-all ${
        menuOpen ? 'z-30' : isActive ? 'z-10' : 'z-0'
      } ${
        isActive
          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500/60 dark:border-purple-600 shadow-xs'
          : 'bg-white dark:bg-[#1a1a2e] border-gray-200/80 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Chapter content click target */}
        <div
          onClick={onSelect}
          className="flex-1 min-w-0 cursor-pointer text-left py-0.5"
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
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                  {chapter.order}
                </span>
                <span
                  className={`text-xs font-semibold truncate ${
                    isActive
                      ? 'text-purple-950 dark:text-purple-200'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {chapter.title}
                </span>
              </div>
              <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 pl-6">
                {chapter.wordCount.toLocaleString()} words
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chapter Actions Menu */}
      <div className="relative ml-2">
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
              className="fixed inset-0 z-30"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#151525] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl py-1 z-40 text-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setIsEditingTitle(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
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
                className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
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

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  currentChapterId,
  onSelectChapter,
  onAddChapter,
  onReorderChapters,
  onRenameChapter,
  onDeleteChapter,
  onDuplicateChapter,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex((c) => c.id === active.id);
      const newIndex = chapters.findIndex((c) => c.id === over.id);
      const newChapters = arrayMove(chapters, oldIndex, newIndex);
      onReorderChapters(newChapters);
    }
  };

  const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-[#131320] border-r border-gray-200 dark:border-gray-800">
      {/* Header info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Table of Chapters</span>
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'} · {totalWords.toLocaleString()} total words
          </p>
        </div>
      </div>

      {/* Chapters Sortable Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={chapters.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {chapters.map((chapter) => (
              <SortableChapterItem
                key={chapter.id}
                chapter={chapter}
                isActive={chapter.id === currentChapterId}
                onSelect={() => onSelectChapter(chapter.id)}
                onRename={(newTitle) => onRenameChapter(chapter.id, newTitle)}
                onDelete={() => onDeleteChapter(chapter.id)}
                onDuplicate={() => onDuplicateChapter(chapter.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add Chapter Button */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a2e]">
        <button
          type="button"
          id="btn-add-new-chapter"
          onClick={onAddChapter}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 rounded-lg text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Chapter</span>
        </button>
      </div>
    </div>
  );
};
