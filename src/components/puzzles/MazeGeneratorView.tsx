import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Layers, 
  Settings2,
  Printer,
  ArrowRight
} from 'lucide-react';
import { generateMaze, MazeDifficulty, MazeShape, MazeGrid } from '../../lib/puzzles/mazeEngine';
import { SEOHead } from '../seo/SEOHead';
import { PageRoute } from '../../types';

interface MazeGeneratorViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const MazeGeneratorView: React.FC<MazeGeneratorViewProps> = ({ onNavigate }) => {
  const [difficulty, setDifficulty] = useState<MazeDifficulty>('medium');
  const [shape, setShape] = useState<MazeShape>('rectangle');
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [batchCount, setBatchCount] = useState<number>(10);
  const [maze, setMaze] = useState<MazeGrid>(() => generateMaze(20, 20, 'medium', 'rectangle'));

  const handleRegenerate = () => {
    setMaze(generateMaze(20, 20, difficulty, shape));
  };

  const handlePrintDownload = () => {
    window.print();
  };

  const cellSize = 18;
  const svgWidth = maze.width * cellSize;
  const svgHeight = maze.height * cellSize;

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20 font-sans">
      <SEOHead
        pageKey="features"
        title="Algorithmic Maze Generator with Solution Keys — KDP Studio"
        description="Generate 100% solvable high-resolution mazes for KDP puzzle books. Classic rectangular, circular, and diamond mazes with instant solution keys."
        canonicalPath="/puzzles/mazes"
      />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Compass size={14} className="text-purple-400" />
            <span>Algorithmic Puzzle Suite</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Algorithmic <span className="font-serif italic font-normal text-purple-400">Maze Generator Studio</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Create commercial-ready, 100% solvable mazes for Amazon KDP puzzle and activity books. Choose geometry, set difficulty, and export ready-to-print vector PDFs with answer keys.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT CONTROLS ── */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Settings2 size={18} className="text-purple-600" />
              <span>Maze Configuration</span>
            </h2>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Difficulty Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'easy', label: 'Easy (15×15)', desc: 'Kids & Beginners' },
                  { id: 'medium', label: 'Medium (20×20)', desc: 'Standard Adult' },
                  { id: 'hard', label: 'Hard (25×25)', desc: 'Challenging' },
                  { id: 'extreme', label: 'Extreme (35×35)', desc: 'Master Level' }
                ].map((dif) => (
                  <button
                    key={dif.id}
                    type="button"
                    onClick={() => {
                      setDifficulty(dif.id as any);
                      setMaze(generateMaze(20, 20, dif.id as any, shape));
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      difficulty === dif.id
                        ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{dif.label}</div>
                    <div className="text-[10px] text-slate-500">{dif.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Geometry Shape */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Maze Shape Geometry
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'rectangle', label: 'Rectangle' },
                  { id: 'circle', label: 'Circular' },
                  { id: 'diamond', label: 'Diamond' }
                ].map((sh) => (
                  <button
                    key={sh.id}
                    type="button"
                    onClick={() => {
                      setShape(sh.id as any);
                      setMaze(generateMaze(20, 20, difficulty, sh.id as any));
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      shape === sh.id
                        ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {sh.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Solution Toggle & Generate Actions */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={() => setShowSolution(!showSolution)}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  showSolution
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {showSolution ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showSolution ? 'Hide Solved Answer Path' : 'Show Solved Answer Path'}</span>
              </button>

              <button
                type="button"
                onClick={handleRegenerate}
                className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw size={16} />
                <span>Generate New Maze</span>
              </button>
            </div>

            {/* Batch PDF Pack */}
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-3 text-xs">
              <div className="font-bold text-purple-950 flex items-center gap-1.5">
                <Layers size={14} className="text-purple-600" />
                <span>Batch Book Generator</span>
              </div>
              <p className="text-purple-800 text-[11px] leading-relaxed">
                Generate a complete 50-page or 100-page interior PDF complete with page numbers and back-of-book answer keys.
              </p>
              <button
                type="button"
                onClick={handlePrintDownload}
                className="w-full py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Download size={14} />
                <span>Export {batchCount} Mazes + Answer Keys PDF</span>
              </button>
            </div>

          </div>

          {/* ── RIGHT: MAZE PREVIEW CANVAS ── */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col items-center justify-center text-center">
            
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="text-left">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Live Vector Maze Canvas
                </span>
                <p className="text-[11px] text-slate-500">
                  {maze.width}×{maze.height} Grid • Start (Top-Left) to Finish (Bottom-Right)
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                showSolution ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {showSolution ? 'Solution Active' : 'Puzzle View'}
              </span>
            </div>

            {/* Rendered SVG Maze */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-inner flex items-center justify-center max-w-full overflow-auto">
              <svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="max-h-[480px] w-auto"
              >
                {/* Background */}
                <rect width={svgWidth} height={svgHeight} fill="#ffffff" />

                {/* Solution Path Polyline */}
                {showSolution && maze.solutionPath.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={maze.solutionPath
                      .map(p => `${p.x * cellSize + cellSize / 2},${p.y * cellSize + cellSize / 2}`)
                      .join(' ')}
                  />
                )}

                {/* Cell Walls */}
                {maze.cells.map((row, y) =>
                  row.map((cell, x) => {
                    const cx = x * cellSize;
                    const cy = y * cellSize;
                    return (
                      <g key={`${x}-${y}`} stroke="#0f172a" strokeWidth="2" strokeLinecap="square">
                        {cell.top && <line x1={cx} y1={cy} x2={cx + cellSize} y2={cy} />}
                        {cell.right && <line x1={cx + cellSize} y1={cy} x2={cx + cellSize} y2={cy + cellSize} />}
                        {cell.bottom && <line x1={cx} y1={cy + cellSize} x2={cx + cellSize} y2={cy + cellSize} />}
                        {cell.left && <line x1={cx} y1={cy} x2={cx} y2={cy + cellSize} />}
                      </g>
                    );
                  })
                )}

                {/* Start Marker */}
                <circle
                  cx={maze.startX * cellSize + cellSize / 2}
                  cy={maze.startY * cellSize + cellSize / 2}
                  r="4"
                  fill="#8b5cf6"
                />

                {/* End Marker */}
                <circle
                  cx={maze.endX * cellSize + cellSize / 2}
                  cy={maze.endY * cellSize + cellSize / 2}
                  r="4"
                  fill="#ef4444"
                />
              </svg>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-bold text-purple-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Start Entrance
              </span>
              <span className="flex items-center gap-1.5 font-bold text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Goal Exit
              </span>
              {showSolution && (
                <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Answer Path
                </span>
              )}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
