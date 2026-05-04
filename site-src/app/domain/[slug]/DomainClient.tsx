'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AssetTable } from '@/components/AssetTable';
import { StatTile } from '@/components/StatTile';
import { QualityRing } from '@/components/QualityRing';
import { OwnerLink } from '@/components/OwnerLink';
import { useT, pickField } from '@/lib/i18n';
import type { Community, Domain } from '@/lib/types';

export function DomainClient({
  domain,
  community,
}: {
  domain: Domain;
  community: Community;
}) {
  const { t, lang } = useT();

  const name = pickField(domain as never, 'name', lang);
  const description = pickField(domain as never, 'description', lang);

  const avgQuality = Math.round(
    domain.assets.reduce((sum, a) => sum + a.qualityScore, 0) / Math.max(1, domain.assets.length),
  );
  const totalRows = domain.assets.reduce((sum, a) => sum + (a.rowCount ?? 0), 0);
  const certifiedCount = domain.assets.filter((a) => a.certified).length;

  const tagFreq = new Map<string, number>();
  for (const a of domain.assets) {
    for (const tag of a.tags) tagFreq.set(tag, (tagFreq.get(tag) ?? 0) + 1);
  }
  const topTags = [...tagFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const sourceSystems = [
    ...new Set(domain.assets.map((a) => a.sourceSystem).filter(Boolean) as string[]),
  ];

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-mint-500 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        {t.nav.backToMap}
      </Link>

      <header className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: domain.color }}
            />
            <span className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
              {domain.domainType}
            </span>
            <span className="text-[11px] text-ink-400">·</span>
            <span className="text-[11px] text-ink-400">{community.name}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
          <p className="text-ink-500 dark:text-ink-400 text-sm leading-relaxed max-w-2xl">
            {description}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
            <span>
              <span className="text-ink-400">{t.domain.steward} · </span>
              <OwnerLink
                name={domain.steward}
                stewardName={domain.steward}
                domainName={name}
                className="text-ink-700 dark:text-ink-200"
              />
            </span>
            {domain.technicalSteward && (
              <span>
                <span className="text-ink-400">{t.domain.technicalSteward} · </span>
                <OwnerLink
                  name={domain.technicalSteward}
                  stewardName={domain.steward}
                  domainName={name}
                  className="text-ink-700 dark:text-ink-200"
                />
              </span>
            )}
            <span>
              <span className="text-ink-400">{t.domain.anatomy} · </span>
              <span className="text-ink-700 dark:text-ink-200">
                {domain.bodyRegions.join(', ')}
              </span>
            </span>
          </div>
        </div>
        <QualityRing score={avgQuality} size={92} label={t.domain.avgQuality} />
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label={t.domain.assets} value={domain.assetCount} />
        <StatTile label={t.domain.totalRows} value={totalRows.toLocaleString('en-US')} />
        <StatTile
          label={t.domain.certified}
          value={certifiedCount}
          hint={`/ ${domain.assetCount}`}
          accent="#2dd4bf"
        />
        <StatTile label={t.domain.sourceSystems} value={sourceSystems.length} />
      </section>

      {sourceSystems.length > 0 && (
        <section className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink-400 mr-1">
            {t.domain.sourceSystems}
          </span>
          {sourceSystems.map((s) => (
            <span
              key={s}
              className="rounded-md bg-ink-100/80 dark:bg-ink-800/60 px-2 py-0.5 text-[11px] text-ink-700 dark:text-ink-200"
            >
              {s}
            </span>
          ))}
        </section>
      )}

      {topTags.length > 0 && (
        <section className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink-400 mr-1">
            {t.domain.commonTags}
          </span>
          {topTags.map(([tag, count]) => (
            <span
              key={tag}
              className="rounded-full border border-ink-200 dark:border-ink-800 px-2.5 py-0.5 text-[11px] text-ink-600 dark:text-ink-300"
            >
              {tag} <span className="text-ink-400">· {count}</span>
            </span>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">{t.domain.assets}</h2>
        <AssetTable assets={domain.assets} />
      </section>
    </div>
  );
}
