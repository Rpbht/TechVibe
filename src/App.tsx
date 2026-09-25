import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { TechnologyId, TechnologyMeta, QuestionItem } from './types';
import { Sidebar } from './components/Sidebar';
import { QuestionCard } from './components/QuestionCard';
import { PaginationBar } from './components/PaginationBar';
import { ProfileModal } from './components/ProfileModal';
import {
  fetchCurrentUser,
  fetchTechnologies,
  fetchQuestionPage,
  logout as logoutUser,
  type UserProfile,
} from './services/questionsService';
import { AlertTriangle, BookOpenCheck, Menu, Loader2, RefreshCw, UserRound } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export const App: React.FC = () => {
  const [technologies, setTechnologies] = useState<TechnologyMeta[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<TechnologyId | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchCurrentUser(controller.signal).then(setUser).catch(() => setUser(null));
    return () => controller.abort();
  }, []);

  // Active technology metadata
  const currentTech = useMemo(
    () => technologies.find((t) => t.id === selectedTechId),
    [technologies, selectedTechId]
  );

  // Load categories & real-time counts from high-scale Node.js backend
  useEffect(() => {
    const controller = new AbortController();

    fetchTechnologies(controller.signal)
      .then((techs) => {
        setTechnologies(techs);
        setSelectedTechId((selected) =>
          selected && techs.some((technology) => technology.id === selected)
            ? selected
            : (techs[0]?.id ?? null),
        );
        setIsDatabaseConnected(true);
        if (techs.length === 0) setIsLoading(false);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load technologies.');
        setIsDatabaseConnected(false);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [requestVersion]);

  // Compute question counts for sidebar
  const questionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    technologies.forEach((t) => {
      counts[t.id] = t.questionCount;
    });
    return counts;
  }, [technologies]);

  // Scalable single-question fetch (handles 10,000+ questions without client memory bloat)
  useEffect(() => {
    if (!selectedTechId) return;

    const controller = new AbortController();

    fetchQuestionPage(selectedTechId, currentIndex + 1, 1, controller.signal)
      .then(({ question, total }) => {
        setCurrentQuestion(question);
        setTotalQuestions(total);
        setIsLoading(false);
        setIsDatabaseConnected(true);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load this question.');
        setIsDatabaseConnected(false);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [selectedTechId, currentIndex, requestVersion]);

  const handleSelectTech = (id: TechnologyId) => {
    if (id === selectedTechId) return;

    setSelectedTechId(id);
    setCurrentIndex(0);
    setIsLoading(true);
    setCurrentQuestion(null);
    setError(null);
  };

  const handleSelectIndex = (index: number) => {
    if (index === currentIndex) return;

    setCurrentIndex(index);
    setIsLoading(true);
    setCurrentQuestion(null);
    setError(null);
  };

  const handleAuthenticated = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setIsProfileOpen(false);
    setRequestVersion((version) => version + 1);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setIsProfileOpen(false);
    setRequestVersion((version) => version + 1);
  };

  // Keyboard navigation for questions (Left & Right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        if (currentIndex === 0) return;

        setIsLoading(true);
        setCurrentQuestion(null);
        setError(null);
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        if (totalQuestions === 0 || currentIndex === totalQuestions - 1) return;

        setIsLoading(true);
        setCurrentQuestion(null);
        setError(null);
        setCurrentIndex((prev) => (totalQuestions > 0 ? Math.min(totalQuestions - 1, prev + 1) : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalQuestions]);

  // Smooth scroll to top when changing questions
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex, selectedTechId]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#09090b] text-zinc-100 font-sans antialiased selection:bg-violet-600/30 selection:text-white">
      {/* Ambient lighting for the floating glass surfaces. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-80 w-80 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Sidebar Shell - Fixed & Pinned */}
      <Sidebar
        key={user?.id ?? 'anonymous'}
        technologies={technologies}
        selectedTechId={selectedTechId}
        onSelectTech={handleSelectTech}
        questionCounts={questionCounts}
        isDatabaseConnected={isDatabaseConnected}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onOrderSaved={setTechnologies}
      />

      {/* Main Full-Screen Layout */}
      <div className="relative z-10 flex flex-1 flex-col h-screen overflow-hidden min-w-0">
        {/* Floating app header. */}
        <div className="shrink-0 z-30 pt-3 px-3 sm:px-6 lg:px-8 pb-1">
          <header className="mx-auto flex h-14 w-full items-center justify-between rounded-2xl md:rounded-full border border-white/10 bg-zinc-900/60 backdrop-blur-2xl px-3 sm:px-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ring-1 ring-white/5 transition-all">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open knowledge areas"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-all hover:border-violet-500/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95 lg:hidden"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>

              <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                </span>
                <p className="truncate text-sm font-bold tracking-tight text-zinc-100 md:text-base">
                  {currentTech?.name ?? 'TechVibe'}
                </p>
                {currentTech && (
                  <span className="hidden shrink-0 items-center rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.12)] sm:inline-flex">
                    {totalQuestions} questions
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              aria-label={user ? `Open profile for ${user.email}` : 'Sign in or create profile'}
              title={user?.email ?? 'Sign in to save your knowledge area order'}
              className={`group ml-3 flex h-11 shrink-0 items-center gap-2 rounded-full border px-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95 sm:h-9 sm:px-3 ${
                user
                  ? 'border-violet-500/40 bg-violet-500/15 text-violet-200 shadow-[0_0_16px_rgba(139,92,246,0.2)] hover:border-violet-400/60 hover:bg-violet-500/25'
                  : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span
                className={`relative flex h-6 w-6 items-center justify-center rounded-full ${
                  user
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-sm'
                    : 'bg-white/10 text-zinc-300'
                }`}
              >
                <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                {user && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-zinc-900 bg-emerald-400 ring-1 ring-emerald-500/50" />
                )}
              </span>
              <span className="hidden max-w-44 truncate sm:block">
                {user?.email ?? 'Sign in'}
              </span>
            </button>
          </header>
        </div>

        {/* Question reading pane — navigation stays outside this scroll region. */}
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-8 lg:px-10 pb-6">
          <div className="w-full space-y-4">
            {/* Loading state or Question View */}
            {isLoading ? (
              <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/40 backdrop-blur-md">
                <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              </div>
            ) : error ? (
              <div className="w-full rounded-2xl border border-rose-900/60 bg-rose-950/20 p-12 text-center backdrop-blur-md">
                <AlertTriangle className="mx-auto h-10 w-10 text-rose-400" />
                <h3 className="mt-3 text-sm font-semibold text-zinc-100">Could not load database content</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-400">{error}</p>
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setCurrentQuestion(null);
                    setError(null);
                    setRequestVersion((version) => version + 1);
                  }}
                  className="mx-auto mt-5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            ) : totalQuestions === 0 || !currentQuestion ? (
              <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/40 p-12 text-center backdrop-blur-md">
                <BookOpenCheck className="mx-auto h-10 w-10 text-zinc-600" />
                <h3 className="mt-3 text-sm font-semibold text-zinc-200">
                  No questions available{currentTech ? ` for ${currentTech.name}` : ''}
                </h3>
              </div>
            ) : (
              <div className="w-full">
                {/* Active Question with Smooth Transition */}
                <AnimatePresence mode="wait">
                  <QuestionCard
                    key={`${selectedTechId}-${currentIndex}`}
                    question={currentQuestion}
                    questionNumber={currentIndex + 1}
                    totalQuestions={totalQuestions}
                  />
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>

        {/* Floating question navigation dock. */}
        {totalQuestions > 1 && !error && (
          <div className="shrink-0 z-30 pb-3 sm:pb-4 pt-1 px-3 sm:px-6 lg:px-8 flex justify-center w-full pointer-events-none">
            <div className="pointer-events-auto w-full flex justify-center">
              <PaginationBar
                currentIndex={currentIndex}
                total={totalQuestions}
                isLoading={isLoading}
                onSelect={handleSelectIndex}
              />
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isProfileOpen && (
          <ProfileModal
            user={user}
            onClose={() => setIsProfileOpen(false)}
            onAuthenticated={handleAuthenticated}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default App;
