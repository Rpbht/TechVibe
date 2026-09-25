import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface PaginationBarProps {
  currentIndex: number;
  total: number;
  isLoading?: boolean;
  onSelect: (index: number) => void;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentIndex,
  total,
  isLoading = false,
  onSelect,
}) => {
  const [jumpDraft, setJumpDraft] = useState({
    index: currentIndex,
    value: String(currentIndex + 1),
  });
  const jumpValue =
    jumpDraft.index === currentIndex
      ? jumpDraft.value
      : String(currentIndex + 1);

  if (total <= 1) return null;

  const commitJump = () => {
    const parsed = Number(jumpValue);
    if (!Number.isInteger(parsed)) {
      setJumpDraft({ index: currentIndex, value: String(currentIndex + 1) });
      return;
    }

    const nextQuestion = Math.min(total, Math.max(1, parsed));
    setJumpDraft({ index: nextQuestion - 1, value: String(nextQuestion) });
    onSelect(nextQuestion - 1);
  };

  const iconControlClass =
    'h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-all duration-200 hover:border-violet-500/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95 disabled:pointer-events-none disabled:opacity-25';
  const controlClass =
    'inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-200 transition-all duration-200 hover:border-violet-500/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95 disabled:pointer-events-none disabled:opacity-25 sm:h-9 sm:px-3.5';

  const progressPercentage = Math.min(
    100,
    Math.max(0, ((currentIndex + 1) / total) * 100)
  );

  return (
    <nav
      aria-label="Question navigation"
      aria-busy={isLoading}
      className="relative z-30 mx-auto w-full max-w-xl sm:max-w-2xl lg:max-w-3xl overflow-hidden rounded-2xl md:rounded-full border border-white/10 bg-zinc-900/70 px-2.5 py-1.5 sm:px-4 sm:py-2 shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(139,92,246,0.1)] backdrop-blur-2xl ring-1 ring-white/5 transition-all"
    >
      {/* Question-set progress along the bottom edge. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 shadow-[0_0_8px_rgba(139,92,246,0.6)] transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Previous Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => onSelect(0)}
            disabled={isLoading || currentIndex === 0}
            title="First question"
            aria-label="Go to first question"
            className={`hidden md:inline-flex ${iconControlClass}`}
          >
            <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onSelect(Math.max(0, currentIndex - 1))}
            disabled={isLoading || currentIndex === 0}
            className={controlClass}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Prev</span>
            <span className="sr-only sm:hidden">Previous question</span>
          </button>
        </div>

        {/* Direct question jump. */}
        <form
          className="flex h-11 items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2 text-xs text-zinc-400 shadow-inner transition-all focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/20 sm:h-9 sm:gap-2 sm:px-3"
          onSubmit={(event) => {
            event.preventDefault();
            commitJump();
          }}
        >
          <label
            htmlFor="question-jump"
            className="hidden text-[11px] font-medium text-zinc-400 sm:block"
          >
            Question
          </label>
          <input
            id="question-jump"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={jumpValue}
            disabled={isLoading}
            aria-label={`Current question. Enter a number from 1 to ${total}`}
            onChange={(event) =>
              setJumpDraft({
                index: currentIndex,
                value: event.target.value.replace(/\D/g, ''),
              })
            }
            onFocus={(event) => event.currentTarget.select()}
            className="h-6 w-9 sm:w-11 rounded-full border border-violet-500/40 bg-violet-500/20 text-center text-xs font-bold tabular-nums text-violet-200 outline-none transition-all focus:border-violet-400 focus:bg-violet-500/30 focus:ring-1 focus:ring-violet-400 disabled:opacity-50"
          />
          <span className="whitespace-nowrap text-[11px] font-medium tabular-nums text-zinc-400">
            of {total}
          </span>
          <button
            type="submit"
            disabled={isLoading || jumpValue.length === 0}
            className="h-6 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 text-[10px] sm:text-[11px] font-bold text-white shadow-sm shadow-violet-600/30 transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
          >
            Go
          </button>
        </form>

        {/* Next Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => onSelect(Math.min(total - 1, currentIndex + 1))}
            disabled={isLoading || currentIndex === total - 1}
            className={controlClass}
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sr-only sm:hidden">Next question</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onSelect(total - 1)}
            disabled={isLoading || currentIndex === total - 1}
            title="Last question"
            aria-label="Go to last question"
            className={`hidden md:inline-flex ${iconControlClass}`}
          >
            <ChevronsRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        Question {currentIndex + 1} of {total}
      </p>
    </nav>
  );
};

export default PaginationBar;
