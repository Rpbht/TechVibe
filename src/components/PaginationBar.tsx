import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import type { QuestionItem } from '../types';

interface PaginationBarProps {
  currentIndex: number;
  total: number;
  questions?: QuestionItem[];
  onSelect: (index: number) => void;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentIndex,
  total,
  onSelect,
}) => {
  if (total <= 1) return null;

  // Sliding window pagination for scalable question counts (scales to 100s of questions)
  const getPaginationItems = () => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const items: (number | 'ellipsis-left' | 'ellipsis-right')[] = [];
    const siblings = 1;
    const leftSibling = Math.max(currentIndex - siblings, 1);
    const rightSibling = Math.min(currentIndex + siblings, total - 2);

    const showLeftEllipsis = leftSibling > 1;
    const showRightEllipsis = rightSibling < total - 2;

    items.push(0);

    if (showLeftEllipsis) {
      items.push('ellipsis-left');
    }

    const start = showLeftEllipsis ? leftSibling : 1;
    const end = showRightEllipsis ? rightSibling : total - 2;

    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    if (showRightEllipsis) {
      items.push('ellipsis-right');
    }

    items.push(total - 1);
    return items;
  };

  const paginationItems = getPaginationItems();

  return (
    <nav
      aria-label="Pagination"
      className="flex w-full items-center justify-center gap-1.5 py-4 text-xs"
    >
      {/* First */}
      <button
        onClick={() => onSelect(0)}
        disabled={currentIndex === 0}
        title="First Question"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:pointer-events-none disabled:opacity-25"
      >
        <ChevronsLeft className="h-3.5 w-3.5" />
      </button>

      {/* Prev */}
      <button
        onClick={() => onSelect(Math.max(0, currentIndex - 1))}
        disabled={currentIndex === 0}
        title="Previous Question"
        className="flex h-8 items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:pointer-events-none disabled:opacity-25"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Numbers */}
      <div className="flex items-center gap-1">
        {paginationItems.map((item, idx) => {
          if (item === 'ellipsis-left') {
            return (
              <button
                key={`el-${idx}`}
                onClick={() => onSelect(Math.max(0, currentIndex - 5))}
                title="Jump back 5"
                className="h-8 w-8 rounded-full border border-zinc-800/60 bg-transparent text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              >
                ...
              </button>
            );
          }

          if (item === 'ellipsis-right') {
            return (
              <button
                key={`er-${idx}`}
                onClick={() => onSelect(Math.min(total - 1, currentIndex + 5))}
                title="Jump forward 5"
                className="h-8 w-8 rounded-full border border-zinc-800/60 bg-transparent text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              >
                ...
              </button>
            );
          }

          const qIndex = item as number;
          const isSelected = qIndex === currentIndex;

          return (
            <button
              key={qIndex}
              type="button"
              onClick={() => onSelect(qIndex)}
              disabled={isSelected}
              aria-current={isSelected ? 'page' : undefined}
              aria-label={`Question ${qIndex + 1}${isSelected ? ', current question' : ''}`}
              className={`h-8 min-w-[2rem] rounded-full px-2 text-xs font-semibold transition ${
                isSelected
                  ? 'cursor-default bg-violet-600 text-white shadow-sm'
                  : 'border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {qIndex + 1}
            </button>
          );
        })}
      </div>

      {/* Next */}
      <button
        onClick={() => onSelect(Math.min(total - 1, currentIndex + 1))}
        disabled={currentIndex === total - 1}
        title="Next Question"
        className="flex h-8 items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:pointer-events-none disabled:opacity-25"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      {/* Last */}
      <button
        onClick={() => onSelect(total - 1)}
        disabled={currentIndex === total - 1}
        title="Last Question"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:pointer-events-none disabled:opacity-25"
      >
        <ChevronsRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  );
};
