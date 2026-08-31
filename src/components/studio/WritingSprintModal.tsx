import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Flame, Trophy, Coffee, ChevronUp, ChevronDown, Zap } from 'lucide-react';

interface WritingSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWordCount: number;
  bookTitle: string;
}

type SprintDuration = 5 | 10 | 15 | 20 | 25 | 30 | 45 | 60;

const PRESET_DURATIONS: { label: string; minutes: SprintDuration; desc: string }[] = [
  { label: '5m', minutes: 5, desc: 'Quick flash' },
  { label: '10m', minutes: 10, desc: 'Short burst' },
  { label: '15m', minutes: 15, desc: 'Pomodoro lite' },
  { label: '25m', minutes: 25, desc: 'Pomodoro' },
  { label: '30m', minutes: 30, desc: 'Half hour' },
  { label: '45m', minutes: 45, desc: 'Power sprint' },
  { label: '60m', minutes: 60, desc: 'Deep work' },
];

const MOTIVATIONAL_QUOTES = [
  "The first draft is just you telling yourself the story. — Terry Pratchett",
  "You can always edit a bad page. You can't edit a blank page. — Jodi Picoult",
  "Write drunk, edit sober. — Ernest Hemingway",
  "Just write every day of your life. — Ray Bradbury",
  "The scariest moment is always just before you start. — Stephen King",
  "Writing is rewriting. The first draft is just the beginning. — Michael Crichton",
  "Start writing, no matter what. The water does not flow until the faucet is turned on. — Louis L'Amour",
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const WritingSprintModal: React.FC<WritingSprintModalProps> = ({
  isOpen,
  onClose,
  currentWordCount,
  bookTitle,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<SprintDuration>(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startWordCount, setStartWordCount] = useState(currentWordCount);
  const [streak, setStreak] = useState(() => {
    try { return Number(localStorage.getItem('kdp_sprint_streak') || '0'); } catch { return 0; }
  });
  const [totalSprints, setTotalSprints] = useState(() => {
    try { return Number(localStorage.getItem('kdp_sprint_total') || '0'); } catch { return 0; }
  });
  const [quote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  const [wordsWrittenInSprint, setWordsWrittenInSprint] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endSoundRef = useRef<boolean>(false);

  const totalSeconds = selectedMinutes * 60;
  const elapsed = totalSeconds - secondsLeft;
  const progress = elapsed / totalSeconds;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const wordsThisSprint = currentWordCount - startWordCount;

  useEffect(() => {
    if (!isOpen) {
      clearInterval(intervalRef.current!);
      setIsRunning(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setIsFinished(true);
            handleSprintComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  const handleSprintComplete = useCallback(() => {
    const newStreak = streak + 1;
    const newTotal = totalSprints + 1;
    setStreak(newStreak);
    setTotalSprints(newTotal);
    setWordsWrittenInSprint(currentWordCount - startWordCount);
    try {
      localStorage.setItem('kdp_sprint_streak', String(newStreak));
      localStorage.setItem('kdp_sprint_total', String(newTotal));
    } catch {}
  }, [streak, totalSprints, currentWordCount, startWordCount]);

  const handleStart = () => {
    setStartWordCount(currentWordCount);
    setWordsWrittenInSprint(0);
    setIsFinished(false);
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);
  const handleResume = () => setIsRunning(true);

  const handleReset = () => {
    clearInterval(intervalRef.current!);
    setIsRunning(false);
    setIsFinished(false);
    setSecondsLeft(selectedMinutes * 60);
    setWordsWrittenInSprint(0);
  };

  const handleSelectDuration = (min: SprintDuration) => {
    if (isRunning) return;
    setSelectedMinutes(min);
    setSecondsLeft(min * 60);
    setIsFinished(false);
  };

  const wpm = elapsed > 0 ? Math.round((wordsThisSprint / (elapsed / 60))) : 0;

  if (!isOpen) return null;

  const ringColor = isFinished ? '#22c55e' : isRunning ? '#7c3aed' : '#94a3b8';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <Zap className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Writing Sprint</h2>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">{bookTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Streak badge */}
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-100 rounded-full">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs font-bold text-orange-700">{streak} streak</span>
              </div>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Timer Ring */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-40 h-40">
              <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
                <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle
                  cx="80" cy="80" r={radius}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.3s' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold font-mono tabular-nums ${isFinished ? 'text-emerald-600' : isRunning ? 'text-violet-700' : 'text-slate-700'}`}>
                  {isFinished ? '🎉' : formatTime(secondsLeft)}
                </span>
                {isRunning && (
                  <span className="text-[10px] text-violet-500 font-semibold animate-pulse mt-1">WRITING</span>
                )}
                {isFinished && (
                  <span className="text-[10px] text-emerald-600 font-bold mt-1">DONE!</span>
                )}
              </div>
            </div>

            {/* Stats during sprint */}
            {(isRunning || isFinished) && (
              <div className="flex items-center gap-4 mt-4 text-center">
                <div>
                  <p className="text-xs text-slate-400">Words Written</p>
                  <p className="text-lg font-bold text-violet-700">{Math.max(0, wordsThisSprint).toLocaleString()}</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <p className="text-xs text-slate-400">WPM</p>
                  <p className="text-lg font-bold text-slate-800">{wpm}</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <p className="text-xs text-slate-400">Total Words</p>
                  <p className="text-lg font-bold text-slate-800">{currentWordCount.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Duration Selector */}
          {!isRunning && !isFinished && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sprint Duration</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {PRESET_DURATIONS.map((d) => (
                  <button
                    key={d.minutes}
                    onClick={() => handleSelectDuration(d.minutes)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedMinutes === d.minutes
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Motivational Quote */}
          {!isRunning && !isFinished && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-slate-600 italic leading-relaxed">"{quote}"</p>
            </div>
          )}

          {/* Finish Card */}
          {isFinished && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 text-center">
              <Trophy className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-800 mb-1">Sprint Complete! 🎉</p>
              <p className="text-xs text-emerald-700">You wrote <strong>{Math.max(0, wordsWrittenInSprint)} words</strong> in {selectedMinutes} minutes.</p>
              {streak >= 3 && (
                <p className="text-xs text-orange-600 font-semibold mt-1">🔥 {streak}-sprint streak! You're on fire!</p>
              )}
              <p className="text-xs text-emerald-600 mt-2">Total completed sprints: {totalSprints}</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
            {!isRunning && !isFinished && (
              <button
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-lg transition-all hover:shadow-violet-200 hover:shadow-xl"
              >
                <Play className="w-4 h-4 fill-white" />
                Start {selectedMinutes}m Sprint
              </button>
            )}
            {isRunning && (
              <>
                <button
                  onClick={handlePause}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
                <button
                  onClick={handleReset}
                  className="p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
            {!isRunning && isFinished && (
              <>
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Sprint
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Done
                </button>
              </>
            )}
            {!isRunning && !isFinished && streak > 0 && (
              <button
                onClick={handleReset}
                title="Reset streak"
                className="p-3 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Total stats footer */}
          {totalSprints > 0 && (
            <p className="text-center text-xs text-slate-400 mt-4">
              {totalSprints} total sprint{totalSprints !== 1 ? 's' : ''} completed · {(totalSprints * selectedMinutes).toLocaleString()} minutes of focused writing
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
