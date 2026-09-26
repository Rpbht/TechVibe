import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { TechnologyId, TechnologyMeta, QuestionItem } from './types';
import { Sidebar } from './components/Sidebar';
import { QuestionCard } from './components/QuestionCard';
import { PaginationBar } from './components/PaginationBar';
import { ProfileModal } from './components/ProfileModal';
import { CodingBackdrop } from './components/CodingBackdrop';
import {
  fetchCurrentUser,
  fetchTechnologies,
  fetchQuestionPage,
  logout as logoutUser,
  type UserProfile,
} from './services/questionsService';
import { AlertTriangle, BookOpenCheck, Menu, Loader2, RefreshCw, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  try {
    const storedTheme = window.localStorage.getItem('techvibe-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  } catch {
    return 'light';
  }

  return 'light';
};

export const App: React.FC = () => {
  const [technologies, setTechnologies] = useState<TechnologyMeta[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<TechnologyId | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [navigationDirection, setNavigationDirection] = useState<1 | -1>(1);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const prefersReducedMotion = useReducedMotion();

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchCurrentUser(controller.signal).then(setUser).catch(() => setUser(null));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem('techvibe-theme', theme);
    } catch {
      // The selected theme still works for this session when storage is unavailable.
    }

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute('content', theme === 'dark' ? '#09090b' : '#f4f4f5');
  }, [theme]);

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
    const requestedIndex = currentIndex;

    fetchQuestionPage(selectedTechId, requestedIndex + 1, 1, controller.signal)
      .then(({ question, total }) => {
        setCurrentQuestion(question);
        setDisplayedIndex(requestedIndex);
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
    setDisplayedIndex(0);
    setNavigationDirection(1);
    setIsLoading(true);
    setCurrentQuestion(null);
    setError(null);
  };

  const handleSelectIndex = (index: number) => {
    if (index === currentIndex || isLoading) return;

    setNavigationDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setIsLoading(true);
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
        if (currentIndex === 0 || isLoading) return;

        e.preventDefault();
        setNavigationDirection(-1);
        setIsLoading(true);
        setError(null);
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        if (totalQuestions === 0 || currentIndex === totalQuestions - 1 || isLoading) return;

        e.preventDefault();
        setNavigationDirection(1);
        setIsLoading(true);
        setError(null);
        setCurrentIndex((prev) => (totalQuestions > 0 ? Math.min(totalQuestions - 1, prev + 1) : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isLoading, totalQuestions]);

  // Smooth scroll to top when changing questions
  useEffect(() => {
    mainRef.current?.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [displayedIndex, prefersReducedMotion, selectedTechId]);

  return (
    <div className="app-shell flex h-[100dvh] w-full overflow-hidden font-sans antialiased selection:bg-violet-600/30 selection:text-white">
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
        theme={theme}
        onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
        onProfileClick={() => setIsProfileOpen(true)}
        onOrderSaved={setTechnologies}
      />

      {/* Main Full-Screen Layout */}
      <div className="relative flex h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden">
        <CodingBackdrop />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
          aria-label={isSidebarOpen ? 'Close knowledge areas' : 'Open knowledge areas'}
          aria-controls="knowledge-areas-sidebar"
          aria-expanded={isSidebarOpen}
          title={isSidebarOpen ? 'Close knowledge areas' : 'Open knowledge areas'}
          className={`fixed right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-violet-400/30 bg-violet-600 text-white shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 lg:hidden ${
            isSidebarOpen ? 'z-[60]' : 'z-40'
          }`}
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </motion.button>

        {/* Question reading pane — the floating navigation stays above this scroll region. */}
        <main ref={mainRef} className="relative z-10 min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-28 pt-20 sm:pb-24 md:px-8 lg:px-10 lg:pt-5">
          <div className="w-full space-y-4">
            {/* Loading state or Question View */}
            {isLoading && !currentQuestion ? (
              <div className="theme-card flex h-64 w-full items-center justify-center rounded-xl border border-zinc-800 bg-[#0d0e12]/60">
                <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              </div>
            ) : error ? (
              <div className="w-full rounded-xl border border-rose-900/60 bg-rose-950/20 p-12 text-center">
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
                  className="mx-auto mt-5 flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            ) : totalQuestions === 0 || !currentQuestion ? (
              <div className="theme-card w-full rounded-xl border border-zinc-800 bg-[#0d0e12] p-12 text-center">
                <BookOpenCheck className="mx-auto h-10 w-10 text-zinc-600" />
                <h3 className="mt-3 text-sm font-semibold text-zinc-200">
                  No questions available{currentTech ? ` for ${currentTech.name}` : ''}
                </h3>
              </div>
            ) : (
              <div className="w-full space-y-4">
                {/* Active Question with Smooth Transition */}
                <div className="relative" aria-busy={isLoading}>
                  <AnimatePresence initial={false} custom={navigationDirection} mode="popLayout">
                    <motion.div
                      key={`${selectedTechId}-${displayedIndex}`}
                      custom={navigationDirection}
                      variants={{
                        enter: (direction: 1 | -1) => prefersReducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, x: direction * 18, filter: 'blur(2px)' },
                        center: { opacity: 1, x: 0, filter: 'blur(0px)' },
                        exit: (direction: 1 | -1) => prefersReducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, x: direction * -10, filter: 'blur(1px)' },
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        duration: prefersReducedMotion ? 0.01 : 0.22,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <QuestionCard
                        question={currentQuestion}
                        questionNumber={displayedIndex + 1}
                        totalQuestions={totalQuestions}
                      />
                    </motion.div>
                  </AnimatePresence>

                  <AnimatePresence>
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pointer-events-none absolute inset-x-3 top-0 z-20 h-1 overflow-hidden rounded-full bg-violet-500/10"
                        aria-hidden="true"
                      >
                        <motion.div
                          className="h-full w-1/3 rounded-full bg-violet-500"
                          initial={{ x: '-110%' }}
                          animate={prefersReducedMotion ? { x: 0 } : { x: ['-110%', '310%'] }}
                          transition={prefersReducedMotion
                            ? { duration: 0 }
                            : { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </main>

        {!error && currentQuestion && totalQuestions > 1 && (
          <div
            className="pagination-dock pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center"
          >
            <PaginationBar
              currentIndex={displayedIndex}
              total={totalQuestions}
              onSelect={handleSelectIndex}
              isLoading={isLoading}
            />
          </div>
        )}

      </div>

      {isProfileOpen && (
        <ProfileModal
          user={user}
          onClose={() => setIsProfileOpen(false)}
          onAuthenticated={handleAuthenticated}
          onLogout={handleLogout}
        />
      )}

    </div>
  );
};

export default App;
