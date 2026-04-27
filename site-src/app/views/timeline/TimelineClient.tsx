'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Asset, Catalog, Domain } from '@/lib/types';
import { useT, pickField } from '@/lib/i18n';
import { StatTile } from '@/components/StatTile';

type Cell = { date: string; iso: string; count: number; assets: { asset: Asset; domain: Domain }[] };

const MS_DAY = 24 * 60 * 60 * 1000;

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function TimelineClient({ catalog }: { catalog: Catalog }) {
  const { t, lang } = useT();
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<Cell | null>(null);

  const cells = useMemo<Cell[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today.getTime() - 364 * MS_DAY);
    const map = new Map<string, Cell>();
    for (let i = 0; i < 365; i++) {
      const d = new Date(start.getTime() + i * MS_DAY);
      const k = dateKey(d);
      map.set(k, { date: k, iso: d.toISOString(), count: 0, assets: [] });
    }
    for (const domain of catalog.domains) {
      for (const asset of domain.assets) {
        const d = new Date(asset.freshness);
        d.setHours(0, 0, 0, 0);
        const k = dateKey(d);
        const cell = map.get(k);
        if (cell) {
          cell.count += 1;
          cell.assets.push({ asset, domain });
        }
      }
    }
    return [...map.values()];
  }, [catalog]);

  const max = Math.max(1, ...cells.map((c) => c.count));
  const totalRefreshes = cells.reduce((s, c) => s + c.count, 0);
  const mostActive = cells.reduce((a, b) => (a.count >= b.count ? a : b));

  let streak = 0;
  let longest = 0;
  for (const c of cells) {
    if (c.count > 0) {
      streak += 1;
      longest = Math.max(longest, streak);
    } else streak = 0;
  }

  const weeks: Cell[][] = [];
  let cur: Cell[] = [];
  const firstDow = new Date(cells[0].iso).getDay();
  for (let i = 0; i < firstDow; i++) cur.push({ date: '', iso: '', count: -1, assets: [] });
  for (const c of cells) {
    cur.push(c);
    if (cur.length === 7) {
      weeks.push(cur);
      cur = [];
    }
  }
  if (cur.length > 0) {
    while (cur.length < 7) cur.push({ date: '', iso: '', count: -1, assets: [] });
    weeks.push(cur);
  }

  const filtered = selected ? cells.find((c) => c.date === selected) : null;

  const colorFor = (count: number) => {
    if (count < 0) return 'transparent';
    if (count === 0) return 'rgba(148,163,184,0.10)';
    const intensity = Math.min(1, count / max);
    const alpha = 0.25 + 0.65 * intensity;
    return `rgba(45,212,191,${alpha})`;
  };

  return (
    <div className="space-y-8">
      <Link
        href="/views/"
        className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-mint-500 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        {t.views.title}
      </Link>

      <header className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500">
          {t.views.kicker}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{t.timeline.title}</h1>
        <p className="text-ink-500 dark:text-ink-400 max-w-2xl text-sm leading-relaxed">
          {t.timeline.desc}
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label={lang === 'ja' ? '更新総数 (12ヶ月)' : 'Refreshes · 12 mo'}
          value={totalRefreshes}
        />
        <StatTile
          label={t.timeline.mostActive}
          value={mostActive.count}
          hint={mostActive.date}
        />
        <StatTile label={t.timeline.streak} value={`${longest}d`} />
        <StatTile
          label={lang === 'ja' ? 'アクティブ日数' : 'Active days'}
          value={cells.filter((c) => c.count > 0).length}
        />
      </section>

      <section className="rounded-2xl border border-ink-200 dark:border-ink-800 bg-ink-50/30 dark:bg-ink-900/30 p-5 overflow-x-auto scroll-fade">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((c, di) => {
                const isSelected = selected === c.date;
                if (c.count < 0)
                  return <div key={di} className="h-3 w-3" />;
                return (
                  <motion.button
                    key={di}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.16, delay: wi * 0.005 }}
                    onMouseEnter={() => setHovered(c)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(isSelected ? null : c.date)}
                    className={`h-3 w-3 rounded-[3px] transition-all ${
                      isSelected ? 'ring-2 ring-mint-500 scale-110' : ''
                    }`}
                    style={{ background: colorFor(c.count) }}
                    aria-label={`${c.date}: ${c.count} refreshes`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 mt-3 text-[11px] text-ink-400">
          <span>{lang === 'ja' ? '少ない' : 'less'}</span>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <span
              key={v}
              className="h-3 w-3 rounded-[3px]"
              style={{ background: colorFor(Math.ceil(v * max)) }}
            />
          ))}
          <span>{lang === 'ja' ? '多い' : 'more'}</span>
        </div>
      </section>

      {(hovered || filtered) && (
        <motion.section
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-mint-500/30 bg-mint-500/5 p-5 space-y-3"
        >
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500">
                {(filtered ?? hovered)!.date}
              </div>
              <div className="text-lg font-semibold tracking-tight mt-0.5">
                {(filtered ?? hovered)!.count} {t.timeline.assets}
              </div>
            </div>
            {filtered && (
              <button
                onClick={() => setSelected(null)}
                className="text-[11px] text-ink-400 hover:text-mint-500"
              >
                {lang === 'ja' ? 'クリア' : 'clear'}
              </button>
            )}
          </div>
          {(filtered ?? hovered)!.count === 0 ? (
            <div className="text-xs text-ink-400">{t.timeline.none}</div>
          ) : (
            <ul className="space-y-1.5">
              {(filtered ?? hovered)!.assets.map(({ asset, domain }) => (
                <li key={asset.id}>
                  <Link
                    href={`/asset/${asset.id}/`}
                    className="flex items-center gap-2 text-sm hover:text-mint-500 transition-colors"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: domain.color }}
                    />
                    <span className="truncate">
                      {pickField(asset as never, 'displayName', lang)}
                    </span>
                    <span className="text-ink-400 font-mono text-[11px] truncate ml-auto">
                      {asset.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      )}
    </div>
  );
}
