import React, { useState } from 'react';
import { X, Flower2, Check, AlignLeft, Sparkles } from 'lucide-react';
import { Editor } from '@tiptap/react';

interface OrnamentalDividerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
}

type DividerStyle = {
  id: string;
  label: string;
  preview: string;
  html: string;
  category: 'scene-break' | 'chapter-end' | 'decorative';
};

const DIVIDERS: DividerStyle[] = [
  // Scene Breaks
  { id: 'asterism', label: 'Asterism', category: 'scene-break', preview: '* * *', html: '<p style="text-align:center; color:#94a3b8; letter-spacing: 0.5em; margin: 2em 0; font-size: 14px;">* * *</p>' },
  { id: 'hash', label: 'Hash Break', category: 'scene-break', preview: '#', html: '<p style="text-align:center; color:#94a3b8; margin: 2em 0; font-size: 18px; font-weight: bold;">#</p>' },
  { id: 'fleuron', label: 'Fleuron', category: 'scene-break', preview: '❧', html: '<p style="text-align:center; margin: 2em 0; font-size: 22px; color:#7c3aed;">❧</p>' },
  { id: 'cross', label: 'Cross', category: 'scene-break', preview: '†', html: '<p style="text-align:center; margin: 2em 0; font-size: 20px; color:#94a3b8;">†</p>' },
  { id: 'diamond', label: 'Diamond', category: 'scene-break', preview: '◆ ◇ ◆', html: '<p style="text-align:center; margin: 2em 0; font-size: 14px; color:#7c3aed; letter-spacing: 0.3em;">◆ ◇ ◆</p>' },
  { id: 'tildes', label: 'Wave', category: 'scene-break', preview: '~ ~ ~', html: '<p style="text-align:center; margin: 2em 0; color:#94a3b8; letter-spacing: 0.5em;">~ ~ ~</p>' },

  // Chapter End
  { id: 'line', label: 'Thin Rule', category: 'chapter-end', preview: '——', html: '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 2.5em auto; width: 60%;" />' },
  { id: 'thick-line', label: 'Bold Rule', category: 'chapter-end', preview: '═══', html: '<hr style="border: none; border-top: 3px solid #7c3aed; margin: 2.5em auto; width: 40%; opacity: 0.4;" />' },
  { id: 'ornate-rule', label: 'Ornate Rule', category: 'chapter-end', preview: '—✦—', html: '<p style="text-align:center; margin: 2em 0; color:#94a3b8; font-size: 14px; letter-spacing: 0.8em;">—✦—</p>' },
  { id: 'dots-rule', label: 'Dot Leaders', category: 'chapter-end', preview: '· · · · ·', html: '<p style="text-align:center; margin: 2em 0; color:#cbd5e1; font-size: 12px; letter-spacing: 0.5em;">· · · · · · · · ·</p>' },

  // Decorative
  { id: 'rose', label: 'Rose', category: 'decorative', preview: '✿', html: '<p style="text-align:center; margin: 2em 0; font-size: 28px;">✿</p>' },
  { id: 'star-cluster', label: 'Star Cluster', category: 'decorative', preview: '✦ ✧ ✦', html: '<p style="text-align:center; margin: 2em 0; font-size: 16px; letter-spacing: 0.4em; color:#7c3aed;">✦ ✧ ✦</p>' },
  { id: 'infinity', label: 'Infinity', category: 'decorative', preview: '∞', html: '<p style="text-align:center; margin: 2em 0; font-size: 24px; color:#7c3aed;">∞</p>' },
  { id: 'leaves', label: 'Leaves', category: 'decorative', preview: '🌿 · 🌿', html: '<p style="text-align:center; margin: 2em 0; font-size: 18px;">🌿 · 🌿</p>' },
  { id: 'moon-stars', label: 'Moon & Stars', category: 'decorative', preview: '☽ ✦ ☽', html: '<p style="text-align:center; margin: 2em 0; font-size: 18px; color:#7c3aed; letter-spacing: 0.3em;">☽ ✦ ☽</p>' },
  { id: 'sword', label: 'Sword', category: 'decorative', preview: '⚔', html: '<p style="text-align:center; margin: 2em 0; font-size: 22px;">⚔</p>' },
];

// Drop Cap Styles
const DROP_CAP_STYLES = [
  { id: 'classic', label: 'Classic', desc: 'Large serif drop cap', preview: 'T', css: 'float:left;font-size:3.8em;line-height:0.85;margin:0.05em 0.1em 0 0;font-family:Georgia,serif;font-weight:bold;color:#1e293b;' },
  { id: 'elegant', label: 'Elegant', desc: 'Colored accent cap', preview: 'T', css: 'float:left;font-size:3.8em;line-height:0.85;margin:0.05em 0.12em 0 0;font-family:Georgia,serif;font-weight:bold;color:#7c3aed;' },
  { id: 'boxed', label: 'Boxed', desc: 'Framed initial cap', preview: 'T', css: 'float:left;font-size:2.4em;line-height:1;margin:0.1em 0.15em 0.05em 0;font-family:Georgia,serif;font-weight:bold;color:white;background:#7c3aed;padding:4px 8px;border-radius:4px;' },
  { id: 'outlined', label: 'Outlined', desc: 'Subtle outlined cap', preview: 'T', css: 'float:left;font-size:3.8em;line-height:0.85;margin:0.05em 0.1em 0 0;font-family:Georgia,serif;font-weight:bold;color:transparent;-webkit-text-stroke:2px #7c3aed;' },
];

