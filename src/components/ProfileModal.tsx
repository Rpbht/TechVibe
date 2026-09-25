import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { authenticate, type UserProfile } from '../services/questionsService';

interface ProfileModalProps {
  user: UserProfile | null;
  onClose: () => void;
  onAuthenticated: (user: UserProfile) => void;
  onLogout: () => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  onClose,
  onAuthenticated,
  onLogout,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    window.requestAnimationFrame(() => {
      if (user) {
        dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
      } else {
        emailInputRef.current?.focus();
      }
    });

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose, user]);

  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      onAuthenticated(await authenticate(mode, email, password));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay. */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />

      {/* Floating profile dialog. */}
      <motion.section
        ref={dialogRef}
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: -10 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed right-3 top-20 z-[60] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-white/10 bg-[#0f1117]/85 p-0 shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(139,92,246,0.15)] backdrop-blur-2xl ring-1 ring-white/10 sm:right-6 md:right-8 lg:right-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        aria-describedby="profile-description"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing top ambient beam */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 opacity-90" />

        <div className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/20 to-purple-500/10 text-violet-300 shadow-sm shadow-violet-500/20">
                {user ? <Sparkles className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <h2 id="profile-title" className="truncate text-sm font-bold tracking-tight text-white">
                  {user ? 'Your TechVibe Profile' : mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p id="profile-description" className="truncate text-[11px] text-zinc-400">
                  {user ? user.email : 'Sync your personalized knowledge areas'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {user ? (
            <div className="mt-2 space-y-3.5">
              {/* User Profile Card */}
              <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/40 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-sm font-bold text-white shadow-md shadow-violet-500/30">
                    {user.email.charAt(0).toUpperCase()}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0f1117] bg-emerald-400 ring-1 ring-emerald-500/50" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-zinc-100">{user.email}</p>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" />
                      Synced profile
                    </span>
                  </div>
                </div>

                <p className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-[11px] leading-relaxed text-zinc-300">
                  Your knowledge-area order is saved to this account and automatically synced whenever you sign in.
                </p>
              </div>

              {/* Sign out button */}
              <button
                type="button"
                onClick={() => void onLogout()}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 text-xs font-semibold text-rose-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 active:scale-[0.98]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="mt-1 space-y-3.5">
              {/* HeroUI Segmented Control Tabs */}
              <div className="grid grid-cols-2 rounded-2xl border border-white/5 bg-black/40 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  aria-pressed={mode === 'login'}
                  className={`rounded-xl py-1.5 text-xs font-semibold transition-all ${
                    mode === 'login'
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  aria-pressed={mode === 'register'}
                  className={`rounded-xl py-1.5 text-xs font-semibold transition-all ${
                    mode === 'register'
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Authentication Form */}
              <form onSubmit={(event) => void submitAuth(event)} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="profile-email" className="text-[11px] font-medium text-zinc-300">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      ref={emailInputRef}
                      id="profile-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 outline-none transition-all hover:border-white/20 focus:border-violet-500 focus:bg-black/50 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="profile-password" className="text-[11px] font-medium text-zinc-300">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      id="profile-password"
                      type="password"
                      required
                      minLength={8}
                      maxLength={128}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 outline-none transition-all hover:border-white/20 focus:border-violet-500 focus:bg-black/50 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-500/25 bg-rose-950/40 px-3 py-2 text-[11px] leading-snug text-rose-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 transition-all hover:brightness-110 hover:shadow-violet-600/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode((value) => (value === 'login' ? 'register' : 'login'));
                    setError(null);
                  }}
                  className="w-full pt-0.5 text-center text-[11px] text-zinc-400 transition-colors hover:text-violet-300"
                >
                  {mode === 'login'
                    ? 'New to TechVibe? Create a profile'
                    : 'Already have a profile? Sign in'}
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.section>
    </>
  );
};

export default ProfileModal;
