import React, { useRef, useEffect } from 'react';
import {
  ContentBlock,
  KdpFormatSettings,
  FormatterStats,
} from '../../types/formatter';
import { cleanText } from '../../utils/generateDocx';
import { BookOpen, AlertCircle, FileSpreadsheet, Eye } from 'lucide-react';

interface FormatterLivePreviewProps {
  blocks: ContentBlock[];
  settings: KdpFormatSettings;
  stats: FormatterStats;
  targetBlockIndex: number | null;
}

export const FormatterLivePreview: React.FC<FormatterLivePreviewProps> = ({
  blocks,
  settings,
  stats,
  targetBlockIndex,
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

  // Render markdown inline bold/italic
  const renderFormattedText = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return <em key={idx}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  // Render markdown table
  const renderTable = (block: ContentBlock) => {
    const rawLines = block.lines || block.text.split('\n');
    const tableRows = rawLines
      .filter((line) => !line.match(/^\|[\s\-:]+\|/)) // remove separator row
      .map((line) =>
        line
          .split('|')
          .filter((_, i, arr) => i > 0 && i < arr.length - 1)
          .map((cell) => cell.trim())
      );

    if (tableRows.length === 0) return null;

    const [headerRow, ...bodyRows] = tableRows;

    return (
      <table className="preview-table">
        <thead>
          <tr>
            {headerRow.map((col, idx) => (
              <th key={idx}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const fontStyle = {
    fontFamily:
      settings.font === 'Garamond'
        ? '"EB Garamond", Garamond, serif'
        : settings.font === 'Times New Roman'
        ? '"Times New Roman", Times, serif'
        : settings.font === 'Palatino'
        ? 'Palatino, "Book Antiqua", Georgia, serif'
        : 'Georgia, serif',
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
          <span>Live 7x10</span>
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
            <h4 className="text-sm font-bold text-slate-700 mb-1">Live KDP Print Preview</h4>
            <p className="text-xs max-w-xs text-slate-500 leading-relaxed">
              Paste or upload your manuscript on the left, then click <strong>"Parse &amp; Preview"</strong> to see the formatted book spread here.
            </p>
          </div>
        ) : (
          /* Styled Formatted Book Page */
          <div className="preview-page" style={fontStyle}>
            {/* Simulated Header */}
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center border-b border-slate-200 pb-1.5 mb-4">
              {settings.title || 'KDP Studio Book'}
            </div>

            {/* Block Loop */}
            {(() => {
              const firstChapterIdx = blocks.findIndex((b) => b.type === 'chapter' || b.type === 'part');
              const chapterList = blocks.filter((b) => b.type === 'chapter' || b.type === 'part');

              return blocks.map((block, idx) => {
                const isTargeted = targetBlockIndex === idx;
                const shouldRenderTocBefore = settings.generateTocPlaceholder && idx === firstChapterIdx && chapterList.length > 0;

                const blockContent = (() => {
                  switch (block.type) {
                case 'title':
                  return (
                    <div
                      key={block.id}
                      id={`preview-block-${idx}`}
                      className="text-base font-black text-center uppercase tracking-tight my-4 text-slate-900"
                    >
                      {cleanText(block.text)}
                    </div>
                  );

                case 'subtitle':
                  return (
                    <div
                      key={block.id}
                      id={`preview-block-${idx}`}
                      className="text-xs italic text-center text-slate-600 mb-5"
                    >
                      {cleanText(block.text)}
                    </div>
                  );

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

                case 'chapter':
                  return (
                    <div
                      key={block.id}
                      id={`preview-block-${idx}`}
                      className={`preview-chapter ${isTargeted ? 'bg-purple-100/60 ring-2 ring-purple-400 rounded' : ''}`}
                    >
                      {cleanText(block.text)}
                    </div>
                  );

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

                case 'exercise_header':
                  return (
                    <div key={block.id} id={`preview-block-${idx}`} className="preview-exercise">
                      <div className="preview-exercise-header">{cleanText(block.text)}</div>
                    </div>
                  );

                case 'exercise_body':
                  return (
                    <div key={block.id} id={`preview-block-${idx}`} className="preview-exercise-body">
                      <p className="preview-paragraph">{renderFormattedText(block.text)}</p>
                    </div>
                  );

                case 'scenario_header':
                  return (
                    <div key={block.id} id={`preview-block-${idx}`} className="preview-scenario">
                      <div className="preview-scenario-header">{cleanText(block.text)}</div>
                    </div>
                  );

                case 'scenario_body':
                  return (
                    <div key={block.id} id={`preview-block-${idx}`} className="p-2">
                      <p className="preview-paragraph">{renderFormattedText(block.text)}</p>
                    </div>
                  );

                case 'model_response':
                  return (
                    <div key={block.id} id={`preview-block-${idx}`} className="preview-model-response">
                      <div className="font-bold uppercase text-[8px] text-slate-500 mb-0.5 tracking-wider">
                        Model Response
                      </div>
                      <div>{renderFormattedText(cleanText(block.text).replace(/^MODEL RESPONSE[:—]?\s*/i, ''))}</div>
                    </div>
                  );

                case 'debrief':
                  return (
                    <div key={block.id} id={`preview-block-${idx}`} className="preview-debrief">
                      <div className="font-bold uppercase text-[8px] text-slate-600 mb-0.5 tracking-wider">
                        Debrief
                      </div>
                      <div>{renderFormattedText(cleanText(block.text).replace(/^DEBRIEF[:—]?\s*/i, ''))}</div>
                    </div>
                  );

                case 'reflection':
                  return (
                    <div key={block.id} id={`preview-block-${idx}`} className="preview-reflection">
                      <div className="font-bold text-[9px] text-slate-800 mb-0.5">Reflection Prompt</div>
                      <div>{renderFormattedText(block.text)}</div>
                    </div>
                  );

                case 'action':
                  return (
                    <div key={block.id} id={`preview-block-${idx}`} className="font-bold text-[11px] text-slate-900 my-2">
                      {cleanText(block.text)}
                    </div>
                  );

                case 'lines':
                  return (
                    <div key={block.id} id={`preview-block-${idx}`} className="my-2">
                      <div className="preview-writing-lines" />
                      <div className="preview-writing-lines" />
                      <div className="preview-writing-lines" />
                    </div>
                  );

                case 'table':
                  return <div key={block.id} id={`preview-block-${idx}`}>{renderTable(block)}</div>;

                case 'divider':
                  return <hr key={block.id} id={`preview-block-${idx}`} className="border-t border-slate-300 my-3" />;

                case 'blank':
                  return <div key={block.id} className="h-2" />;

                case 'paragraph':
                default:
                  return (
                    <p key={block.id} id={`preview-block-${idx}`} className="preview-paragraph">
                      {renderFormattedText(block.text)}
                    </p>
                  );
              }
            })();

            return (
              <React.Fragment key={block.id || idx}>
                {shouldRenderTocBefore && (
                  <div className="my-6 p-4 rounded bg-slate-50 border border-slate-200/90 text-xs">
                    <div className="text-center font-bold text-xs uppercase tracking-widest text-slate-800 mb-3 border-b border-slate-200 pb-1.5">
                      Table of Contents
                    </div>
                    <div className="space-y-1.5">
                      {chapterList.map((ch, cIdx) => (
                        <div key={cIdx} className="flex items-center justify-between text-[10px] text-slate-700">
                          <span className={ch.type === 'part' ? 'font-bold text-slate-900' : 'font-medium truncate max-w-[200px]'}>
                            {cleanText(ch.text)}
                          </span>
                          <span className="text-slate-400 font-mono">. . . . . . . [ ... ]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {blockContent}
              </React.Fragment>
            );
          });
        })()}

            {/* Simulated Footer */}
            <div className="text-[8px] font-mono text-slate-400 text-center border-t border-slate-200 pt-1.5 mt-6">
              1
            </div>
          </div>
        )}
      </div>

      {/* Embedded CSS for Exact KDP Preview Styling */}
      <style>{`
        .preview-page {
          width: 350px;
          background: white;
          padding: 28px 24px;
          font-family: Georgia, serif;
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
          border: 1px solid #000;
          margin: 10px 0 4px;
          border-radius: 2px;
          overflow: hidden;
        }

        .preview-exercise-header {
          background: #EEEEEE;
          padding: 4px 8px;
          font-weight: bold;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #000;
        }

        .preview-exercise-body {
          padding: 6px 8px;
          background: #FAFAFA;
          border-left: 1px solid #000;
          border-right: 1px solid #000;
          border-bottom: 1px solid #000;
          margin-top: -4px;
          margin-bottom: 10px;
        }

        .preview-scenario {
          border: 1px solid #1A6B72;
          margin: 10px 0 4px;
          border-radius: 2px;
          overflow: hidden;
        }

        .preview-scenario-header {
          background: #1A6B72;
          color: white;
          padding: 4px 8px;
          font-weight: bold;
          font-size: 9px;
          text-transform: uppercase;
        }

        .preview-model-response {
          background: #F8F8F8;
          padding: 6px 8px;
          font-style: italic;
          margin: 6px 0;
          font-size: 10px;
          border-left: 3px solid #AAAAAA;
        }

        .preview-debrief {
          padding: 6px 8px;
          margin: 6px 0;
          border-left: 3px solid #888;
          font-size: 10px;
          background: #FDFDFD;
        }

        .preview-reflection {
          background: #F5F5F5;
          padding: 6px 8px;
          font-style: italic;
          margin: 6px 0;
          font-size: 10px;
          border-radius: 2px;
        }

        .preview-writing-lines {
          border-bottom: 1px solid #333;
          height: 18px;
          margin: 4px 0;
        }

        .preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
          margin: 8px 0;
        }

        .preview-table th {
          background: #EEEEEE;
          border: 0.5px solid #000;
          padding: 3px 5px;
          text-align: left;
          font-weight: bold;
        }

        .preview-table td {
          border: 0.5px solid #000;
          padding: 3px 5px;
        }

        .preview-paragraph {
          margin: 0 0 6px 0;
          text-align: left;
          line-height: 1.35;
        }
      `}</style>
    </div>
  );
};
