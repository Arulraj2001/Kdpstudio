import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Eye, Code, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { useBookStore } from '../../lib/store';

export const DescriptionTab: React.FC = () => {
  const { currentBook, updateBook } = useBookStore();

  const [title, setTitle] = useState(currentBook?.title || 'Echoes of Eternity');
  const [subtitle, setSubtitle] = useState(currentBook?.subtitle || '');
  const [genre, setGenre] = useState(currentBook?.genre || 'Fantasy & Sci-Fi');
  const [concept, setConcept] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('High-energy, compelling, and suspenseful');

  const [htmlDescription, setHtmlDescription] = useState(
    currentBook?.metadata?.description ||
      `<h2>An Unforgettable Journey Through Darkness and Wonder</h2>
<p>In a world where ancient oaths are forged in fire and every shadow holds a forgotten debt, one unexpected choice changes everything.</p>
<p>When the empire teeters on the brink of collapse, Elena must navigate treacherous alliances, ruthless enemies, and a power that threatens to consume her very soul.</p>
<p><b>Inside this book, you will discover:</b></p>
<ul>
  <li><b>Relentless Stakes:</b> A high-octane narrative that plunges you headfirst into high-tension conflict.</li>
  <li><b>Immersive Worldbuilding:</b> Ancient citadels, intricate magic lore, and breathtaking landscapes.</li>
  <li><b>Heart-Stopping Twists:</b> Revelations that will keep you guessing until the very last sentence.</li>
</ul>
<p>Whether you are a lifelong fan of epic fantasy or diving into the genre for the first time, this is an adventure you cannot afford to miss.</p>
<p><b>Scroll up, click "Buy Now", and begin your journey today!</b></p>`
  );

  const [previewMode, setPreviewMode] = useState<'editor' | 'preview'>('editor');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedType, setCopiedType] = useState<'html' | 'plain' | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync when currentBook changes
  useEffect(() => {
    if (currentBook) {
      setTitle(currentBook.title);
      setSubtitle(currentBook.subtitle || '');
      setGenre(currentBook.genre);
      if (currentBook.metadata?.description) {
        setHtmlDescription(currentBook.metadata.description);
      }
    }
  }, [currentBook?.id]);

  const charCount = htmlDescription.length;
  const maxChars = 4000;
  const plainText = htmlDescription.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const chapterTitles = currentBook?.chapters?.map((c) => c.title) || [];
      const res = await fetch('/api/kdp/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          genre,
          author: currentBook?.author || 'Author',
          chapters: chapterTitles,
          concept,
          targetAudience,
          tone,
        }),
      });

      const data = await res.json();
      if (data.success && data.htmlDescription) {
        setHtmlDescription(data.htmlDescription);
      }
    } catch (err) {
      console.error('Error generating description:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (type: 'html' | 'plain') => {
    const textToCopy = type === 'html' ? htmlDescription : plainText;
    navigator.clipboard.writeText(textToCopy);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleSaveToBook = () => {
    if (!currentBook) return;
    updateBook(currentBook.id, {
      metadata: {
        ...currentBook.metadata,
        description: htmlDescription,
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const insertTag = (tagOpen: string, tagClose: string) => {
    const textarea = document.getElementById('kdp-description-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = htmlDescription.substring(start, end);
    const replacement = `${tagOpen}${selected || 'text'}${tagClose}`;

    const newText = htmlDescription.substring(0, start) + replacement + htmlDescription.substring(end);
    setHtmlDescription(newText);
  };

  return (
    <div id="kdp-description-tab" className="space-y-6">
      {/* Book details context card */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Book Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle (Optional)</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. A Gripping Dark Fantasy Novel"
            className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Genre</label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Generation Prompt Details (Collapsible or streamlined) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" />
              <span>AI Bestseller Description Generator</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generates a high-converting ~400-word Amazon product page description formatted with valid KDP HTML tags.
            </p>
          </div>
          <button
            id="ai-generate-description-btn"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Crafting Description...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>AI Generate Description</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Key Story Hook or Concept</label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g. A banished knight uncovers a secret ancient conspiracy..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Target Reader / Comparable Authors</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Fans of Brandon Sanderson, Patrick Rothfuss, and Joe Abercrombie"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Editor & Amazon Preview Split/Tab Area */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Toolbar */}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPreviewMode('editor')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                previewMode === 'editor'
                  ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code size={13} />
              <span>HTML Source</span>
            </button>
            <button
              onClick={() => setPreviewMode('preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                previewMode === 'preview'
                  ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye size={13} />
              <span>Amazon Product Preview</span>
            </button>
          </div>

          {/* Quick HTML tags helper */}
          {previewMode === 'editor' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => insertTag('<b>', '</b>')}
                className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100"
                title="Bold"
              >
                &lt;b&gt;
              </button>
              <button
                onClick={() => insertTag('<i>', '</i>')}
                className="px-2 py-1 text-[11px] italic text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100"
                title="Italic"
              >
                &lt;i&gt;
              </button>
              <button
                onClick={() => insertTag('<h2>', '</h2>')}
                className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100"
                title="Heading 2"
              >
                &lt;h2&gt;
              </button>
              <button
                onClick={() => insertTag('<p>', '</p>')}
                className="px-2 py-1 text-[11px] text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100"
                title="Paragraph"
              >
                &lt;p&gt;
              </button>
              <button
                onClick={() => insertTag('<ul>\n  <li>', '</li>\n</ul>')}
                className="px-2 py-1 text-[11px] text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100"
                title="Bullet List"
              >
                &lt;ul&gt;
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy('html')}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              {copiedType === 'html' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>Copy HTML</span>
            </button>
            <button
              onClick={() => handleCopy('plain')}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              {copiedType === 'plain' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>Copy Plain Text</span>
            </button>
            {currentBook && (
              <button
                onClick={handleSaveToBook}
                className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 flex items-center gap-1.5 transition-colors"
              >
                {savedSuccess ? <Check size={13} className="text-emerald-600" /> : <Save size={13} />}
                <span>Save to Book</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4">
          {previewMode === 'editor' ? (
            <div className="space-y-2">
              <textarea
                id="kdp-description-textarea"
                value={htmlDescription}
                onChange={(e) => setHtmlDescription(e.target.value)}
                rows={12}
                className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-900/5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed resize-y"
                placeholder="Enter or generate KDP HTML description here..."
              />
            </div>
          ) : (
            <div className="p-6 bg-amber-50/30 rounded-xl border border-amber-200/60 max-w-3xl">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-200/50">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Amazon Product Description Preview
                </span>
              </div>
              <div
                className="prose prose-slate prose-sm max-w-none text-slate-800 text-xs leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{ __html: htmlDescription }}
              />
            </div>
          )}
        </div>

        {/* Footer Statistics */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-600">
              Word Count: <strong className="text-slate-900">{wordCount} words</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Character Limit:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  charCount > maxChars
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : charCount > 3500
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {charCount} / {maxChars}
              </span>
            </div>
          </div>

          {charCount > maxChars && (
            <div className="text-rose-600 flex items-center gap-1 font-semibold">
              <AlertCircle size={14} />
              <span>Warning: Amazon KDP rejects descriptions exceeding 4,000 characters.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
