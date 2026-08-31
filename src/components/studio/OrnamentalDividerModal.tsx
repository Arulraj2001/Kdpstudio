import React, { useState } from 'react';
import { X, Flower2, Check, Sparkles } from 'lucide-react';
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
  { id: 'asterism', label: 'Asterism', category: 'scene-break', preview: '* * *', html: '<p style="text-align:center; color:#94a3b8; letter-spacing: 0.5em; margin: 2em 0; font-size: 14px; font-weight: bold;">* * *</p>' },
  { id: 'hash', label: 'Hash Break', category: 'scene-break', preview: '#', html: '<p style="text-align:center; color:#94a3b8; margin: 2em 0; font-size: 18px; font-weight: bold;">#</p>' },
  { id: 'fleuron', label: 'Fleuron', category: 'scene-break', preview: '❧', html: '<p style="text-align:center; margin: 2em 0; font-size: 24px; color:#7c3aed;">❧</p>' },
  { id: 'cross', label: 'Cross', category: 'scene-break', preview: '†', html: '<p style="text-align:center; margin: 2em 0; font-size: 20px; color:#94a3b8;">†</p>' },
  { id: 'diamond', label: 'Diamond Trio', category: 'scene-break', preview: '◆ ◇ ◆', html: '<p style="text-align:center; margin: 2em 0; font-size: 14px; color:#7c3aed; letter-spacing: 0.4em;">◆ ◇ ◆</p>' },
  { id: 'tildes', label: 'Wave', category: 'scene-break', preview: '~ ~ ~', html: '<p style="text-align:center; margin: 2em 0; color:#94a3b8; letter-spacing: 0.5em; font-size: 16px;">~ ~ ~</p>' },

  // Chapter End
  { id: 'line', label: 'Thin Rule', category: 'chapter-end', preview: '————', html: '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 2.5em auto; width: 60%;" />' },
  { id: 'thick-line', label: 'Bold Rule', category: 'chapter-end', preview: '════', html: '<hr style="border: none; border-top: 3px solid #7c3aed; margin: 2.5em auto; width: 40%; opacity: 0.6; border-radius: 2px;" />' },
  { id: 'ornate-rule', label: 'Ornate Spark', category: 'chapter-end', preview: '— ✦ —', html: '<p style="text-align:center; margin: 2em 0; color:#7c3aed; font-size: 14px; letter-spacing: 0.6em;">— ✦ —</p>' },
  { id: 'dots-rule', label: 'Dot Leaders', category: 'chapter-end', preview: '· · · · ·', html: '<p style="text-align:center; margin: 2em 0; color:#cbd5e1; font-size: 14px; letter-spacing: 0.6em;">· · · · · · · · ·</p>' },

  // Decorative
  { id: 'rose', label: 'Floral Bloom', category: 'decorative', preview: '✿', html: '<p style="text-align:center; margin: 2em 0; font-size: 24px; color:#ec4899;">✿</p>' },
  { id: 'star-cluster', label: 'Star Cluster', category: 'decorative', preview: '✦ ✧ ✦', html: '<p style="text-align:center; margin: 2em 0; font-size: 16px; letter-spacing: 0.4em; color:#7c3aed;">✦ ✧ ✦</p>' },
  { id: 'infinity', label: 'Infinity Knot', category: 'decorative', preview: '∞', html: '<p style="text-align:center; margin: 2em 0; font-size: 24px; color:#7c3aed;">∞</p>' },
  { id: 'leaves', label: 'Botanical', category: 'decorative', preview: '🌿 · 🌿', html: '<p style="text-align:center; margin: 2em 0; font-size: 18px; color:#10b981;">🌿 · 🌿</p>' },
  { id: 'moon-stars', label: 'Moon & Stars', category: 'decorative', preview: '☽ ✦ ☽', html: '<p style="text-align:center; margin: 2em 0; font-size: 18px; color:#7c3aed; letter-spacing: 0.3em;">☽ ✦ ☽</p>' },
  { id: 'sword', label: 'Blades', category: 'decorative', preview: '⚔', html: '<p style="text-align:center; margin: 2em 0; font-size: 20px; color:#64748b;">⚔</p>' },
];

