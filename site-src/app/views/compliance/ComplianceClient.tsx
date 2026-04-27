'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Asset, Catalog, Domain } from '@/lib/types';
import { useT, pickField } from '@/lib/i18n';
import { StatTile } from '@/components/StatTile';
import { qualityHex } from '@/lib/utils';

type Bucket = {
  framework: string;
  assets: { asset: Asset; domain: Domain }[];
  avgQuality: number;
  certifiedRate: number;
};

export function ComplianceClient({ catalog }: { catalog: Catalog }) {
  const { t, lang } = useT();
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<Bucket | null>(null);

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<string, { asset: Asset; domain: Domain }[]>();
    for (const domain of catalog.domains) {
      for (const asset of domain.assets) {
        const fws = asset.regulatoryFrameworks ?? [];
        if (fws.length === 0) {
          const k = '__none__';
          if (!map.has(k)) map.set(k, []);
          map.get(k)!.push({ asset, domain });
          continue;
        }
        for (const fw of fws) {
          if (!map.has(fw)) map.set(fw, []);
          map.get(fw)!.push({ asset, domain });
        }
      }
    }
    return [...map.entries()]
      .map(([fw, items]) => ({
        framework: fw === '__none__' ? t.compliance.noFramework : fw,
        assets: items,
        avgQuality: Math.round(
          items.reduce((s, x) => s + x.asset.qualityScore, 0) / Math.max(1, items.length),
        ),
        certifiedRate: Math.round(
          (items.filter((x) => x.asset.certified).length / Math.max(1, items.length)) * 100,
        ),
      }))
      .sort((a, b) => b.assets.length - a.assets.length);
  }, [catalog, t.compliance.noFramework]);

  const totalAssets = buckets.reduce((s, b) => s + b.assets.length, 0);
  const grossArea = totalAssets;
  const tiles = buckets.map((b, i) => {
    const flexBasis = `${(b.assets.length / grossArea) * 100}%`;
    return { ...b, flexBasis, i };
  });

  const selectedBucket = selected ? buckets.find((b) => b.framework === selected) : null;

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
        <h1 className="text-3xl font-semibold tracking-tight">{t.compliance.title}</h1>
        <p className="text-ink-500 dark:text-ink-400 max-w-2xl text-sm leading-relaxed">
          {t.compliance.desc}
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label={lang === 'ja' ? 'フレームワーク数' : 'Frameworks tracked'}
          value={buckets.length}
        />
        <StatTile
          label={lang === 'ja' ? 'タグ付け回数' : 'Framework tags applied'}
          value={totalAssets}
        />
        <StatTile
          label={lang === 'ja' ? '最大バケット' : 'Largest bucket'}
          value={buckets[0]?.framework ?? '—'}
          hint={buckets[0] ? `${buckets[0].assets.length} ${t.compliance.assets}` : undefined}
        />
        <StatTile
          label={t.compliance.avgQuality}
          value={Math.round(
            buckets.reduce((s, b) => s + b.avgQuality * b.assets.length, 0) /
              Math.max(1, totalAssets),
          )}
          hint="/ 100"
          accent="#2dd4bf"
        />
      </section>

      <section className="rounded-2xl border border-ink-200 dark:border-ink-800 bg-gradient-to-br from-ink-950/60 to-ink-900/30 p-3">
        <div className="flex flex-wrap gap-1.5 min-h-[420px]">
          {tiles.map((tile) => {
            const isSelected = selected === tile.framework;
            const color = qualityHex(tile.avgQuality);
            const minBasis = Math.max(120, Math.sqrt(tile.assets.length) * 70);
            return (
              <motion.button
                key={tile.framework}
                layout
                onMouseEnter={() => setHovered(tile)}
                onMouseLeave={() => setHovered(null)}
                onClick={() =>
                  setSelected((s) => (s === tile.framework ? null : tile.framework))
                }
                className={`relative overflow-hidden rounded-xl px-3 py-2.5 text-left ring-1 transition-all ${
                  isSelected
                    ? 'ring-mint-500 scale-[1.01]'
                    : 'ring-transparent hover:ring-mint-500/40'
                }`}
                style={{
                  flexGrow: tile.assets.length,
                  flexBasis: minBasis,
                  background: `linear-gradient(135deg, ${color}33, ${color}10)`,
                  borderColor: `${color}33`,
                  minHeight: 88 + Math.sqrt(tile.assets.length) * 14,
                }}
              >
                <div
                  className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-20 blur-3xl"
                  style={{ background: color }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <div className="text-[12px] font-medium tracking-tight truncate">
                    {tile.framework}
                  </div>
                  <span
                    className="text-[10px] tabular-nums px-1.5 py-0.5 rounded font-mono"
                    style={{ color, background: `${color}22` }}
                  >
                    Q{tile.avgQuality}
                  </span>
                </div>
                <div className="relative mt-1 text-2xl font-semibold tabular-nums">
                  {tile.assets.length}
                </div>
                <div className="relative text-[10px] text-ink-400 uppercase tracking-[0.16em]">
                  {t.compliance.assets}
                </div>
                <div className="relative mt-1.5 flex items-center gap-1">
                  <div className="h-1 flex-1 rounded-full bg-ink-100/30 dark:bg-ink-800/60 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${tile.certifiedRate}%`, background: '#2dd4bf' }}
                    />
                  </div>
                  <span className="text-[10px] text-mint-500 tabular-nums">
                    {tile.certifiedRate}%
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {selectedBucket && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-mint-500/30 bg-mint-500/5 p-5 space-y-3"
          >
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500">
                  {selectedBucket.framework}
                </div>
                <div className="text-lg font-semibold tracking-tight mt-0.5">
                  {selectedBucket.assets.length} {t.compliance.assets} · Q
                  {selectedBucket.avgQuality}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-[11px] text-ink-400 hover:text-mint-500"
              >
                {lang === 'ja' ? 'クリア' : 'clear'}
              </button>
            </div>
            <ul className="space-y-1.5 max-h-[360px] overflow-y-auto scroll-fade pr-2">
              {selectedBucket.assets.map(({ asset, domain }) => (
                <li key={asset.id}>
                  <Link
                    href={`/asset/${asset.id}/`}
                    className="flex items-center gap-2 text-sm hover:text-mint-500 transition-colors"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: domain.color }}
                    />
                    <span className="truncate flex-1">
                      {pickField(asset as never, 'displayName', lang)}
                    </span>
                    <span className="text-ink-400 font-mono text-[11px] truncate">
                      {asset.name}
                    </span>
                    <span className="text-[11px] tabular-nums text-ink-400">
                      Q{asset.qualityScore}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.section>
        )}
      </AnimatePresence>

      {!selectedBucket && hovered && (
        <div className="text-[11px] text-ink-400">
          {lang === 'ja'
            ? 'タイルをクリックすると詳細リスト表示'
            : 'Click a tile to see the asset list'}
        </div>
      )}
    </div>
  );
}