const CATEGORIES = [
  { id: 'scene-break', label: 'Scene Breaks', Icon: AlignLeft },
  { id: 'chapter-end', label: 'Chapter Endings', Icon: X },
  { id: 'decorative', label: 'Decorative', Icon: Flower2 },
];

export const OrnamentalDividerModal: React.FC<OrnamentalDividerModalProps> = ({
  isOpen,
  onClose,
  editor,
}) => {
  const [tab, setTab] = useState<'dividers' | 'dropcap'>('dividers');
  const [activeCategory, setActiveCategory] = useState<string>('scene-break');
  const [selectedDivider, setSelectedDivider] = useState<string | null>(null);
  const [selectedDropCap, setSelectedDropCap] = useState<string>('classic');
  const [dropCapLetter, setDropCapLetter] = useState('T');
  const [inserted, setInserted] = useState(false);

  if (!isOpen) return null;

  const filtered = DIVIDERS.filter((d) => d.category === activeCategory);
  const selectedDropCapStyle = DROP_CAP_STYLES.find((s) => s.id === selectedDropCap)!;

  const handleInsertDivider = () => {
    if (!editor || !selectedDivider) return;
    const divider = DIVIDERS.find((d) => d.id === selectedDivider);
    if (!divider) return;
    editor.chain().focus().insertContent(divider.html).run();
    setInserted(true);
    setTimeout(() => { onClose(); setInserted(false); }, 1000);
  };

  const handleInsertDropCap = () => {
    if (!editor) return;
    const style = DROP_CAP_STYLES.find((s) => s.id === selectedDropCap)!;
    const html = `<p><span style="${style.css}">${dropCapLetter}</span>...</p>`;
    editor.chain().focus().insertContent(html).run();
    setInserted(true);
    setTimeout(() => { onClose(); setInserted(false); }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <Flower2 className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Typography & Ornaments</h2>
              <p className="text-xs text-slate-500">Scene breaks, chapter endings & drop caps</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setTab('dividers')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${tab === 'dividers' ? 'border-violet-600 text-violet-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Scene Breaks & Dividers
          </button>
          <button
            onClick={() => setTab('dropcap')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${tab === 'dropcap' ? 'border-violet-600 text-violet-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Drop Caps
          </button>
        </div>

        <div className="p-5">
          {tab === 'dividers' && (
            <>
              {/* Category filter */}
              <div className="flex gap-2 mb-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeCategory === cat.id ? 'bg-violet-100 text-violet-700 border border-violet-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Divider Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                {filtered.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDivider(d.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedDivider === d.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-center text-lg mb-1 font-serif text-slate-700">{d.preview}</div>
                    <p className="text-xs text-center text-slate-500">{d.label}</p>
                    {selectedDivider === d.id && (
                      <div className="absolute top-1 right-1">
                        <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleInsertDivider}
                disabled={!selectedDivider || !editor}
                className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  inserted ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                } shadow`}
              >
                {inserted ? <><Check className="w-4 h-4" /> Inserted!</> : 'Insert at Cursor Position'}
              </button>
            </>
          )}

          {tab === 'dropcap' && (
            <>
              {/* Drop cap letter input */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Initial Letter</label>
                <input
                  type="text"
                  maxLength={1}
                  value={dropCapLetter}
                  onChange={(e) => setDropCapLetter(e.target.value.toUpperCase() || 'T')}
                  className="w-20 text-center text-2xl font-bold border border-slate-300 rounded-xl py-2 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none"
                />
              </div>

              {/* Style grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {DROP_CAP_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedDropCap(style.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedDropCap === style.id ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        style={{ cssText: style.css } as React.CSSProperties}
                        dangerouslySetInnerHTML={{ __html: `<span style="${style.css}">${dropCapLetter}</span>` }}
                        className="shrink-0"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{style.label}</p>
                        <p className="text-[10px] text-slate-500">{style.desc}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      {dropCapLetter}nce upon a time in a land far away...
                    </p>
                  </button>
                ))}
              </div>

              <button
                onClick={handleInsertDropCap}
                disabled={!editor}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  inserted ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40'
                } shadow`}
              >
                {inserted ? <><Check className="w-4 h-4" /> Inserted!</> : `Insert "${dropCapLetter}" Drop Cap`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
