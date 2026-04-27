'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Asset } from '@/lib/types';
import { formatNumber, freshnessLabel, qualityHex } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { ClassificationChip } from './Chips';
import { useT, pickField } from '@/lib/i18n';

type Props = {
  assets: Asset[];
};

export function AssetTable({ assets }: Props) {
  const { lang } = useT();

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800">
      <div className="hidden md:grid grid-cols-12 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-ink-400 bg-ink-50/60 dark:bg-ink-900/40 border-b border-ink-200 dark:border-ink-800">
        <div className="col-span-5">Asset</div>
        <div className="col-span-2">Type · Status</div>
        <div className="col-span-2 text-right">Rows</div>
        <div className="col-span-2">Quality</div>
        <div className="col-span-1 text-right">Updated</div>
      </div>
      <ul>
        {assets.map((asset) => {
          const displayName = pickField(asset as never, 'displayName', lang);
          return (
            <li key={asset.id}>
              <Link
                href={`/asset/${asset.id}/`}
                className="md:grid md:grid-cols-12 flex flex-col gap-2 md:gap-0 md:items-center px-4 py-3 text-sm hover:bg-mint-50/40 dark:hover:bg-mint-900/10 border-b border-ink-100 dark:border-ink-900 last:border-b-0 transition-colors group"
              >
                <div className="md:col-span-5 min-w-0 md:pr-3">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{displayName}</div>
                    <ClassificationChip value={asset.classification} />
                  </div>
                  <div className="text-[11px] text-ink-400 truncate font-mono">{asset.name}</div>
                  <div className="text-[11px] text-ink-400 truncate mt-0.5 hidden md:block">
                    {pickField(asset as never, 'description', lang)}
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center gap-1.5 flex-wrap">
                  <span className="rounded-md bg-ink-100/80 dark:bg-ink-800/60 px-1.5 py-0.5 text-[11px]">
                    {asset.type}
                  </span>
                  <StatusBadge status={asset.status} />
                </div>
                <div className="md:col-span-2 md:text-right font-mono text-xs tabular-nums text-ink-500 dark:text-ink-400">
                  {formatNumber(asset.rowCount)}
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
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
                <div className="md:col-span-1 flex items-center md:justify-end gap-1 text-[11px] text-ink-400">
                  <span>{freshnessLabel(asset.freshness)}</span>
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