type DropCapStyle = {
  id: string;
  label: string;
  desc: string;
  badge: string;
  previewCardStyle: React.CSSProperties;
  editorCss: string;
  cardBgClass: string;
};

const DROP_CAP_STYLES: DropCapStyle[] = [
  {
    id: 'classic',
    label: 'Classic Editorial',
    desc: 'Deep serif drop cap',
    badge: 'Standard',
    previewCardStyle: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 'bold',
      color: '#0f172a',
      fontSize: '2rem',
      lineHeight: '1',
    },
    editorCss: 'float: left; font-size: 3.4em; line-height: 0.82; margin: 0.05em 0.12em 0 0; font-family: Georgia, serif; font-weight: bold; color: #0f172a;',
    cardBgClass: 'bg-slate-50 border-slate-200',
  },
  {
    id: 'elegant',
    label: 'Royal Violet',
    desc: 'Colored literary accent',
    badge: 'Popular',
    previewCardStyle: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 'bold',
      color: '#7c3aed',
      fontSize: '2rem',
      lineHeight: '1',
    },
    editorCss: 'float: left; font-size: 3.4em; line-height: 0.82; margin: 0.05em 0.12em 0 0; font-family: Georgia, serif; font-weight: bold; color: #7c3aed;',
    cardBgClass: 'bg-purple-50/60 border-purple-200',
  },
  {
    id: 'boxed',
    label: 'Boxed Badge',
    desc: 'Solid purple badge',
    badge: 'Modern',
    previewCardStyle: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 'bold',
      color: '#ffffff',
      backgroundColor: '#7c3aed',
      fontSize: '1.4rem',
      lineHeight: '1',
      padding: '4px 10px',
      borderRadius: '6px',
      boxShadow: '0 2px 4px rgba(124, 58, 237, 0.3)',
    },
    editorCss: 'float: left; font-size: 2.2em; line-height: 1; margin: 0.08em 0.15em 0 0; font-family: Georgia, serif; font-weight: bold; color: #ffffff; background-color: #7c3aed; padding: 4px 10px; border-radius: 6px; text-shadow: 0 1px 2px rgba(0,0,0,0.2); box-shadow: 0 2px 4px rgba(124,58,237,0.3); text-align: center;',
    cardBgClass: 'bg-purple-50/80 border-purple-300',
  },
  {
    id: 'outlined',
    label: 'Outlined Monogram',
    desc: 'Hollow stroke design',
    badge: 'Minimal',
    previewCardStyle: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 'bold',
      color: 'transparent',
      WebkitTextStroke: '2px #7c3aed',
      fontSize: '2rem',
      lineHeight: '1',
    },
    editorCss: 'float: left; font-size: 3.4em; line-height: 0.82; margin: 0.05em 0.12em 0 0; font-family: Georgia, serif; font-weight: bold; color: transparent; -webkit-text-stroke: 2px #7c3aed;',
    cardBgClass: 'bg-slate-50 border-slate-200',
  },
];

const CATEGORIES = [
  { id: 'scene-break', label: 'Scene Breaks' },
  { id: 'chapter-end', label: 'Chapter Endings' },
  { id: 'decorative', label: 'Decorative Elements' },
];

function getSampleSentence(letter: string): string {
  const upper = letter.toUpperCase();
  switch (upper) {
    case 'O':
      return 'nce upon a time in a realm untouched by clockwork, the ancient bells rang through the valley...';
    case 'T':
      return 'he morning light filtered softly through the tall library arches, illuminating centuries of lore...';
    case 'A':
      return 'll great adventures begin with a quiet hesitation, followed by a single resolute step forward...';
    case 'I':
      return 't was a truth whispered only among the highest scholars of the realm before the stars shifted...';
    case 'W':
      return 'hen the shadows lengthened across the stone courtyard, the traveler knew the time had come...';
    case 'S':
      return 'ilence descended over the winter mountains as the first embers of dawn touched the snow...';
    case 'M':
      return 'any had searched for the lost passage beneath the fortress, but none returned to tell the tale...';
    default:
      return `ever in recorded history had such a discovery been made within the ancient chambers of the high kingdom...`;
  }
}

