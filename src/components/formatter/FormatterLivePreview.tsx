import React, { useRef, useEffect } from 'react';
import {
  ContentBlock,
  KdpFormatSettings,
  FormatterStats,
} from '../../types/formatter';
import { cleanText } from '../../utils/generateDocx';
import { BookOpen, Eye } from 'lucide-react';

interface FormatterLivePreviewProps {
  blocks: ContentBlock[];
  settings: KdpFormatSettings;
  stats: FormatterStats;
  targetBlockIndex: number | null;
  parsedButEmpty?: boolean;
}

export const FormatterLivePreview: React.FC<FormatterLivePreviewProps> = ({
  blocks,
  settings,
  stats,
  targetBlockIndex,
  parsedButEmpty = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Scroll to targeted chapter block when selected from navigator
  useEffect(() => {
    if (targetBlockIndex !== null && containerRef.current) {
      const el = containerRef.current.querySelector(`#preview-block-${targetBlockIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [targetBlockIndex]);

  // Render markdown inline bold/italic & unescape lines cleanly
  const renderFormattedText = (text: string) => {
    if (!text) return '';

    // Check if entire text line represents blank response lines
    const trimmed = text.trim();
    if (
      /^(\\_{1,}|_{1,}|\s){3,}$/.test(trimmed) ||
      /^_{3,}$/.test(trimmed) ||
      /^[_\-—\s]{4,}$/.test(trimmed)
    ) {
      if (!settings.addWritingLines) return null;
      return (
        <div className="my-1.5 space-y-1">
          <div className="preview-writing-lines" />
          <div className="preview-writing-lines" />
        </div>
      );
    }

    // Unescape markdown brackets, asterisks, and backslashes
    const clean = text
      .replace(/\\\[/g, '[')
      .replace(/\\\]/g, ']')
      .replace(/\\\*/g, '*');

    const parts = clean.split(/(\*\*.*?\*\*|\*.*?\*|\\_{3,}|_{3,})/g);
    return parts.map((part, idx) => {
      if (!part) return null;
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return <em key={idx}>{part.slice(1, -1)}</em>;
      }
      if (/^(\\_{3,}|_{3,})/.test(part)) {
        if (!settings.addWritingLines) return null;
        return <div key={idx} className="preview-writing-lines my-1" />;
      }
      return part.replace(/\\_/g, '_');
    });
  };

  // Render markdown table with column alignments and modern editorial styling
  const renderTable = (block: ContentBlock) => {
    const rawLines = block.lines || block.text.split('\n');
    const separatorLine = rawLines.find((line) => line.match(/^\|[\s\-:]+\|/));
    const alignments: ('left' | 'center' | 'right')[] = [];

    if (separatorLine) {
      const segs = separatorLine.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
      segs.forEach((seg) => {
        const trimmed = seg.trim();
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) alignments.push('center');
        else if (trimmed.endsWith(':')) alignments.push('right');
        else alignments.push('left');
      });
    }

    const tableRows = rawLines
      .filter((line) => !line.match(/^\|[\s\-:]+\|/))
      .map((line) =>
        line
          .split('|')
          .filter((_, i, arr) => i > 0 && i < arr.length - 1)
          .map((cell) => cell.trim())
      );

    if (tableRows.length === 0) return null;
    const [headerRow, ...bodyRows] = tableRows;

    return (
      <div className="preview-table-container my-3.5 overflow-hidden rounded-lg border border-slate-200 shadow-2xs">
        <table className="preview-table">
          <thead>
            <tr>
              {headerRow.map((col, idx) => (
                <th key={idx} style={{ textAlign: alignments[idx] || 'left' }}>
                  {renderFormattedText(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 1 ? 'preview-table-alt' : ''}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} style={{ textAlign: alignments[cIdx] || 'left' }}>
                    {renderFormattedText(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // The preview page is 350px wide, representing the trim width (default 7").
  // Scale factor: pixels per inch in preview = 350 / trimW
  // To convert pt → preview-px: ptVal × (previewPxPerInch / 72)
  const trimW = settings.trimWidth || 7;
  const previewPxPerInch = 350 / trimW;           // e.g. 50 px/inch for 7" trim
  const previewPxPerPt   = previewPxPerInch / 72; // e.g. ≈0.694 px/pt for 7" trim

  const ptMap: Record<string, number> = { '10pt': 10, '11pt': 11, '12pt': 12 };
  const ptSize = ptMap[settings.fontSizeLabel] ?? 11;
  const scaledFontSizePx = Math.round(ptSize * previewPxPerPt * 10) / 10; // e.g. ~7.6px for 11pt at 7"

  const fontStyle = {
    fontFamily:
      settings.font === 'Garamond'
        ? '"EB Garamond", Garamond, serif'
        : settings.font === 'Times New Roman'
        ? '"Times New Roman", Times, serif'
        : settings.font === 'Palatino'
        ? 'Palatino, "Book Antiqua", Georgia, serif'
        : 'Georgia, serif',
    fontSize: `${scaledFontSizePx}px`,
    lineHeight: settings.lineSpacing || '1.15',
    padding: `${Math.round((settings.margins?.top ?? 0.75) * previewPxPerInch)}px ${Math.round((settings.margins?.outside ?? 0.625) * previewPxPerInch)}px ${Math.round((settings.margins?.bottom ?? 0.75) * previewPxPerInch)}px ${Math.round((settings.margins?.inside ?? 0.75) * previewPxPerInch)}px`,
  };

  const renderToc = (chapterList: ContentBlock[]) => (
    <div className="my-6 p-4 rounded-lg bg-slate-50 border border-slate-200/90 text-xs">
      <div className="text-center font-bold text-xs uppercase tracking-widest text-slate-800 mb-3 border-b border-slate-200 pb-1.5">
        Table of Contents
      </div>
      <div className="space-y-1.5">
        {chapterList.map((ch, cIdx) => {
          const isPart = ch.type === 'part';
          return (
            <div key={cIdx} className={`flex items-baseline gap-1 ${isPart ? 'mt-2' : 'pl-3'}`}>
              <span className={`flex-1 min-w-0 ${isPart ? 'font-bold text-slate-900 text-[10px]' : 'font-medium text-slate-700 text-[9.5px]'}`}>
                {cleanText(ch.text)}
              </span>
              <span className="shrink-0 whitespace-nowrap text-slate-400 font-mono text-[9px]">· · · · ·  [ — ]</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderBodyBlock = (block: ContentBlock, idx: number) => {
    switch (block.type) {
      case 'lines': {
        if (!settings.addWritingLines) return null;
        const lineCount = block.metadata?.lineCount ?? 1;
        return (
          <div key={block.id || idx} id={`preview-block-${idx}`} className="my-2 space-y-1">
            {Array.from({ length: lineCount }).map((_, li) => (
              <div key={li} className="preview-writing-lines" />
            ))}
          </div>
        );
      }

      case 'model_response':
        if (settings.formatModelResponses) {
          return (
            <div key={block.id || idx} id={`preview-block-${idx}`} className="preview-model-response">
              <div className="font-bold uppercase text-[8.5px] text-slate-600 mb-0.5 tracking-wider">
                Model Response
              </div>
              <div>{renderFormattedText(cleanText(block.text).replace(/^MODEL RESPONSE[:—]?\s*/i, ''))}</div>
            </div>
          );
        }
        return (
          <div key={block.id || idx} id={`preview-block-${idx}`} className="font-bold text-[10px] text-slate-800 my-1">
            {cleanText(block.text)}
          </div>
        );

      case 'debrief':
        if (settings.formatDebriefBlocks) {
          return (
            <div key={block.id || idx} id={`preview-block-${idx}`} className="preview-debrief">
              <div className="font-bold uppercase text-[8.5px] text-slate-600 mb-0.5 tracking-wider">
                Debrief
              </div>
              <div>{renderFormattedText(cleanText(block.text).replace(/^DEBRIEF[:—]?\s*/i, ''))}</div>
            </div>
          );
        }
        return (
          <div key={block.id || idx} id={`preview-block-${idx}`} className="font-bold text-[10px] text-slate-800 my-1">
            {cleanText(block.text)}
          </div>
        );

      case 'blank':
        return <div key={block.id || idx} className="h-1.5" />;

      case 'action':
        if (settings.formatActionPlans ?? true) {
          return (
            <div key={block.id || idx} id={`preview-block-${idx}`} className="my-2 p-2 rounded bg-amber-50/80 border-l-2 border-amber-500 text-[10px]">
              <div className="font-bold uppercase text-[8.5px] text-amber-900 mb-0.5 tracking-wider">Action Plan</div>
              <div>{renderFormattedText(cleanText(block.text).replace(/^ACTION PLAN[:—]?\s*/i, ''))}</div>
            </div>
          );
        }
        return (
          <p key={block.id || idx} id={`preview-block-${idx}`} className="preview-paragraph">
            {renderFormattedText(cleanText(block.text).replace(/^ACTION PLAN[:—]?\s*/i, ''))}
          </p>
        );

      case 'list': {
        // Render list block as <ul> or <ol>
        const listItems: string[] = block.metadata?.items ?? block.text.split('\n').filter(Boolean);
        const isOrdered = block.metadata?.ordered ?? false;
        const Tag = isOrdered ? 'ol' : 'ul';
        return (
          <Tag key={block.id || idx} id={`preview-block-${idx}`} className="preview-list">
            {listItems.map((item, li) => (
              <li key={li}>{renderFormattedText(item)}</li>
            ))}
          </Tag>
        );
      }

      case 'exercise_body':
      case 'scenario_body':
      case 'paragraph':
      default:
        return (
          <p key={block.id || idx} id={`preview-block-${idx}`} className="preview-paragraph">
            {renderFormattedText(block.text)}
          </p>
        );
    }
  };

  const renderSingleBlock = (block: ContentBlock, idx: number, isTargeted: boolean) => {
    switch (block.type) {
      case 'title':
        return (
          <div
            key={block.id}
            id={`preview-block-${idx}`}
            className="text-base font-black text-center uppercase tracking-tight my-5 text-slate-900 border-b-2 border-slate-900 pb-3"
          >
            {cleanText(block.text)}
          </div>
        );

      case 'subtitle':
        return (
          <div
            key={block.id}
            id={`preview-block-${idx}`}
            className="text-xs italic font-medium text-center text-slate-600 mb-5 px-3 max-w-full mx-auto leading-relaxed"
          >
            {cleanText(block.text)}
          </div>
        );

      case 'front_matter': {
        const fmText = cleanText(block.text);
        const isDedication = /DEDICATION/i.test(fmText);
        return (
          <React.Fragment key={block.id}>
            <div className="preview-page-break" />
            <div
              id={`preview-block-${idx}`}
              className={`my-6 text-center ${isDedication ? 'pt-8 pb-4' : ''}`}
            >
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 pb-1 border-b border-slate-300 inline-block px-4">
                {fmText}
              </div>
            </div>
          </React.Fragment>
        );
      }

      case 'part':
        return (
          <div
            key={block.id}
            id={`preview-block-${idx}`}
            className="preview-part-header"
          >
            {cleanText(block.text)}
          </div>
        );

      case 'chapter': {
        const fullTitle = cleanText(block.text);
        const match = fullTitle.match(/^(CHAPTER\s+\d+|Chapter\s+\d+|PROLOGUE|EPILOGUE|CONCLUSION|INTRODUCTION)[:—\-]\s*(.*)$/i);
        return (
          <div
            key={block.id}
            id={`preview-block-${idx}`}
            className={`my-6 ${isTargeted ? 'bg-purple-100/60 ring-2 ring-purple-400 rounded-lg p-2' : ''}`}
          >
            {match ? (
              <div className="text-center space-y-1">
                <div className="text-[9.5px] font-black uppercase tracking-[0.2em] text-purple-700 font-sans">
                  {match[1]}
                </div>
                <div className="text-sm sm:text-[15px] font-bold text-slate-900 leading-tight">
                  {match[2] || match[1]}
                </div>
                <div className="w-8 h-0.5 bg-slate-300 mx-auto mt-2" />
              </div>
            ) : (
              <div className="preview-chapter">
                {fullTitle}
              </div>
            )}
          </div>
        );
      }

      case 'section':
        return (
          <div
            key={block.id}
            id={`preview-block-${idx}`}
            className="preview-section"
          >
            {cleanText(block.text)}
          </div>
        );

      case 'subsection':
        return (
          <div
            key={block.id}
            id={`preview-block-${idx}`}
            className="preview-subsection"
          >
            {cleanText(block.text)}
          </div>
        );

      case 'model_response':
        if (settings.formatModelResponses) {
          return (
            <div key={block.id} id={`preview-block-${idx}`} className="preview-model-response">
              <div className="font-bold uppercase text-[8.5px] text-slate-600 mb-0.5 tracking-wider">
                Model Response
              </div>
              <div>{renderFormattedText(cleanText(block.text).replace(/^MODEL RESPONSE[:—]?\s*/i, ''))}</div>
            </div>
          );
        }
        return (
          <div key={block.id} id={`preview-block-${idx}`} className="font-bold text-[11px] text-slate-900 my-2">
            {cleanText(block.text)}
          </div>
        );

      case 'debrief':
        if (settings.formatDebriefBlocks) {
          return (
            <div key={block.id} id={`preview-block-${idx}`} className="preview-debrief">
              <div className="font-bold uppercase text-[8.5px] text-slate-600 mb-0.5 tracking-wider">
                Debrief
              </div>
              <div>{renderFormattedText(cleanText(block.text).replace(/^DEBRIEF[:—]?\s*/i, ''))}</div>
            </div>
          );
        }
        return (
          <div key={block.id} id={`preview-block-${idx}`} className="font-bold text-[11px] text-slate-900 my-2">
            {cleanText(block.text)}
          </div>
        );

      case 'reflection':
        if (settings.formatReflectionPrompts) {
          return (
            <div key={block.id} id={`preview-block-${idx}`} className="preview-reflection">
              <div className="font-bold text-[9px] text-slate-800 mb-0.5">Reflection Prompt</div>
              <div>{renderFormattedText(block.text)}</div>
            </div>
          );
        }
        return (
          <div key={block.id} id={`preview-block-${idx}`} className="font-bold text-[11px] text-slate-900 my-2">
            {cleanText(block.text)}
          </div>
        );

      case 'action':
        if (settings.formatActionPlans ?? true) {
          return (
            <div key={block.id} id={`preview-block-${idx}`} className="my-3.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200 border-l-4 border-l-amber-500 text-[10.5px] text-slate-900 shadow-2xs">
              <div className="font-bold uppercase text-[9px] text-amber-950 mb-1 tracking-wider flex items-center gap-1.5">
                <span>📋 Action Plan</span>
              </div>
              <div>{renderFormattedText(cleanText(block.text).replace(/^ACTION PLAN[:—]?\s*/i, ''))}</div>
            </div>
          );
        }
        return (
          <p key={block.id} id={`preview-block-${idx}`} className="preview-paragraph">
            {renderFormattedText(cleanText(block.text).replace(/^ACTION PLAN[:—]?\s*/i, ''))}
          </p>
        );

      case 'key_takeaways':
        if (settings.formatKeyTakeaways ?? true) {
          return (
            <div key={block.id} id={`preview-block-${idx}`} className="my-3.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 border-l-4 border-l-emerald-600 text-[10.5px] text-slate-800 shadow-2xs">
              <div className="font-bold uppercase text-[9px] text-emerald-950 mb-1 tracking-wider flex items-center gap-1.5">
                <span>✦ Key Takeaways</span>
              </div>
              <div className="leading-relaxed">{renderFormattedText(cleanText(block.text).replace(/^(KEY TAKEAWAYS|Key Takeaways|SUMMARY|Summary|IN SUMMARY)[:—]?\s*/i, ''))}</div>
            </div>
          );
        }
        return (
          <div key={block.id} id={`preview-block-${idx}`} className="font-bold text-[11px] text-slate-900 my-2">
            {cleanText(block.text)}
          </div>
        );

      case 'quote':
        if (settings.formatCalloutBoxes ?? true) {
          return (
            <div key={block.id} id={`preview-block-${idx}`} className="my-3 pl-3.5 pr-2.5 py-2 border-l-3 border-purple-500 italic text-[11px] text-slate-700 bg-purple-50/30 rounded-r">
              {renderFormattedText(cleanText(block.text).replace(/^>\s*/, ''))}
            </div>
          );
        }
        return (
          <div key={block.id} id={`preview-block-${idx}`} className="preview-paragraph italic">
            {renderFormattedText(cleanText(block.text).replace(/^>\s*/, ''))}
          </div>
        );

      case 'lines': {
        if (!settings.addWritingLines) return null;
        const lineCount = block.metadata?.lineCount ?? 1;
        return (
          <div key={block.id} id={`preview-block-${idx}`} className="my-2 space-y-1">
            {Array.from({ length: lineCount }).map((_, li) => (
              <div key={li} className="preview-writing-lines" />
            ))}
          </div>
        );
      }

      case 'table':
        return <div key={block.id} id={`preview-block-${idx}`}>{renderTable(block)}</div>;

      case 'divider':
        return settings.ornamentalDividers ? (
          <div key={block.id} id={`preview-block-${idx}`} className="text-center my-4 text-slate-400 text-xs tracking-widest select-none">
            ✦ &nbsp; ✦ &nbsp; ✦
          </div>
        ) : (
          <hr key={block.id} id={`preview-block-${idx}`} className="border-t border-slate-200 my-3.5" />
        );

      case 'blank':
        return <div key={block.id} className="h-2" />;

      case 'list': {
        const listItemsSingle: string[] = block.metadata?.items ?? block.text.split('\n').filter(Boolean);
        const isOrderedSingle = block.metadata?.ordered ?? false;
        const ListTagSingle = isOrderedSingle ? 'ol' : 'ul';
        return (
          <ListTagSingle key={block.id} id={`preview-block-${idx}`} className="preview-list">
            {listItemsSingle.map((item, li) => {
              const isChecked = /^\[[xX]\]\s*/.test(item);
              const isUnchecked = /^\[\s*\]\s*/.test(item);
              const cleanItem = item.replace(/^\[[ xX]\]\s*/, '');
              return (
                <li key={li} className={isChecked || isUnchecked ? 'list-none flex items-start gap-2 my-1' : ''}>
                  {isChecked ? (
                    <span className="font-mono text-purple-600 font-bold shrink-0">☑</span>
                  ) : isUnchecked ? (
                    <span className="font-mono text-slate-400 font-bold shrink-0">▢</span>
                  ) : null}
                  <span>{renderFormattedText(cleanItem)}</span>
                </li>
              );
            })}
          </ListTagSingle>
        );
      }

      case 'paragraph':
      default:
        return (
          <p key={block.id} id={`preview-block-${idx}`} className="preview-paragraph">
            {renderFormattedText(block.text)}
          </p>
        );
    }
  };

  return (
    <div className="w-full lg:w-[400px] shrink-0 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden max-h-[calc(100vh-140px)]">
      {/* 1. Preview Stats Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-700 shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <span>📄 Pages: <strong className="font-mono text-purple-700">{stats.estimatedPages}</strong></span>
          <span className="text-slate-300">|</span>
          <span>📝 Words: <strong className="font-mono text-slate-900">{stats.wordCount.toLocaleString()}</strong></span>
          <span className="text-slate-300">|</span>
          <span>📚 Ch: <strong className="font-mono text-slate-900">{stats.chapterCount}</strong></span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-purple-700 font-bold bg-purple-100/70 px-2 py-0.5 rounded-full border border-purple-200">
          <Eye size={11} />
          <span>Live {settings.trimSize}</span>
        </div>
      </div>

      {/* 2. Scrollable Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 bg-slate-100/70 space-y-4 scrollbar-thin scrollbar-thumb-slate-300"
      >
        {blocks.length === 0 ? (
          /* Empty State */
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <BookOpen size={40} className="mb-3 text-slate-300" />
            {parsedButEmpty ? (
              <>
                <h4 className="text-sm font-bold text-amber-700 mb-1">No Structure Detected</h4>
                <p className="text-xs max-w-xs text-slate-500 leading-relaxed">
                  We couldn't detect any structure in your text. Make sure your chapter titles use <strong>#</strong> or <strong>##</strong> heading markers, or start with <strong>CHAPTER</strong>.
                </p>
              </>
            ) : (
              <>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Live KDP Print Preview</h4>
                <p className="text-xs max-w-xs text-slate-500 leading-relaxed">
                  Paste or upload your manuscript on the left, then click <strong>"Parse &amp; Preview"</strong> to see the formatted book spread here.
                </p>
              </>
            )}
          </div>
        ) : (
          /* Styled Formatted Book Page */
          <div
            className="preview-page"
            style={{
              ...fontStyle,
              background: settings.paperColor === 'cream' ? '#F5F0E8' : 'white',
            }}
          >
            {/* Simulated Header — shown only when headerFooterFolios is on */}
            {(settings.headerFooterFolios ?? true) && (
              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center border-b border-slate-200 pb-1.5 mb-4">
                {settings.title || 'KDP Studio Book'}
              </div>
            )}

            {/* Block Loop — pre-pass groups exercise+scenario headers with their body blocks */}
            {(() => {
              type GroupedBlock =
                | { kind: 'single'; block: ContentBlock; idx: number }
                | { kind: 'exercise'; header: ContentBlock; headerIdx: number; bodyBlocks: { block: ContentBlock; idx: number }[] }
                | { kind: 'scenario'; header: ContentBlock; headerIdx: number; bodyBlocks: { block: ContentBlock; idx: number }[] };

              const grouped: GroupedBlock[] = [];
              let gi = 0;
              while (gi < blocks.length) {
                const b = blocks[gi];
                if (b.type === 'exercise_header') {
                  const bodyBlocks: { block: ContentBlock; idx: number }[] = [];
                  let bi = gi + 1;
                  while (bi < blocks.length && ['exercise_body', 'lines', 'blank', 'list', 'debrief', 'reflection', 'action'].includes(blocks[bi].type)) {
                    bodyBlocks.push({ block: blocks[bi], idx: bi });
                    bi++;
                  }
                  grouped.push({ kind: 'exercise', header: b, headerIdx: gi, bodyBlocks });
                  gi = bi;
                } else if (b.type === 'scenario_header') {
                  const bodyBlocks: { block: ContentBlock; idx: number }[] = [];
                  let bi = gi + 1;
                  while (bi < blocks.length && ['scenario_body', 'lines', 'blank', 'list', 'model_response', 'debrief', 'reflection', 'action'].includes(blocks[bi].type)) {
                    bodyBlocks.push({ block: blocks[bi], idx: bi });
                    bi++;
                  }
                  grouped.push({ kind: 'scenario', header: b, headerIdx: gi, bodyBlocks });
                  gi = bi;
                } else if (b.type === 'exercise_body' || b.type === 'scenario_body') {
                  // If orphaned outside a header, still render as single block gracefully
                  grouped.push({ kind: 'single', block: b, idx: gi });
                  gi++;
                } else {
                  grouped.push({ kind: 'single', block: b, idx: gi });
                  gi++;
                }
              }

              // TOC only lists actual chapters and parts; suppressed if manuscript already contains one
              const manuscriptHasToc = blocks.some(
                (b) => b.type === 'front_matter' && /TABLE OF CONTENTS|CONTENTS/i.test(b.text)
              );
              const firstChapterGroupIdx = grouped.findIndex(
                (g) => g.kind === 'single' && (g.block.type === 'chapter' || g.block.type === 'part')
              );
              const chapterList = (!manuscriptHasToc)
                ? blocks.filter((b) => b.type === 'chapter' || b.type === 'part')
                : [];

              return grouped.map((item, gIdx) => {
                const shouldRenderTocBefore =
                  settings.generateTocPlaceholder &&
                  gIdx === firstChapterGroupIdx &&
                  chapterList.length > 0;

                if (item.kind === 'exercise') {
                  const { header, headerIdx, bodyBlocks } = item;
                  const isTargeted = targetBlockIndex === headerIdx;
                  return (
                    <React.Fragment key={header.id || headerIdx}>
                      {shouldRenderTocBefore && renderToc(chapterList)}
                      {settings.formatExerciseBoxes ? (
                        <div id={`preview-block-${headerIdx}`} className={`preview-exercise ${isTargeted ? 'ring-2 ring-purple-400' : ''}`}>
                          <div className="preview-exercise-header">{cleanText(header.text)}</div>
                          <div className="preview-exercise-body">
                            {bodyBlocks.map(({ block, idx }) => renderBodyBlock(block, idx))}
                          </div>
                        </div>
                      ) : (
                        <div id={`preview-block-${headerIdx}`} className="my-3">
                          <div className="font-bold text-[11px] text-slate-900 mb-1">{cleanText(header.text)}</div>
                          {bodyBlocks.map(({ block, idx }) => renderBodyBlock(block, idx))}
                        </div>
                      )}
                    </React.Fragment>
                  );
                }

                if (item.kind === 'scenario') {
                  const { header, headerIdx, bodyBlocks } = item;
                  const isTargeted = targetBlockIndex === headerIdx;
                  return (
                    <React.Fragment key={header.id || headerIdx}>
                      {shouldRenderTocBefore && renderToc(chapterList)}
                      {settings.formatScenarioBlocks ? (
                        <div id={`preview-block-${headerIdx}`} className={`preview-scenario ${isTargeted ? 'ring-2 ring-purple-400' : ''}`}>
                          <div className="preview-scenario-header">{cleanText(header.text)}</div>
                          <div className="preview-scenario-body">
                            {bodyBlocks.map(({ block, idx }) => renderBodyBlock(block, idx))}
                          </div>
                        </div>
                      ) : (
                        <div id={`preview-block-${headerIdx}`} className="my-3">
                          <div className="font-bold text-[11px] text-slate-900 mb-1">{cleanText(header.text)}</div>
                          {bodyBlocks.map(({ block, idx }) => renderBodyBlock(block, idx))}
                        </div>
                      )}
                    </React.Fragment>
                  );
                }

                // Single block
                const { block, idx } = item;
                const isTargeted = targetBlockIndex === idx;
                const blockContent = renderSingleBlock(block, idx, isTargeted);
                return (
                  <React.Fragment key={block.id || idx}>
                    {shouldRenderTocBefore && renderToc(chapterList)}
                    {blockContent}
                  </React.Fragment>
                );
              });
            })()}

            {/* Simulated Footer — shown only when headerFooterFolios is on */}
            {(settings.headerFooterFolios ?? true) && (
              <div className="text-[8px] font-mono text-slate-400 text-center border-t border-slate-200 pt-1.5 mt-6">
                1
              </div>
            )}
          </div>
        )}
      </div>

      {/* Embedded CSS for Exact KDP Preview Styling */}
      <style>{`
        .preview-page {
          width: 350px;
          padding: 28px 24px;
          font-size: 11px;
          line-height: 1.25;
          color: #111;
          margin: 0 auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          border-radius: 4px;
          min-height: 480px;
        }

        .preview-part-header {
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
          margin: 20px 0 8px;
          letter-spacing: 0.1em;
          color: #0f172a;
        }

        .preview-chapter {
          font-size: 13px;
          font-weight: bold;
          margin: 18px 0 10px;
          border-bottom: 1px solid #333;
          padding-bottom: 4px;
          color: #0f172a;
        }

        .preview-section {
          font-size: 12px;
          font-weight: bold;
          margin: 12px 0 6px;
          color: #1e293b;
        }

        .preview-subsection {
          font-size: 11px;
          font-weight: bold;
          font-style: italic;
          margin: 10px 0 4px;
          color: #334155;
        }

        .preview-exercise {
          border: 1px solid #E2E8F0;
          margin: 14px 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .preview-exercise-header {
          background: #F1F5F9;
          padding: 6px 10px;
          font-weight: 700;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #0F172A;
          border-bottom: 1px solid #E2E8F0;
          border-left: 3px solid #64748B;
        }

        .preview-exercise-body {
          padding: 10px 12px;
          background: #FFFFFF;
        }

        .preview-scenario {
          border: 1px solid ${settings.interiorColor === 'bw' ? '#E2E8F0' : '#CCFBF1'};
          margin: 14px 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .preview-scenario-header {
          background: ${settings.interiorColor === 'bw' ? '#334155' : '#0F766E'};
          color: #FFFFFF;
          padding: 6px 10px;
          font-weight: 700;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .preview-scenario-body {
          padding: 10px 12px;
          background: ${settings.interiorColor === 'bw' ? '#FFFFFF' : '#F0FDFA'};
        }

        .preview-model-response {
          background: #F8FAFC;
          padding: 7px 10px;
          font-style: italic;
          margin: 8px 0;
          font-size: 10px;
          border-left: 3px solid #38BDF8;
          border-radius: 0 4px 4px 0;
        }

        .preview-debrief {
          padding: 7px 10px;
          margin: 8px 0;
          border-left: 3px solid #A855F7;
          font-size: 10px;
          background: #FAF5FF;
          border-radius: 0 4px 4px 0;
        }

        .preview-reflection {
          background: #FFFBEB;
          border-left: 3px solid #F59E0B;
          padding: 8px 10px;
          font-style: italic;
          margin: 8px 0;
          font-size: 10px;
          border-radius: 0 4px 4px 0;
        }

        .preview-writing-lines {
          border-bottom: 1px solid #CBD5E1;
          height: 22px;
          margin: 3px 0;
        }

        .preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5px;
          line-height: 1.35;
        }

        .preview-table th {
          background: ${settings.interiorColor === 'bw' ? '#F4F4F5' : '#1E293B'};
          color: ${settings.interiorColor === 'bw' ? '#18181B' : '#FFFFFF'};
          padding: 6px 10px;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 8.5px;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #CBD5E1;
        }

        .preview-table td {
          padding: 6px 10px;
          color: #334155;
          border-bottom: 1px solid #E2E8F0;
        }

        .preview-table-alt td {
          background: ${settings.interiorColor === 'bw' ? '#FAFAFA' : '#F8FAFC'};
        }

        .preview-paragraph {
          margin: 0 0 6px 0;
          text-align: justify;
          line-height: 1.35;
          ${settings.paragraphIndent ? 'text-indent: 1.5em;' : ''}
        }

        .preview-list {
          margin: 4px 0 8px 14px;
          padding: 0;
          font-size: 10px;
          line-height: 1.4;
        }

        .preview-list li {
          margin-bottom: 3px;
        }

        .preview-page-break {
          border-top: 1px dashed #ccc;
          margin: 16px 0 10px;
          text-align: center;
          position: relative;
        }

        .preview-page-break::after {
          content: '— page break —';
          position: absolute;
          top: -7px;
          left: 50%;
          transform: translateX(-50%);
          background: inherit;
          padding: 0 6px;
          font-size: 7.5px;
          color: #aaa;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};
