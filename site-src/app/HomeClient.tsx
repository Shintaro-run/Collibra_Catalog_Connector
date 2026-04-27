'use client';

import { BodyMap3D } from '@/components/BodyMap3D';
import { StatTile } from '@/components/StatTile';
import { freshnessLabel } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { Catalog } from '@/lib/types';

export function HomeClient({ catalog }: { catalog: Catalog }) {
  const { t } = useT();

  const allAssets = catalog.domains.flatMap((d) => d.assets);
  const avgQuality = Math.round(
    allAssets.reduce((sum, a) => sum + a.qualityScore, 0) / Math.max(1, allAssets.length),
  );
  const mostRecent = allAssets.reduce((a, b) =>
    new Date(a.freshness) > new Date(b.freshness) ? a : b,
  );

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500">
          {t.home.kicker}
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-2xl">
          {t.home.headline}
        </h1>
        <p className="text-ink-500 dark:text-ink-400 max-w-2xl text-sm leading-relaxed">
          {t.home.lede}
        </p>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label={t.home.stats.therapeuticAreas} value={catalog.domainCount} />
        <StatTile label={t.home.stats.catalogued} value={catalog.assetCount} />
        <StatTile label={t.home.stats.avgQuality} value={avgQuality} hint="/ 100" accent="#2dd4bf" />
        <StatTile
          label={t.home.stats.lastRefresh}
          value={freshnessLabel(mostRecent.freshness)}
          hint={mostRecent.displayName}
        />
      </section>

      <section>
        <BodyMap3D domains={catalog.domains} />
      </section>
    </div>
  );
}
