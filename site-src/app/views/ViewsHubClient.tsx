'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  CalendarDays,
  FolderTree,
  GitBranch,
  Orbit,
  PersonStanding,
  ScrollText,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useT } from '@/lib/i18n';

const VIEWS = [
  { slug: '', icon: PersonStanding, key: 'anatomy' as const, accent: '#2dd4bf' },
  { slug: 'views/pipeline', icon: TrendingUp, key: 'pipeline' as const, accent: '#22c55e' },
  { slug: 'views/timeline', icon: CalendarDays, key: 'timeline' as const, accent: '#06b6d4' },
  { slug: 'views/lineage', icon: GitBranch, key: 'lineage' as const, accent: '#a855f7' },
  { slug: 'views/systems', icon: Orbit, key: 'systems' as const, accent: '#fbbf24' },
  { slug: 'views/quality', icon: ScrollText, key: 'quality' as const, accent: '#fb7185' },
  { slug: 'views/compliance', icon: ShieldCheck, key: 'compliance' as const, accent: '#f59e0b' },
  { slug: 'views/folder', icon: FolderTree, key: 'folder' as const, accent: '#fbbf24' },
];

export function ViewsHubClient() {
  const { t } = useT();

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500">
          {t.views.kicker}
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-2xl">
          {t.views.title}
        </h1>
        <p className="text-ink-500 dark:text-ink-400 max-w-2xl text-sm leading-relaxed">
          {t.views.lede}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {VIEWS.map((v, i) => {
          const meta = t.views[v.key];
          const Icon = v.icon;
          const href = v.slug ? `/${v.slug}/` : '/';
          return (
            <motion.div
              key={v.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <Link
                href={href}
                className="group block h-full rounded-2xl border border-ink-200 dark:border-ink-800 hover:border-mint-400 transition-colors p-5 relative overflow-hidden"
              >
                <div
                  className="absolute -top-12 -right-12 h-36 w-36 rounded-full opacity-30 blur-3xl group-hover:opacity-60 transition-opacity"
                  style={{ background: v.accent }}
                />
                <div
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1"
                  style={{
                    background: `${v.accent}1a`,
                    color: v.accent,
                    borderColor: `${v.accent}55`,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="relative mt-3 flex items-baseline justify-between gap-3">
                  <h2 className="text-base font-semibold tracking-tight">{meta.title}</h2>
                  <ArrowUpRight className="h-4 w-4 text-ink-400 group-hover:text-mint-500 transition-colors" />
                </div>
                <p className="relative text-xs text-ink-500 dark:text-ink-400 mt-1 leading-relaxed">
                  {meta.desc}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
