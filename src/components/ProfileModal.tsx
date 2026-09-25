import React, { useEffect, useRef, useState } from 'react';
import { Loader2, LogOut, Sparkles, UserRound, X } from 'lucide-react';
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
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    emailInputRef.current?.focus();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const inputClass = 'mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/90 px-2.5 py-2 text-xs text-zinc-100 outline-none transition focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/10';

  return (
    <section
      className="theme-profile fixed left-3 top-12 z-[70] w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-zinc-800/90 bg-[#111216]/98 shadow-2xl shadow-black/60 backdrop-blur-xl"
      role="dialog"
      aria-modal="false"
      aria-labelledby="profile-title"
    >
      <div className="h-0.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/25">
              {user ? <Sparkles className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <h2 id="profile-title" className="truncate text-sm font-semibold text-zinc-100">
                {user ? 'Your TechVibe profile' : mode === 'login' ? 'Welcome back' : 'Create your profile'}
              </h2>
              <p className="truncate text-[10px] text-zinc-500">
                {user ? user.email : 'Sync your personalized knowledge areas'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close profile" className="rounded-md p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {user ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-400">
              Your knowledge-area order is saved to this account and restored whenever you sign in.
            </p>
            <button type="button" onClick={() => void onLogout()} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        ) : (
          <form onSubmit={(event) => void submitAuth(event)} className="mt-4 space-y-2.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Email
              <input ref={emailInputRef} type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="you@example.com" />
            </label>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Password
              <input type="password" required minLength={8} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder="At least 8 characters" />
            </label>
            {error && <p className="rounded-lg bg-rose-950/40 px-2.5 py-2 text-[11px] text-rose-300">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create profile'}
            </button>
            <button type="button" onClick={() => { setMode((value) => value === 'login' ? 'register' : 'login'); setError(null); }} className="w-full text-[11px] text-zinc-500 hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
              {mode === 'login' ? 'New to TechVibe? Create a profile' : 'Already have a profile? Sign in'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
