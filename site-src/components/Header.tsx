'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Search, Sun, Moon, Settings, LayoutGrid, Inbox } from 'lucide-react';
import { SearchPalette, type SearchItem } from './SearchPalette';
import { useT } from '@/lib/i18n';

type Props = {
  searchIndex: SearchItem[];
};

export function Header({ searchIndex }: Props) {
  const { t, lang, setLang } = useT();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const stored = (typeof window !== 'undefined' &&
      window.localStorage.getItem('ccc-theme')) as 'light' | 'dark' | null;
    const initial = stored ?? 'dark';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    window.localStorage.setItem('ccc-theme', next);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-ink-200/60 dark:border-ink-800/60 backdrop-blur-md bg-[color-mix(in_oklab,var(--bg)_70%,transparent)]">
        <div className="mx-auto max-w-[1280px] px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group min-w-0">
            <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-mint-500/15 ring-1 ring-mint-500/40 shrink-0">
              <span className="absolute inset-0 rounded-lg animate-pulse-ring bg-mint-500/40" />
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 text-mint-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" strokeLinecap="round" />
              </svg>
            </span>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold tracking-tight truncate">{t.appName}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-ink-400 truncate">
                {t.tagline}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-ink-200 dark:border-ink-800 bg-ink-50/40 dark:bg-ink-900/40 px-3 py-1.5 text-xs text-ink-500 dark:text-ink-400 hover:border-mint-400 hover:text-mint-500 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span>{t.nav.search}</span>
              <kbd className="ml-2 rounded bg-ink-200/70 dark:bg-ink-800 px-1.5 py-0.5 text-[10px] font-mono">
                ⌘K
              </kbd>
            </button>

            <div className="inline-flex items-center rounded-lg border border-ink-200 dark:border-ink-800 overflow-hidden">
              <button
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
                className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                  lang === 'en'
                    ? 'bg-mint-500/15 text-mint-500'
                    : 'text-ink-500 dark:text-ink-400 hover:text-mint-500'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('ja')}
                aria-pressed={lang === 'ja'}
                className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                  lang === 'ja'
                    ? 'bg-mint-500/15 text-mint-500'
                    : 'text-ink-500 dark:text-ink-400 hover:text-mint-500'
                }`}
              >
                日本語
              </button>
            </div>

            <Link
              href="/views/"
              aria-label={t.views.title}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 dark:border-ink-800 px-2 h-8 text-[11px] font-medium hover:border-mint-400 hover:text-mint-500 transition-colors"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.views.title}</span>
            </Link>
            <Link
              href="/inbox/"
              aria-label={t.inbox.title}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 dark:border-ink-800 px-2 h-8 text-[11px] font-medium hover:border-mint-400 hover:text-mint-500 transition-colors"
            >
              <Inbox className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.inbox.title}</span>
            </Link>
            <Link
              href="/settings/"
              aria-label={t.nav.settings}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 dark:border-ink-800 hover:border-mint-400 hover:text-mint-500 transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={toggleTheme}
              aria-label={t.nav.toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 dark:border-ink-800 hover:border-mint-400 hover:text-mint-500 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <SearchPalette open={open} onClose={() => setOpen(false)} index={searchIndex} />
    </>
  );
}
