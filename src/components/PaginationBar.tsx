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
  const jumpValue = jumpDraft.index === currentIndex
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

  const controlClass = 'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-900 px-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0e12] disabled:pointer-events-none disabled:opacity-35';
  const iconControlClass = 'hidden h-11 w-11 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/70 text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0e12] disabled:pointer-events-none disabled:opacity-30 md:inline-flex';

  return (
    <nav
      aria-label="Question navigation"
      aria-busy={isLoading}
      className="relative z-30 shrink-0 border-t border-zinc-800 bg-[#0d0e12] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_rgba(0,0,0,0.24)] md:px-8 lg:px-10"
    >
      <div className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex min-w-0 items-center justify-start gap-2">
          <button
            type="button"
            onClick={() => onSelect(0)}
            disabled={isLoading || currentIndex === 0}
            title="First question"
            aria-label="Go to first question"
            className={iconControlClass}
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
            <span className="hidden sm:inline">Previous</span>
            <span className="sr-only sm:hidden">Previous question</span>
          </button>
        </div>

        <form
          className="flex h-11 items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-950 px-2.5 text-sm text-zinc-400 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            commitJump();
          }}
        >
          <label htmlFor="question-jump" className="hidden text-xs font-medium text-zinc-500 sm:block">
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
            onChange={(event) => setJumpDraft({
              index: currentIndex,
              value: event.target.value.replace(/\D/g, ''),
            })}
            onFocus={(event) => event.currentTarget.select()}
            className="h-8 w-10 rounded-full border border-violet-500/35 bg-violet-500/12 text-center text-sm font-bold tabular-nums text-violet-200 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/25 disabled:opacity-60 sm:w-12"
          />
          <span className="whitespace-nowrap text-xs tabular-nums text-zinc-500">of {total}</span>
          <button
            type="submit"
            disabled={isLoading || jumpValue.length === 0}
            className="h-8 rounded-full bg-violet-600 px-2.5 text-xs font-bold text-white transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-40"
          >
            Go
          </button>
        </form>

        <div className="flex min-w-0 items-center justify-end gap-2">
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
            className={iconControlClass}
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
