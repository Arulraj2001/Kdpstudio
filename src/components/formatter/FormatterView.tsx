import React, { useState, useMemo, useEffect } from 'react';
import { FormatterSettingsPanel } from './FormatterSettingsPanel';
import { FormatterInputPanel } from './FormatterInputPanel';
import { FormatterLivePreview } from './FormatterLivePreview';
import { FormatterExportBar } from './FormatterExportBar';
import { detectStructure, extractAutoMetadata } from '../../utils/parseManuscript';
import { calculateStats, extractChapterNavigation } from '../../utils/calculateStats';
import { KdpFormatSettings, ContentBlock } from '../../types/formatter';
import { Sparkles, BookOpen, Layers } from 'lucide-react';

const INITIAL_SAMPLE_MANUSCRIPT = `# THE ASSERTIVE NURSE
## Practical Communication & De-escalation Workbook

# PART ONE: THE FOUNDATION

## CHAPTER 1: KNOW YOUR COMMUNICATION STYLE

Clear communication in clinical settings saves lives. When nurses communicate with conviction, patient outcomes improve, medication errors decrease, and team cohesion strengthens.

### The Assertive Spectrum
Assertiveness is not aggressiveness. It is the direct, honest, and appropriate expression of your thoughts, feelings, and beliefs.

#### Passive vs. Assertive Response

| Communication Style | Tone | Non-Verbal Cues | Clinical Outcome |
| Passive | Hesitant, apologetic | Downward gaze, soft voice | Unaddressed safety concerns |
| Assertive | Clear, calm, direct | Eye contact, upright posture | Rapid resolution & safety |
| Aggressive | Demanding, hostile | Raised voice, finger pointing | Escalated conflict & errors |

EXERCISE 1.1: IDENTIFYING YOUR DEFAULT PATTERN
Reflect on your last shift. Describe a clinical encounter where you hesitated to speak up to an attending physician or senior colleague:

___
___
___

SCENARIO A: THE MEDICATION DISCREPANCY
A senior physician writes an order for a dosage that exceeds hospital guidelines for a renal patient. You must intervene before administration.

MODEL RESPONSE:
"Doctor Smith, I am reviewing Mrs. Gable's chart and noticed the potassium order is 40 mEq. Her latest creatinine is 2.4. Hospital protocol recommends holding potassium or reducing to 10 mEq. Could we adjust this order?"

DEBRIEF:
Notice how the statement uses objective data (Mrs. Gable's creatinine of 2.4) rather than personal opinion. This depersonalizes the correction and centers patient safety.

REFLECTION PROMPT:
What internal fears arise when challenging a senior provider's prescription? Write down two grounding phrases you can use before speaking:

___
___
`;

export const FormatterView: React.FC = () => {
  const [rawText, setRawText] = useState<string>(INITIAL_SAMPLE_MANUSCRIPT);
  const [parsedBlocks, setParsedBlocks] = useState<ContentBlock[]>(() =>
    detectStructure(INITIAL_SAMPLE_MANUSCRIPT)
  );
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [targetBlockIndex, setTargetBlockIndex] = useState<number | null>(null);

  // KDP Format Settings State
  const [settings, setSettings] = useState<KdpFormatSettings>(() => ({
    trimSize: '7x10',
    trimWidth: 7,
    trimHeight: 10,
    font: 'Georgia',
    fontSize: 22, // 11pt
    fontSizeLabel: '11pt',
    lineSpacing: '1.15',
    lineSpacingValue: 276,
    marginPreset: 'workbook',
    margins: { inside: 0.75, outside: 0.625, top: 0.75, bottom: 0.75 },
    paperColor: 'white',
    interiorColor: 'bw',
    formatExerciseBoxes: true,
    formatScenarioBlocks: true,
    formatModelResponses: true,
    formatDebriefBlocks: true,
    formatReflectionPrompts: true,
    addWritingLines: true,
    chapterPageBreaks: false,
    generateTocPlaceholder: true,
    title: 'The Assertive Nurse',
    subtitle: 'Practical Communication & De-escalation Workbook',
    author: '',
  }));

  // Automatically parse and update metadata on initial load
  useEffect(() => {
    const blocks = detectStructure(INITIAL_SAMPLE_MANUSCRIPT);
    setParsedBlocks(blocks);
    const { title, subtitle } = extractAutoMetadata(blocks);
    if (title) setSettings((prev) => ({ ...prev, title: title || prev.title, subtitle: subtitle || prev.subtitle }));
  }, []);

  const handleParse = () => {
    setIsParsing(true);
    setTimeout(() => {
      const blocks = detectStructure(rawText);
      setParsedBlocks(blocks);
      const { title, subtitle } = extractAutoMetadata(blocks);
      if (title && !settings.title) {
        setSettings((prev) => ({ ...prev, title, subtitle }));
      }
      setIsParsing(false);
    }, 120);
  };

  const handleUpdateSettings = (newPartial: Partial<KdpFormatSettings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }));
  };

  const stats = useMemo(
    () => calculateStats(parsedBlocks, rawText),
    [parsedBlocks, rawText]
  );

  const chapterNodes = useMemo(
    () => extractChapterNavigation(parsedBlocks),
    [parsedBlocks]
  );

  const handleSelectChapter = (blockIndex: number) => {
    setTargetBlockIndex(blockIndex);
  };

  return (
    <div className="space-y-4">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-purple-600" />
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              KDP Formatter — Manuscript to KDP-Ready DOCX
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Parse your manuscript, preview print styling, and export 100% compliant KDP Word documents (.docx) with mirror margins and custom exercise boxes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
            Trim: {settings.trimSize} ({settings.trimWidth}" × {settings.trimHeight}")
          </span>
          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
            Font: {settings.font} {settings.fontSizeLabel}
          </span>
        </div>
      </div>

      {/* 2. Three-Panel Layout (Left Settings, Center Input, Right Live Preview) */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        {/* Left Panel: Format Settings (280px fixed on desktop) */}
        <FormatterSettingsPanel
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          stats={stats}
          chapterNodes={chapterNodes}
          onSelectChapter={handleSelectChapter}
        />

        {/* Center Panel: Input / Paste & Upload Tabs (flex-1) */}
        <FormatterInputPanel
          rawText={rawText}
          onChangeText={setRawText}
          onParse={handleParse}
          isParsing={isParsing}
          wordCount={stats.wordCount}
        />

        {/* Right Panel: Live Preview (400px fixed on desktop) */}
        <FormatterLivePreview
          blocks={parsedBlocks}
          settings={settings}
          stats={stats}
          targetBlockIndex={targetBlockIndex}
        />
      </div>

      {/* 3. Bottom Export Action Bar */}
      <FormatterExportBar
        blocks={parsedBlocks}
        settings={settings}
        stats={stats}
        disabled={parsedBlocks.length === 0}
      />
    </div>
  );
};
