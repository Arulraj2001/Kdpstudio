import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Copy, Check, Send, RefreshCw, Scissors, Zap, Edit3 } from 'lucide-react';
import { useBookStore } from '../../lib/store';

interface BackCoverBlurbTabProps {
  onNavigateToCoverBuilder?: () => void;
}

export const BackCoverBlurbTab: React.FC<BackCoverBlurbTabProps> = ({ onNavigateToCoverBuilder }) => {
  const { currentBook, updateBook } = useBookStore();

  // Inputs
  const [title, setTitle] = useState(currentBook?.title || 'Echoes of Eternity');
  const [subtitle, setSubtitle] = useState(currentBook?.subtitle || '');
  const [genre, setGenre] = useState(currentBook?.genre || 'Epic Fantasy');
  const [summary, setSummary] = useState('');
  const [targetReader, setTargetReader] = useState('');
  const [problemOrConflict, setProblemOrConflict] = useState('');
  const [benefit1, setBenefit1] = useState('An intricate magic system tied to forgotten bloodlines');
  const [benefit2, setBenefit2] = useState('High-stakes political intrigue and shocking betrayals');
  const [benefit3, setBenefit3] = useState('A relentless battle against an ancient shadow');
  const [authorBio, setAuthorBio] = useState(
    currentBook?.backMatter?.aboutAuthor || 'An author dedicated to crafting immersive, unforgettable worlds.'
  );

  // Blurb pieces
  const [headline, setHeadline] = useState('AN IMPOSSIBLE SACRIFICE. A SHATTERED REALM.');
  const [hookParagraph, setHookParagraph] = useState(
    `When an ancient darkness wakes beneath the ruins of the Obsidian Citadel, Elena is thrust into a war she never chose. Bound by a forbidden blood-pact and hunted by the emperor’s elite inquisitors, her only hope lies in mastering a power that could destroy everything she loves.\n\nWith time running out and allies turning to enemies, she must make a desperate choice between saving her homeland and preserving her humanity.`
  );
  const [bullets, setBullets] = useState<string[]>([
    'A breathtaking journey through dangerous, uncharted territories',
    'Complex characters with hidden motives and fierce loyalties',
    'A shocking climax that will leave you on the edge of your seat',
  ]);
  const [callToAction, setCallToAction] = useState('Step into an unforgettable saga. Grab your copy today!');
  const [authorBioSnippet, setAuthorBioSnippet] = useState(
    'A lifelong storyteller whose works explore resilience, mystery, and wonder.'
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentToCoverSuccess, setSentToCoverSuccess] = useState(false);

  // Sync with current book
  useEffect(() => {
    if (currentBook) {
      setTitle(currentBook.title);
      setSubtitle(currentBook.subtitle || '');
      setGenre(currentBook.genre);
      if (currentBook.backMatter?.aboutAuthor) {
        setAuthorBio(currentBook.backMatter.aboutAuthor);
      }
    }
  }, [currentBook?.id]);

  const fullBlurbText = `${headline}

${hookParagraph}

${bullets.map((b) => `• ${b}`).join('\n')}

${callToAction}

About the Author:
${authorBioSnippet}`;

  const wordCount = fullBlurbText.split(/\s+/).filter(Boolean).length;
  const isOptimalWordCount = wordCount >= 150 && wordCount <= 260;

  const handleGenerateBlurb = async (styleModifier: 'default' | 'shorter' | 'punchier' = 'default') => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/kdp/blurb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          genre,
          summary,
          targetReader,
          problemOrConflict,
          benefits: [benefit1, benefit2, benefit3].filter(Boolean),
          authorBio,
          styleModifier,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.headline) setHeadline(data.headline);
        if (data.hookParagraph) setHookParagraph(data.hookParagraph);
        if (data.bulletPoints) setBullets(data.bulletPoints);
        if (data.callToAction) setCallToAction(data.callToAction);
        if (data.authorBioSnippet) setAuthorBioSnippet(data.authorBioSnippet);
      }
    } catch (err) {
      console.error('Error generating blurb:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyBlurb = () => {
    navigator.clipboard.writeText(fullBlurbText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToCoverBuilder = () => {
    if (currentBook) {
      // Store blurb into coverData or book metadata
      updateBook(currentBook.id, {
        coverData: {
          ...(currentBook.coverData || {}),
          backCoverBlurb: fullBlurbText,
        },
      });
    }
    setSentToCoverSuccess(true);
    setTimeout(() => {
      setSentToCoverSuccess(false);
      if (onNavigateToCoverBuilder) {
        onNavigateToCoverBuilder();
      }
    }, 1200);
  };

  return (
    <div id="kdp-blurb-tab" className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={18} className="text-purple-600" />
            <span>AI Back Cover Blurb Copywriter</span>
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Generates high-converting 5-part paperback back cover copy crafted specifically to turn casual bookstore or
            online browsers into buyers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleGenerateBlurb('default')}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Writing Blurb...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>AI Generate Blurb</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Book Hook & Story Elements
          </h4>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Reader / Tropes</label>
              <input
                type="text"
                value={targetReader}
                onChange={(e) => setTargetReader(e.target.value)}
                placeholder="e.g. Fans of dark fantasy with intricate magic and high stakes"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Core Conflict / Stakes</label>
              <textarea
                rows={3}
                value={problemOrConflict}
                onChange={(e) => setProblemOrConflict(e.target.value)}
                placeholder="e.g. Elena must risk her own humanity to stop an ancient empire from falling into darkness..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">3 Key Highlights / Benefits / Twists</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={benefit1}
                  onChange={(e) => setBenefit1(e.target.value)}
                  placeholder="Key highlight 1"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
                <input
                  type="text"
                  value={benefit2}
                  onChange={(e) => setBenefit2(e.target.value)}
                  placeholder="Key highlight 2"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
                <input
                  type="text"
                  value={benefit3}
                  onChange={(e) => setBenefit3(e.target.value)}
                  placeholder="Key highlight 3"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Author Bio Snippet</label>
              <input
                type="text"
                value={authorBio}
                onChange={(e) => setAuthorBio(e.target.value)}
                placeholder="Author credentials or short background"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Right Output & Refinement Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Generated Back Cover Blurb
              </h4>
              <span className="text-[11px] text-slate-500">Structured into 5 proven conversion elements</span>
            </div>

            {/* AI Refinements */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleGenerateBlurb('shorter')}
                disabled={isGenerating}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                title="Condense for smaller book trims"
              >
                <Scissors size={12} />
                <span>Make Shorter</span>
              </button>
              <button
                onClick={() => handleGenerateBlurb('punchier')}
                disabled={isGenerating}
                className="px-2.5 py-1 text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                title="Increase emotional urgency and punch"
              >
                <Zap size={12} />
                <span>Make Punchier</span>
              </button>
            </div>
          </div>

          {/* 5-Part Structured Preview / Edit Cards */}
          <div className="space-y-3">
            {/* 1. Headline */}
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1">
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">
                1. Bold Headline Hook
              </span>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full text-xs font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0"
              />
            </div>

            {/* 2. Hook Paragraph */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                2. Story & Stakes Hook
              </span>
              <textarea
                rows={4}
                value={hookParagraph}
                onChange={(e) => setHookParagraph(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 bg-transparent border-0 p-0 focus:ring-0 leading-relaxed resize-y"
              />
            </div>

            {/* 3. Bullet Points */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                3. Bulleted Highlights
              </span>
              {bullets.map((b, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <input
                    type="text"
                    value={b}
                    onChange={(e) => {
                      const updated = [...bullets];
                      updated[idx] = e.target.value;
                      setBullets(updated);
                    }}
                    className="w-full text-xs font-medium text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              ))}
            </div>

            {/* 4. Call to Action */}
            <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                4. Call to Action (CTA)
              </span>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                className="w-full text-xs font-bold text-slate-900 bg-transparent border-0 p-0 focus:ring-0 italic"
              />
            </div>

            {/* 5. Author Bio */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                5. Author Bio Snippet
              </span>
              <input
                type="text"
                value={authorBioSnippet}
                onChange={(e) => setAuthorBioSnippet(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 bg-transparent border-0 p-0 focus:ring-0"
              />
            </div>
          </div>

          {/* Footer stats & Copy / Send Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-600">
                Word Count: <strong className="text-slate-900">{wordCount} words</strong>
              </span>
              <span
                className={`px-2 py-0.5 rounded font-bold ${
                  isOptimalWordCount
                    ? 'bg-emerald-100 text-emerald-800'
                    : wordCount > 260
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isOptimalWordCount ? 'Optimal (150–250 words)' : `${wordCount} words`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyBlurb}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>Copy Full Blurb</span>
              </button>

              <button
                onClick={handleSendToCoverBuilder}
                className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                {sentToCoverSuccess ? <Check size={13} className="text-emerald-300" /> : <Send size={13} />}
                <span>Send to Cover Builder</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
