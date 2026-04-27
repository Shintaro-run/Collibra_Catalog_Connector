'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'framer-motion';
import { CornerDownLeft } from 'lucide-react';
import { useT, pickField } from '@/lib/i18n';

export type SearchItem = {
  asset: {
    id: string;
    name: string;
    displayName: string;
    displayNameJa?: string;
    type: string;
    description: string;
    tags: string[];
  };
  domain: {
    id: string;
    name: string;
    nameJa?: string;
    slug: string;
    color: string;
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
  index: SearchItem[];
};

export function SearchPalette({ open, onClose, index }: Props) {
  const { t, lang } = useT();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(index, {
        keys: [
          { name: 'asset.displayName', weight: 3 },
          { name: 'asset.displayNameJa', weight: 3 },
          { name: 'asset.name', weight: 2.5 },
          { name: 'asset.description', weight: 1.5 },
          { name: 'asset.tags', weight: 1 },
          { name: 'domain.name', weight: 1 },
          { name: 'domain.nameJa', weight: 1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [index],
  );

  const results = useMemo(() => {
    if (!q.trim()) {
      return index.slice(0, 8);
    }
    return fuse.search(q).slice(0, 12).map((r) => r.item);
  }, [q, fuse, index]);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === 'Enter') {
        const item = results[active];
        if (item) {
          const base =
            (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_PATH) || '';
          window.location.href = `${base}/asset/${item.asset.id}/`;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, active, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-2xl glass rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-ink-200/60 dark:border-ink-800/60">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                placeholder={t.search.placeholder}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-400"
              />
              <kbd className="rounded bg-ink-200/60 dark:bg-ink-800 px-1.5 py-0.5 text-[10px] font-mono text-ink-500 dark:text-ink-400">esc</kbd>
            </div>

            <ul className="max-h-[55vh] overflow-y-auto scroll-fade py-2">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-ink-400">
                  {t.search.noMatch} &ldquo;{q}&rdquo;
                </li>
              )}
              {results.map((r, i) => {
                const isActive = i === active;
                const displayName = pickField(r.asset as never, 'displayName', lang);
                const domainName = pickField(r.domain as never, 'name', lang);
                return (
                  <li key={r.asset.id}>
                    <Link
                      href={`/asset/${r.asset.id}/`}
                      onMouseEnter={() => setActive(i)}
                      onClick={onClose}
                      className={[
                        'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                        isActive
                          ? 'bg-mint-500/10 text-mint-500'
                          : 'text-ink-700 dark:text-ink-200 hover:bg-ink-100/60 dark:hover:bg-ink-800/40',
                      ].join(' ')}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: r.domain.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{displayName}</div>
                        <div className="text-[11px] text-ink-400 truncate font-mono">
                          {r.asset.name} · {domainName} · {r.asset.type}
                        </div>
                      </div>
                      {isActive && <CornerDownLeft className="h-3.5 w-3.5 opacity-60" />}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between px-4 py-2 border-t border-ink-200/60 dark:border-ink-800/60 text-[11px] text-ink-400">
              <div className="flex items-center gap-3">
                <span>↑↓ {t.search.navigate}</span>
                <span>↵ {t.search.open}</span>
                <span>esc {t.search.close}</span>
              </div>
              <div>
                {results.length} {t.search.results}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
