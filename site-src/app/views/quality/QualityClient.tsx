'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Catalog } from '@/lib/types';
import { useT, pickField } from '@/lib/i18n';
import { StatTile } from '@/components/StatTile';
import { freshnessLabel, qualityHex } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';

const MS_DAY = 24 * 60 * 60 * 1000;

export function QualityClient({ catalog }: { catalog: Catalog }) {
  const { t, lang } = useT();

  const allAssets = catalog.domains.flatMap((d) => d.assets.map((a) => ({ asset: a, domain: d })));

  const avgScore = Math.round(
    allAssets.reduce((s, a) => s + a.asset.qualityScore, 0) / Math.max(1, allAssets.length),
  );
  const certifiedShare = Math.round(
    (allAssets.filter((a) => a.asset.certified).length / Math.max(1, allAssets.length)) * 100,
  );
  const fresh7 = allAssets.filter(
    (a) => Date.now() - new Date(a.asset.freshness).getTime() < 7 * MS_DAY,
  ).length;
  const gxpShare = Math.round(
    (allAssets.filter((a) => a.asset.gxpRelevant).length / Math.max(1, allAssets.length)) * 100,
  );

  const byDomain = catalog.domains
    .map((d) => ({
      name: pickField(d as never, 'name', lang),
      avg: Math.round(
        d.assets.reduce((s, a) => s + a.qualityScore, 0) / Math.max(1, d.assets.length),
      ),
      assets: d.assets.length,
      color: d.color,
    }))
    .sort((a, b) => b.avg - a.avg);

  const trend = useMemo(() => {
    const out: { week: string; quality: number; certified: number }[] = [];
    let q = avgScore - 6;
    let c = certifiedShare - 8;
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * MS_DAY);
      q = Math.max(60, Math.min(100, q + Math.sin(i / 1.6) * 1.4 + 0.6));
      c = Math.max(20, Math.min(95, c + Math.cos(i / 1.3) * 1.7 + 0.7));
      out.push({
        week: `${d.getMonth() + 1}/${d.getDate()}`,
        quality: Math.round(q),
        certified: Math.round(c),
      });
    }
    return out;
  }, [avgScore, certifiedShare]);

  const needsAttention = allAssets
    .filter(
      (a) =>
        a.asset.qualityScore < 80 ||
        a.asset.status === 'Under Review' ||
        a.asset.status === 'Candidate',
    )
    .sort((a, b) => a.asset.qualityScore - b.asset.qualityScore)
    .slice(0, 8);

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
        <h1 className="text-3xl font-semibold tracking-tight">{t.quality.title}</h1>
        <p className="text-ink-500 dark:text-ink-400 max-w-2xl text-sm leading-relaxed">
          {t.quality.desc}
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label={t.quality.avgScore} value={avgScore} hint="/ 100" accent="#2dd4bf" />
        <StatTile label={t.quality.certifiedShare} value={`${certifiedShare}%`} />
        <StatTile label={t.quality.freshLast7} value={fresh7} />
        <StatTile label={t.quality.gxpShare} value={`${gxpShare}%`} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-ink-200 dark:border-ink-800 px-5 py-4">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold tracking-tight">{t.quality.trend}</h2>
            <span className="text-[11px] text-ink-400">12 weeks</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-q" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-c" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.18)" strokeDasharray="3 3" />
                <XAxis dataKey="week" stroke="rgba(148,163,184,0.6)" fontSize={10} />
                <YAxis stroke="rgba(148,163,184,0.6)" fontSize={10} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(2,6,23,0.92)',
                    border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="quality"
                  stroke="#2dd4bf"
                  strokeWidth={2}
                  fill="url(#grad-q)"
                  name={t.quality.avgScore}
                />
                <Area
                  type="monotone"
                  dataKey="certified"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#grad-c)"
                  name={t.quality.certifiedShare}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200 dark:border-ink-800 px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight mb-3">
            {t.quality.breakdownByDomain}
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byDomain}
                layout="vertical"
                margin={{ left: -10, right: 16, top: 4, bottom: 0 }}
              >
                <CartesianGrid stroke="rgba(148,163,184,0.15)" horizontal={false} />
                <XAxis type="number" stroke="rgba(148,163,184,0.6)" fontSize={10} domain={[60, 100]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="rgba(148,163,184,0.6)"
                  fontSize={10}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(2,6,23,0.92)',
                    border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                  {byDomain.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-ink-200 dark:border-ink-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-ink-200 dark:border-ink-800 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold tracking-tight">{t.quality.needsAttention}</h2>
          <span className="text-[11px] text-ink-400">{needsAttention.length}</span>
        </div>
        <ul>
          {needsAttention.map(({ asset, domain }) => (
            <li
              key={asset.id}
              className="grid grid-cols-12 items-center px-5 py-2.5 text-sm border-b border-ink-100 dark:border-ink-900 last:border-b-0 hover:bg-mint-50/30 dark:hover:bg-mint-900/10 transition-colors"
            >
              <Link
                href={`/asset/${asset.id}/`}
                className="col-span-5 flex items-center gap-2 min-w-0"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: domain.color }}
                />
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {pickField(asset as never, 'displayName', lang)}
                  </div>
                  <div className="text-[11px] text-ink-400 truncate font-mono">
                    {asset.name}
                  </div>
                </div>
              </Link>
              <div className="col-span-2">
                <StatusBadge status={asset.status} />
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <div className="h-1.5 w-24 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${asset.qualityScore}%`,
                      background: qualityHex(asset.qualityScore),
                    }}
                  />
                </div>
                <span className="text-[11px] tabular-nums text-ink-500 dark:text-ink-400">
                  {asset.qualityScore}
                </span>
              </div>
              <div className="col-span-2 text-[11px] text-ink-400 text-right">
                {freshnessLabel(asset.freshness)}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