export const OrnamentalDividerModal: React.FC<OrnamentalDividerModalProps> = ({
  isOpen,
  onClose,
  editor,
}) => {
  const [tab, setTab] = useState<'dividers' | 'dropcap'>('dividers');
  const [activeCategory, setActiveCategory] = useState<string>('scene-break');
  const [selectedDivider, setSelectedDivider] = useState<string | null>(null);
  const [selectedDropCap, setSelectedDropCap] = useState<string>('classic');
  const [dropCapLetter, setDropCapLetter] = useState<string>('T');
  const [inserted, setInserted] = useState(false);

  if (!isOpen) return null;

  const filtered = DIVIDERS.filter((d) => d.category === activeCategory);
  const selectedStyle = DROP_CAP_STYLES.find((s) => s.id === selectedDropCap) || DROP_CAP_STYLES[0];
  const activeLetter = dropCapLetter.trim().slice(0, 1).toUpperCase() || 'T';
  const sampleText = getSampleSentence(activeLetter);

  const handleInsertDivider = () => {
    if (!editor || !selectedDivider) return;
    const divider = DIVIDERS.find((d) => d.id === selectedDivider);
    if (!divider) return;
    editor.chain().focus().insertContent(divider.html).run();
    setInserted(true);
    setTimeout(() => {
      onClose();
      setInserted(false);
      setSelectedDivider(null);
    }, 900);
  };

  const handleInsertDropCap = () => {
    if (!editor) return;
    const style = selectedStyle;
    const safeLetter = activeLetter;
    const continuationText = sampleText;
    const html = `<p><span data-dropcap="${style.id}" style="${style.editorCss}">${safeLetter}</span>${continuationText}</p>`;
    editor.chain().focus().insertContent(html).run();
    setInserted(true);
    setTimeout(() => {
      onClose();
      setInserted(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200">
              <Flower2 className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Typography &amp; Ornaments</h2>
              <p className="text-xs text-slate-500">Scene breaks, chapter ornaments &amp; styled drop caps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={() => setTab('dividers')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
              tab === 'dividers'
                ? 'border-purple-600 text-purple-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}
          >
            Scene Breaks &amp; Dividers
          </button>
          <button
            onClick={() => setTab('dropcap')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
              tab === 'dropcap'
                ? 'border-purple-600 text-purple-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}
          >
            Drop Caps
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {tab === 'dividers' && (
            <>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-1.5 mb-3.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setSelectedDivider(null);
                    }}
                    className={`flex-1 min-w-[90px] py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeCategory === cat.id
                        ? 'bg-purple-100 text-purple-700 border border-purple-300 shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Divider Grid - Medium sized cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
                {filtered.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDivider(d.id)}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all overflow-hidden ${
                      selectedDivider === d.id
                        ? 'border-purple-600 bg-purple-50/70 shadow-sm ring-1 ring-purple-200'
                        : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/20'
                    }`}
                  >
                    <div className="h-8 flex items-center justify-center text-base font-serif text-slate-800 leading-none truncate">
                      {d.preview}
                    </div>
                    <p className="text-[11px] text-center font-medium text-slate-600 mt-1 truncate">{d.label}</p>
                    {selectedDivider === d.id && (
                      <div className="absolute top-1.5 right-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-purple-600 flex items-center justify-center">
                          <Check className="w-2 h-2 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Insert Button */}
              <button
                onClick={handleInsertDivider}
                disabled={!selectedDivider || !editor}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                  inserted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {inserted ? (
                  <>
                    <Check className="w-4 h-4" /> Ornament Inserted!
                  </>
                ) : (
                  'Insert at Cursor Position'
                )}
              </button>
            </>
          )}

          {tab === 'dropcap' && (
            <>
              {/* Letter Input & Live Preview Box */}
              <div className="mb-4 bg-gradient-to-r from-purple-50/80 to-indigo-50/60 p-3.5 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    <label className="text-[11px] font-bold text-slate-700 mb-1 block uppercase tracking-wider">
                      Letter
                    </label>
                    <input
                      type="text"
                      maxLength={1}
                      value={dropCapLetter}
                      onChange={(e) => setDropCapLetter(e.target.value.toUpperCase())}
                      onBlur={(e) => {
                        if (!e.target.value.trim()) setDropCapLetter('T');
                      }}
                      placeholder="T"
                      className="w-13 h-13 text-center text-2xl font-extrabold border-2 border-purple-300 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-200 focus:outline-none bg-white text-purple-900 shadow-sm"
                    />
                  </div>

                  {/* Live Rendered Paragraph Preview */}
                  <div className="flex-1 min-w-0 bg-white rounded-xl p-3 border border-purple-200 shadow-2xs overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" /> Preview
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium truncate ml-2">{selectedStyle.label}</span>
                    </div>
                    <div className="text-xs font-serif text-slate-800 leading-relaxed overflow-hidden">
                      {selectedStyle.id === 'boxed' ? (
                        <span className="float-left bg-purple-600 text-white font-bold text-lg px-2 py-0.5 rounded mr-2 mb-0.5 leading-none shadow-2xs">
                          {activeLetter}
                        </span>
                      ) : selectedStyle.id === 'elegant' ? (
                        <span className="float-left text-purple-600 font-bold text-3xl leading-[0.8] mr-1.5 font-serif">
                          {activeLetter}
                        </span>
                      ) : selectedStyle.id === 'outlined' ? (
                        <span
                          className="float-left text-transparent font-bold text-3xl leading-[0.8] mr-1.5 font-serif"
                          style={{ WebkitTextStroke: '1.5px #7c3aed' }}
                        >
                          {activeLetter}
                        </span>
                      ) : (
                        <span className="float-left text-slate-900 font-bold text-3xl leading-[0.8] mr-1.5 font-serif">
                          {activeLetter}
                        </span>
                      )}
                      <span className="line-clamp-2">{sampleText}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Medium-Sized Style Cards (Clean 2-column or 4-column layout) */}
              <div className="mb-2">
                <label className="text-[11px] font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                  Choose Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                  {DROP_CAP_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedDropCap(style.id)}
                      className={`relative p-2.5 rounded-xl border-2 text-left transition-all overflow-hidden flex flex-col items-center text-center ${
                        selectedDropCap === style.id
                          ? 'border-purple-600 bg-purple-50/70 shadow-sm ring-1 ring-purple-200'
                          : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/20'
                      }`}
                    >
                      {/* Letter Icon Box */}
                      <div className={`w-full h-12 rounded-lg flex items-center justify-center mb-2 border overflow-hidden ${style.cardBgClass}`}>
                        <span style={style.previewCardStyle} className="select-none leading-none">
                          {activeLetter}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-900 w-full truncate">{style.label}</p>
                      <p className="text-[10px] text-slate-500 w-full truncate mt-0.5">{style.desc}</p>

                      {selectedDropCap === style.id && (
                        <div className="absolute top-1.5 right-1.5">
                          <div className="w-3.5 h-3.5 rounded-full bg-purple-600 flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={handleInsertDropCap}
                disabled={!editor}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                  inserted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40'
                }`}
              >
                {inserted ? (
                  <>
                    <Check className="w-4 h-4" /> Drop Cap Inserted!
                  </>
                ) : (
                  `Insert "${activeLetter}" Drop Cap (${selectedStyle.label})`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
