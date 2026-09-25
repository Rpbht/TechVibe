import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface PaginationBarProps {
  currentIndex: number;
  total: number;
  onSelect: (index: number) => void;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentIndex,
  total,
  onSelect,
}) => {
  if (total <= 1) return null;

  const getPaginationItems = () => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index);
    }

    const items: (number | 'ellipsis-left' | 'ellipsis-right')[] = [];
    const leftSibling = Math.max(currentIndex - 1, 1);
    const rightSibling = Math.min(currentIndex + 1, total - 2);
    const showLeftEllipsis = leftSibling > 1;
    const showRightEllipsis = rightSibling < total - 2;

    items.push(0);

    if (showLeftEllipsis) items.push('ellipsis-left');

    const start = showLeftEllipsis ? leftSibling : 1;
    const end = showRightEllipsis ? rightSibling : total - 2;

    for (let index = start; index <= end; index += 1) {
      items.push(index);
    }

    if (showRightEllipsis) items.push('ellipsis-right');

    items.push(total - 1);
    return items;
  };

  const paginationItems = getPaginationItems();
  const iconButtonClass = 'h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none disabled:opacity-25';

  return (
    <nav
      aria-label="Question pagination"
      className="flex w-full items-center justify-center gap-1.5 py-4 text-xs"
    >
      <button
        type="button"
        onClick={() => onSelect(0)}
        disabled={currentIndex === 0}
        title="First question"
        aria-label="Go to first question"
        className={`hidden sm:flex ${iconButtonClass}`}
      >
        <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => onSelect(Math.max(0, currentIndex - 1))}
        disabled={currentIndex === 0}
        title="Previous question"
        className="flex h-8 items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none disabled:opacity-25"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Prev</span>
        <span className="sr-only sm:hidden">Previous question</span>
      </button>

      <div className="flex items-center gap-1">
        {paginationItems.map((item) => {
          if (item === 'ellipsis-left') {
            return (
              <button
                key={item}
                type="button"
                onClick={() => onSelect(Math.max(0, currentIndex - 5))}
                title="Jump back 5 questions"
                aria-label="Jump back 5 questions"
                className="h-8 w-8 rounded-full border border-zinc-800/60 bg-transparent text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                …
              </button>
            );
          }

          if (item === 'ellipsis-right') {
            return (
              <button
                key={item}
                type="button"
                onClick={() => onSelect(Math.min(total - 1, currentIndex + 5))}
                title="Jump forward 5 questions"
                aria-label="Jump forward 5 questions"
                className="h-8 w-8 rounded-full border border-zinc-800/60 bg-transparent text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                …
              </button>
            );
          }

          const isSelected = item === currentIndex;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              disabled={isSelected}
              aria-current={isSelected ? 'page' : undefined}
              aria-label={`Question ${item + 1}${isSelected ? ', current question' : ''}`}
              className={`h-8 min-w-8 rounded-full px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                isSelected
                  ? 'cursor-default bg-violet-600 text-white shadow-sm'
                  : 'border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {item + 1}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onSelect(Math.min(total - 1, currentIndex + 1))}
        disabled={currentIndex === total - 1}
        title="Next question"
        className="flex h-8 items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none disabled:opacity-25"
      >
        <span className="hidden sm:inline">Next</span>
        <span className="sr-only sm:hidden">Next question</span>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => onSelect(total - 1)}
        disabled={currentIndex === total - 1}
        title="Last question"
        aria-label="Go to last question"
        className={`hidden sm:flex ${iconButtonClass}`}
      >
        <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <p className="sr-only" aria-live="polite">
        Question {currentIndex + 1} of {total}
      </p>
    </nav>
  );
};
