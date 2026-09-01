import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Book, 
  Chapter, 
  FrontMatter, 
  BackMatter, 
  KDPMetadata, 
  TrimSize, 
  PaperType, 
  BookStatus,
  UserSettings 
} from '../types/index';
import { useBrandStore } from './brandStore';
import { formatCopyrightText } from './brandService';

export const DEFAULT_FRONT_MATTER: FrontMatter = {
  titlePage: true,
  copyrightPage: true,
  dedication: 'For all the creators and storytellers who bring imagination into the physical world.',
  tableOfContents: true,
  preface: '',
};

export const DEFAULT_BACK_MATTER: BackMatter = {
  aboutAuthor: 'Alex Rivers is an author, architect of speculative fiction, and independent publisher exploring high-concept adventure and humanity.',
  otherBooks: 'Also by Alex Rivers:\n- Shadows of the Frontier\n- The Obsidian Protocol',
  resources: 'Discover bonus chapters and character art at author-alexrivers.example.com',
};

export const DEFAULT_METADATA: KDPMetadata = {
  description: `<h2>An Unforgettable Journey into the Unknown</h2>\n<p>When an ancient cartographic map is recovered from deep-sea ruins, a lone researcher discovers that our world was never empty—it was waiting.</p>\n<p><b>Inside this gripping adventure:</b></p>\n<ul>\n  <li><b>Fast-Paced Suspense:</b> Heart-pounding encounters across uncharted territory.</li>\n  <li><b>Immersive Lore:</b> Deep historical worldbuilding grounded in real archaeological wonder.</li>\n  <li><b>High Stakes:</b> A race against time where every secret unlocked carries a devastating price.</li>\n</ul>`,
  keywords: [
    'action adventure mystery novel',
    'speculative thriller bestseller',
    'ancient ruins lost civilization',
    'archaeological thriller fiction',
    'scifi suspense paperback',
    'survival exploration quest',
    'epic adventure series'
  ],
  categories: [
    'Fiction > Action & Adventure',
    'Fiction > Science Fiction > Adventure'
  ],
  price: 14.99,
  royaltyPlan: '70',
};

export const SAMPLE_STARTER_BOOK: Book = {
  id: 'book_sample_the_lost_horizon',
  title: 'The Lost Horizon Protocol',
  subtitle: 'A Speculative Adventure',
  author: 'Alex Rivers',
  language: 'English',
  genre: 'Science Fiction',
  trimSize: '6x9',
  paperType: 'white',
  status: 'formatting',
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  chapters: [
    {
      id: 'chap_sample_1',
      title: 'Chapter 1: The Submerged Signal',
      order: 1,
      wordCount: 840,
      content: `<h2>Chapter 1: The Submerged Signal</h2>
<p class="drop-cap">The ocean at midnight was an endless plane of obsidian, broken only by the synchronized hum of the research vessel's sonar ping. Marcus leaned closer to the monitor, his breath misting the tempered glass. The acoustic reflection was returning an impossible geometry—straight right-angles three thousand meters beneath the Arctic shelf.</p>
<p>"Check the telemetry again," Marcus murmured into his headset. "Sensors shouldn't be registering harmonic frequencies from bedrock."</p>
<p>Dr. Elena Vance stepped up beside him, clutching a stainless steel thermos that radiated the only warmth in the bridge. "We've rerun the diagnostic three times. Whatever is transmitting down there, Marcus, it's powered by something that predates our recorded history."</p>
<p>The signal pulsed again. This time, the entire instrument console flickered in sympathetic cadence. Across the horizon, the northern lights began to twist into concentric rings, mirroring the sunken beacon below.</p>`
    },
    {
      id: 'chap_sample_2',
      title: 'Chapter 2: Descent into Silence',
      order: 2,
      wordCount: 650,
      content: `<h2>Chapter 2: Descent into Silence</h2>
<p>The pressurized submersible groaned under twelve atmospheres of relentless cold water. Through the quartz viewport, bioluminescent jellyfish drifted like spectral embers against the abyss.</p>
<p>"Depth: twenty-four hundred meters," Elena called out, her voice level despite the faint vibration rattling the hull. "Thermal signatures are spiking ahead. We are entering the perimeter."</p>
<p>Marcus ignited the high-intensity floodlights. A towering monolith of interlocking basalt emerged from the blackness, carved with precision that defied modern metallurgy. At its center lay a recessed gateway, glowing with a soft, pulsing azure luminescence.</p>`
    },
    {
      id: 'chap_sample_3',
      title: 'Chapter 3: The Awakening Matrix',
      order: 3,
      wordCount: 720,
      content: `<h2>Chapter 3: The Awakening Matrix</h2>
<p>Touching the seal was not an act of courage; it was an involuntary surrender to curiosity. When Marcus's titanium glove grazed the outer glyph, the stone did not crack—it liquefied, flowing like mercurial water before solidifying into a staircase leading upward into an air-filled chamber.</p>
<p>"Atmospheric readings are breathable," Elena gasped, staring in disbelief at her gauge. "How is there dry atmosphere two miles beneath the ice?"</p>
<p>Before them stretched a chamber of crystalline archives, spanning centuries of forgotten human knowledge, waiting for the one key that could unlock tomorrow.</p>`
    }
  ],
  frontMatter: { ...DEFAULT_FRONT_MATTER },
  backMatter: { ...DEFAULT_BACK_MATTER },
  metadata: { ...DEFAULT_METADATA }
};

