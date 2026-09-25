import React, { useState, useMemo } from 'react';
import {
  Atom,
  ArrowDown,
  ArrowUp,
  Globe,
  FileCode2,
  Server,
  Terminal,
  Cpu,
  Boxes,
  Database,
  Network,
  BookOpen,
  Braces,
  Coffee,
  Leaf,
  Code2,
  Search,
  Settings2,
  GripVertical,
  Loader2,
  Moon,
  RotateCcw,
  Save,
  SortAsc,
  Sun,
  UserRound,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TechnologyId, TechnologyMeta } from '../types';
import {
  fetchDefaultTechnologies,
  saveCategoryOrder,
  type UserProfile,
} from '../services/questionsService';

interface SidebarProps {
  technologies: TechnologyMeta[];
  selectedTechId: TechnologyId | null;
  onSelectTech: (id: TechnologyId) => void;
  questionCounts: Record<TechnologyId, number>;
  isDatabaseConnected: boolean;
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onProfileClick: () => void;
  onOrderSaved: (technologies: TechnologyMeta[]) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Atom,
  Globe,
  FileCode2,
  Server,
  Terminal,
  Cpu,
  Boxes,
  Database,
  Network,
  BookOpen,
  Braces,
  Coffee,
  Leaf,
};

export const Sidebar: React.FC<SidebarProps> = ({
  technologies,
  selectedTechId,
  onSelectTech,
  questionCounts,
  isDatabaseConnected,
  isOpen,
  onClose,
  user,
  theme,
  onToggleTheme,
  onProfileClick,
  onOrderSaved,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isArranging, setIsArranging] = useState(false);
  const [orderedTechnologies, setOrderedTechnologies] = useState<TechnologyMeta[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [arrangeMessage, setArrangeMessage] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const filteredTechnologies = useMemo(() => {
    const source = isArranging ? orderedTechnologies : technologies;
    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase();
    return source.filter((t) => t.name.toLowerCase().includes(q));
  }, [technologies, orderedTechnologies, isArranging, searchQuery]);

  const startArranging = () => {
    setArrangeMessage(null);
    if (!user) {
      setArrangeMessage('Sign in from the profile icon to save a personal order.');
      return;
    }
    setSearchQuery('');
    setOrderedTechnologies([...technologies]);
    setIsArranging(true);
  };

  const moveCategory = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= orderedTechnologies.length) return;
    setOrderedTechnologies((items) => {
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const dropCategoryBefore = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    setOrderedTechnologies((items) => {
      const source = items.find(({ id }) => id === draggedId);
      if (!source) return items;
      const next = items.filter(({ id }) => id !== draggedId);
      next.splice(next.findIndex(({ id }) => id === targetId), 0, source);
      return next;
    });
    setDraggedId(null);
  };

  const restoreDefaultOrder = async () => {
    setArrangeMessage(null);
    try {
      setOrderedTechnologies(await fetchDefaultTechnologies());
    } catch (error) {
      setArrangeMessage(error instanceof Error ? error.message : 'Could not load the default order.');
    }
  };

  const persistOrder = async () => {
    setIsSavingOrder(true);
    setArrangeMessage(null);
    try {
      await saveCategoryOrder(orderedTechnologies.map(({ id }) => id));
      onOrderSaved(orderedTechnologies);
      setIsArranging(false);
    } catch (error) {
      setArrangeMessage(error instanceof Error ? error.message : 'Could not save the order.');
    } finally {
      setIsSavingOrder(false);
    }
  };
  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Floating navigation card */}
      <aside
        id="knowledge-areas-sidebar"
        className={`theme-card fixed inset-y-3 left-3 z-50 flex w-60 max-w-[calc(100vw-1.5rem)] shrink-0 flex-col overflow-hidden rounded-2xl border border-zinc-800/80 shadow-2xl shadow-black/20 backdrop-blur-xl transition-transform duration-200 lg:relative lg:inset-auto lg:z-auto lg:my-3 lg:ml-3 lg:h-[calc(100vh-1.5rem)] lg:translate-x-0 lg:shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+0.75rem)]'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm shadow-violet-600/30">
              <Code2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-zinc-100">
              TechVibe
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={onProfileClick}
              aria-label={user ? `Open profile for ${user.email}` : 'Sign in or create profile'}
              title={user?.email ?? 'Sign in to save your knowledge area order'}
              className={`flex h-7 w-7 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                user
                  ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100'
              }`}
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Search Filter if more than 6 categories */}
        {technologies.length > 6 && !isArranging && (
          <div className="px-3 pt-2 pb-1">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search knowledge areas..."
                className="w-full rounded-full border border-zinc-800/80 bg-zinc-900/60 py-1.5 pl-8 pr-8 text-[11px] text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-violet-500/50 focus:bg-zinc-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-zinc-500 hover:text-zinc-300 text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Technologies List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          <div className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              {isArranging ? 'Arrange Areas' : 'Knowledge Areas'}
              <button
                onClick={isArranging ? () => setIsArranging(false) : startArranging}
                aria-label="Arrange knowledge areas"
                title={user ? 'Arrange knowledge areas' : 'Sign in to arrange knowledge areas'}
                className={`rounded-full p-1 text-zinc-600 transition hover:bg-zinc-800 hover:text-violet-300 ${isArranging ? 'bg-zinc-800 text-violet-300' : ''}`}
              >
                {isArranging ? <X className="h-3 w-3" /> : <Settings2 className="h-3 w-3" />}
              </button>
            </span>
            <span className="font-mono text-[9px] text-zinc-600">{filteredTechnologies.length}</span>
          </div>

          {arrangeMessage && (
            <div className="mx-1 mb-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-2.5 py-2 text-[10px] leading-relaxed text-violet-200/80">
              {arrangeMessage}
            </div>
          )}

          {isArranging && (
            <div className="mx-1 mb-2 grid grid-cols-4 gap-1 rounded-xl border border-zinc-800 bg-zinc-950/70 p-1.5">
              <button onClick={() => setOrderedTechnologies((items) => [...items].sort((a, b) => a.name.localeCompare(b.name)))} title="Sort A–Z" aria-label="Sort knowledge areas alphabetically" className="flex h-7 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100">
                <SortAsc className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => void restoreDefaultOrder()} title="Restore default" aria-label="Restore default knowledge area order" className="flex h-7 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setIsArranging(false)} title="Cancel" aria-label="Cancel arranging knowledge areas" className="flex h-7 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100">
                <X className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => void persistOrder()} disabled={isSavingOrder} title="Save order" aria-label="Save knowledge area order" className="flex h-7 items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50">
                {isSavingOrder ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}

          {filteredTechnologies.map((tech, index) => {
            const Icon = ICON_MAP[tech.iconName] || Code2;
            const isSelected = selectedTechId === tech.id;
            const count = questionCounts[tech.id] || 0;

            return isArranging ? (
              <div
                key={tech.id}
                draggable
                onDragStart={() => setDraggedId(tech.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dropCategoryBefore(tech.id)}
                className={`flex items-center gap-1 rounded-lg border px-1.5 py-1.5 ${draggedId === tech.id ? 'border-violet-500 bg-violet-500/10' : 'border-transparent bg-zinc-900/50'}`}
              >
                <GripVertical className="h-3.5 w-3.5 cursor-grab text-zinc-600" />
                <span className="w-5 text-right font-mono text-[9px] text-zinc-600">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-zinc-300">{tech.name}</span>
                <button onClick={() => moveCategory(index, -1)} disabled={index === 0} aria-label={`Move ${tech.name} up`} className="rounded-full p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-20">
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button onClick={() => moveCategory(index, 1)} disabled={index === orderedTechnologies.length - 1} aria-label={`Move ${tech.name} down`} className="rounded-full p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-20">
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                key={tech.id}
                onClick={() => {
                  onSelectTech(tech.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`group relative flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-zinc-800/90 text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}
              >
                {/* Active indicator dot */}
                {isSelected && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className="absolute left-1.5 h-3.5 w-1 rounded-full bg-violet-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <div className="flex items-center gap-2.5 pl-2 truncate pr-2">
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                      isSelected ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  />
                  <span className="truncate">{tech.name}</span>
                </div>

                <span
                  className={`font-mono text-[11px] shrink-0 ${
                    isSelected ? 'text-violet-300' : 'text-zinc-600 group-hover:text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Slim Footer */}
        <div className="border-t border-zinc-800/80 px-4 py-3 text-[11px] text-zinc-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Database className="h-3 w-3 text-violet-400" />
            <span className="text-[10px] text-zinc-400 font-medium">
              {isDatabaseConnected ? 'Database connected' : 'Database offline'}
            </span>
          </span>
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isDatabaseConnected
                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
        </div>
      </aside>
    </>
  );
};
