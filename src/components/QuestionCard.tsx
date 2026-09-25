import React from 'react';
import { Clock, ExternalLink, HardDrive } from 'lucide-react';
import type { QuestionItem } from '../types';
import { CodeBlock } from './CodeBlock';

interface QuestionCardProps {
  question: QuestionItem;
  questionNumber: number;
  totalQuestions?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
}) => {
  const questionTypeLabel = question.questionType
    ?.split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <article className="theme-card w-full rounded-xl border border-zinc-800 bg-[#0d0e12]/60 p-6 md:p-8 backdrop-blur-md shadow-lg space-y-6">
      {/* Indication of Question */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-mono font-bold text-violet-300">
          <span>Question {String(questionNumber).padStart(2, '0')}</span>
          {totalQuestions && (
            <span className="text-violet-400/60 font-normal">
              of {String(totalQuestions).padStart(2, '0')}
            </span>
          )}
        </span>
        {questionTypeLabel && (
          <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
            {questionTypeLabel}
          </span>
        )}
      </div>

      {/* Question Title */}
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-100 leading-snug">
        {question.title}
      </h1>

      {/* Summary */}
      {question.summary && (
        <p className="text-sm md:text-base leading-relaxed text-zinc-300">
          {question.summary}
        </p>
      )}

      {/* Explanation */}
      {question.explanation && question.explanation.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-zinc-800/60">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Explanation
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
            {question.explanation.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </div>
      )}

      {/* Code & Pseudo-Code */}
      {question.code && (
        <div className="space-y-4 pt-2 border-t border-zinc-800/60">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Code Snippet
            </h2>
            <CodeBlock code={question.code.snippet} language={question.code.language} />
          </div>

          {/* Pseudo-Code */}
          {question.pseudoCode && question.pseudoCode.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs font-mono text-zinc-300">
              <div className="text-[11px] font-bold uppercase text-emerald-400 mb-2">
                Algorithm Steps
              </div>
              <ol className="space-y-1">
                {question.pseudoCode.map((step, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-zinc-600 select-none">{idx + 1}.</span>
                    <span>{step.replace(/^\d+\.\s*/, '')}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Complexity (Time & Space) */}
      {question.complexity && (
        <div className="pt-2 border-t border-zinc-800/60">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-zinc-400">Time:</span>
              <span className="font-mono font-medium text-zinc-200">{question.complexity.time}</span>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs">
              <HardDrive className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-zinc-400">Space:</span>
              <span className="font-mono font-medium text-zinc-200">{question.complexity.space}</span>
            </div>
          </div>
        </div>
      )}

      {question.source && (
        <footer className="border-t border-zinc-800/60 pt-4 text-xs text-zinc-500">
          <span>Source reference: </span>
          <a
            href={question.source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-violet-300 transition hover:text-violet-200 hover:underline"
          >
            {question.source.title}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </footer>
      )}
    </article>
  );
};