export interface BookStore {
  books: Book[];
  currentBook: Book | null;
  
  // Actions
  setCurrentBook: (bookOrId: Book | null | string) => void;
  addBook: (bookData: {
    title: string;
    subtitle?: string;
    author: string;
    language?: string;
    genre: string;
    trimSize: TrimSize;
    paperType: PaperType;
  }) => Book;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  duplicateBook: (id: string) => Book | null;
  importBooks: (importedBooks: Book[]) => boolean;
  resetToDefaultBooks: () => void;
  
  // Chapter Actions
  addChapter: (bookId: string, title?: string, content?: string) => Chapter;
  updateChapter: (bookId: string, chapterId: string, updates: Partial<Chapter>) => void;
  deleteChapter: (bookId: string, chapterId: string) => void;
  deleteMultipleChapters: (bookId: string, chapterIds: string[]) => void;
  replaceAllChapters: (bookId: string, chapters: Chapter[]) => void;
  clearAllChapters: (bookId: string) => void;
  reorderChapters: (bookId: string, newChapters: Chapter[]) => void;
  duplicateChapter: (bookId: string, chapterId: string) => Chapter | null;
}

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      books: [SAMPLE_STARTER_BOOK],
      currentBook: SAMPLE_STARTER_BOOK,

      setCurrentBook: (bookOrId) => {
        let book: Book | null = null;
        if (typeof bookOrId === 'string') {
          book = get().books.find(b => b.id === bookOrId) || null;
        } else {
          book = bookOrId;
        }
        set({ currentBook: book });
      },

      addBook: (bookData) => {
        const id = `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();

        const initialChapter: Chapter = {
          id: `chap_${Date.now()}_1`,
          title: 'Chapter 1: The Beginning',
          content: '<p>Start writing your chapter here...</p>',
          order: 1,
          wordCount: 5,
        };

        const brand = useBrandStore.getState().brandKit;
        const autoApply = brand?.autoApplyToNewBooks;
        const chosenAuthor = bookData.author || (autoApply && (brand?.activePenName || brand?.authorName)) || 'Kindle Author';

        const frontMatter: FrontMatter = {
          ...DEFAULT_FRONT_MATTER,
        };

        const backMatter: BackMatter = {
          ...DEFAULT_BACK_MATTER,
        };

        if (autoApply && brand) {
          if (brand.authorBioMedium || brand.authorBioShort) {
            backMatter.aboutAuthor = brand.authorBioMedium || brand.authorBioShort;
          }
          if (brand.authorWebsite || brand.amazonAuthorUrl) {
            backMatter.resources = `Discover more at ${brand.authorWebsite || brand.amazonAuthorUrl || 'author website'}`;
          }
        }

        const newBook: Book = {
          id,
          title: bookData.title,
          subtitle: bookData.subtitle || '',
          author: chosenAuthor,
          language: bookData.language || brand?.defaultLanguage || 'English',
          genre: bookData.genre || brand?.defaultGenre || 'Fiction',
          trimSize: bookData.trimSize || (brand?.defaultTrimSize as any) || '6x9',
          paperType: bookData.paperType || brand?.defaultPaperType || 'white',
          status: 'draft',
          createdAt: now,
          updatedAt: now,
          chapters: [initialChapter],
          frontMatter,
          backMatter,
          metadata: {
            ...DEFAULT_METADATA,
            description: `A compelling ${bookData.genre?.toLowerCase() || 'engaging'} book titled "${bookData.title}".`,
          },
        };

        const updatedBooks = [newBook, ...get().books];
        set({
          books: updatedBooks,
          currentBook: newBook,
        });

        return newBook;
      },

      updateBook: (id, updates) => {
        const updatedBooks = get().books.map(b => {
          if (b.id === id) {
            return {
              ...b,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
          return b;
        });

        const currentBook = get().currentBook;
        const updatedCurrent = currentBook && currentBook.id === id 
          ? { ...currentBook, ...updates, updatedAt: new Date().toISOString() } 
          : currentBook;

        set({ books: updatedBooks, currentBook: updatedCurrent });
      },

      deleteBook: (id) => {
        const updatedBooks = get().books.filter(b => b.id !== id);
        const currentBook = get().currentBook;
        const updatedCurrent = currentBook && currentBook.id === id
          ? (updatedBooks[0] || null)
          : currentBook;

        set({ books: updatedBooks, currentBook: updatedCurrent });
      },

      duplicateBook: (id) => {
        const books = get().books;
        const sourceBook = books.find(b => b.id === id);
        if (!sourceBook) return null;

        const newId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();

        const clonedChapters: Chapter[] = sourceBook.chapters.map((ch, idx) => ({
          ...ch,
          id: `chap_${Date.now()}_${idx + 1}_${Math.random().toString(36).substring(2, 5)}`,
        }));

        const duplicated: Book = {
          ...JSON.parse(JSON.stringify(sourceBook)),
          id: newId,
          title: `${sourceBook.title} (Copy)`,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
          chapters: clonedChapters,
        };

        const updatedBooks = [duplicated, ...books];
        set({ books: updatedBooks, currentBook: duplicated });
        return duplicated;
      },

      importBooks: (importedBooks) => {
        if (!Array.isArray(importedBooks) || importedBooks.length === 0) return false;
        try {
          const validated = importedBooks.filter(b => b && b.title && b.id);
          if (validated.length === 0) return false;

          const existingIds = new Set(get().books.map(b => b.id));
          const safeBooks: Book[] = validated.map(b => {
            if (existingIds.has(b.id)) {
              return { ...b, id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` };
            }
            return b;
          });

          const merged = [...safeBooks, ...get().books];
          set({ books: merged, currentBook: safeBooks[0] || get().currentBook });
          return true;
        } catch (e) {
          console.error('Import error:', e);
          return false;
        }
      },

      resetToDefaultBooks: () => {
        set({
          books: [SAMPLE_STARTER_BOOK],
          currentBook: SAMPLE_STARTER_BOOK,
        });
      },

      addChapter: (bookId, title, content) => {
        const books = get().books;
        const targetBook = books.find(b => b.id === bookId);
        if (!targetBook) throw new Error(`Book with id ${bookId} not found`);

        const chapOrder = targetBook.chapters.length + 1;
        const chapTitle = title || `Chapter ${chapOrder}: New Chapter`;
        const chapContent = content || '<p></p>';
        
        const textOnly = chapContent.replace(/<[^>]*>/g, ' ').trim();
        const wordCount = textOnly ? textOnly.split(/\s+/).filter(Boolean).length : 0;

        const newChapter: Chapter = {
          id: `chap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: chapTitle,
          content: chapContent,
          order: chapOrder,
          wordCount,
        };

        const updatedChapters = [...targetBook.chapters, newChapter];
        get().updateBook(bookId, { chapters: updatedChapters });
        return newChapter;
      },

      updateChapter: (bookId, chapterId, updates) => {
        const books = get().books;
        const targetBook = books.find(b => b.id === bookId);
        if (!targetBook) return;

        const updatedChapters = targetBook.chapters.map(chap => {
          if (chap.id === chapterId) {
            let wordCount = chap.wordCount;
            if (updates.content !== undefined) {
              const textOnly = updates.content.replace(/<[^>]*>/g, ' ').trim();
              wordCount = textOnly ? textOnly.split(/\s+/).filter(Boolean).length : 0;
            }
            return {
              ...chap,
              ...updates,
              wordCount,
            };
          }
          return chap;
        });

        get().updateBook(bookId, { chapters: updatedChapters });
      },

      deleteChapter: (bookId, chapterId) => {
        const books = get().books;
        const targetBook = books.find(b => b.id === bookId);
        if (!targetBook) return;

        const remainingChapters = targetBook.chapters
          .filter(chap => chap.id !== chapterId)
          .map((chap, idx) => ({ ...chap, order: idx + 1 }));

        get().updateBook(bookId, { chapters: remainingChapters });
      },

      deleteMultipleChapters: (bookId, chapterIds) => {
        const books = get().books;
        const targetBook = books.find(b => b.id === bookId);
        if (!targetBook) return;

        const idSet = new Set(chapterIds);
        let remainingChapters = targetBook.chapters
          .filter(chap => !idSet.has(chap.id))
          .map((chap, idx) => ({ ...chap, order: idx + 1 }));

        // If all chapters were deleted, ensure at least 1 blank starter chapter
        if (remainingChapters.length === 0) {
          remainingChapters = [
            {
              id: `chap_${Date.now()}_1`,
              title: 'Chapter 1: Untitled',
              content: '<p></p>',
              order: 1,
              wordCount: 0,
            },
          ];
        }

        get().updateBook(bookId, { chapters: remainingChapters });
      },

      replaceAllChapters: (bookId, newChapters) => {
        const books = get().books;
        const targetBook = books.find(b => b.id === bookId);
        if (!targetBook) return;

        const safeChapters = newChapters.map((chap, idx) => ({
          ...chap,
          order: idx + 1,
        }));

        get().updateBook(bookId, { chapters: safeChapters });
      },

      clearAllChapters: (bookId) => {
        const resetChapters: Chapter[] = [
          {
            id: `chap_${Date.now()}_1`,
            title: 'Chapter 1: The Beginning',
            content: '<p></p>',
            order: 1,
            wordCount: 0,
          },
        ];
        get().updateBook(bookId, { chapters: resetChapters });
      },

      reorderChapters: (bookId, newChapters) => {
        const reordered = newChapters.map((chap, idx) => ({
          ...chap,
          order: idx + 1,
        }));
        get().updateBook(bookId, { chapters: reordered });
      },

      duplicateChapter: (bookId, chapterId) => {
        const books = get().books;
        const targetBook = books.find(b => b.id === bookId);
        if (!targetBook) return null;

        const existing = targetBook.chapters.find(c => c.id === chapterId);
        if (!existing) return null;

        const newChapter: Chapter = {
          id: `chap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: `${existing.title} (Copy)`,
          content: existing.content,
          order: targetBook.chapters.length + 1,
          wordCount: existing.wordCount,
        };

        const updatedChapters = [...targetBook.chapters, newChapter];
        get().updateBook(bookId, { chapters: updatedChapters });
        return newChapter;
      },
    }),
    {
      name: 'kdp_studio_books_v2',
    }
  )
);

export const DEFAULT_USER_SETTINGS: UserSettings = {
  authorLegalName: 'Alex Rivers',
  penName: 'A. R. Vance',
  publisherImprint: 'Horizon Press International',
  website: 'https://alexriversbooks.example.com',
  defaultTrimSize: '6x9',
  defaultPaperType: 'white',
  defaultFont: 'Garamond',
  defaultLanguage: 'English',
  autoSaveIntervalSec: 15,
  bleedDefault: true,
  exportDpi: 300,
  geminiModel: 'gemini-3.6-flash',
};

export interface SettingsStore {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_USER_SETTINGS,
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },
      resetSettings: () => {
        set({ settings: DEFAULT_USER_SETTINGS });
      },
    }),
    {
      name: 'kdp_studio_settings_v1',
    }
  )
);
