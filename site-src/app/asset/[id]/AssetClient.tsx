'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Database,
  Tag,
  Calendar,
  User,
  Users,
  Server,
  FileCode,
  GitBranch,
  ShieldCheck,
} from 'lucide-react';
import { QualityRing } from '@/components/QualityRing';
import { StatTile } from '@/components/StatTile';
import { StatusBadge, CertifiedMark } from '@/components/StatusBadge';
import {
  ClassificationChip,
  GxpChip,
  PhiChip,
  PiiChip,
  RegulatoryChip,
} from '@/components/Chips';
import { OwnerLink } from '@/components/OwnerLink';
import { formatNumber, freshnessLabel } from '@/lib/utils';
import { useT, pickField } from '@/lib/i18n';
import type { Asset, Domain } from '@/lib/types';

type UpstreamRef = {
  id: string;
  name: string;
  displayName: string;
  displayNameJa?: string;
  domainColor: string;
};

export function AssetClient({
  asset,
  domain,
  upstream,
}: {
  asset: Asset;
  domain: Domain;
  upstream: UpstreamRef[];
}) {
  const { t, lang } = useT();

  const displayName = pickField(asset as never, 'displayName', lang);
  const description = pickField(asset as never, 'description', lang);
  const domainName = pickField(domain as never, 'name', lang);

  return (
    <div className="space-y-8">
      <Link
        href={`/domain/${domain.slug}/`}
        className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-mint-500 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        {t.nav.backTo} {domainName}
      </Link>

      <header className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="space-y-3 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="rounded-md px-1.5 py-0.5 text-[11px] font-medium"
              style={{ background: `${domain.color}22`, color: domain.color }}
            >
              {domainName}
            </span>
            <span className="rounded-md bg-ink-100/80 dark:bg-ink-800/60 px-1.5 py-0.5 text-[11px]">
              {asset.type}
            </span>
            <StatusBadge status={asset.status} />
            <CertifiedMark certified={asset.certified} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {displayName}
          </h1>
          <div className="font-mono text-xs text-ink-400 break-all">{asset.name}</div>
          <p className="text-ink-500 dark:text-ink-400 text-sm leading-relaxed max-w-2xl">
            {description}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <ClassificationChip value={asset.classification} />
            {asset.containsPhi && <PhiChip />}
            {asset.containsPii && <PiiChip />}
            {asset.gxpRelevant && <GxpChip />}
          </div>
        </div>
        <QualityRing score={asset.qualityScore} size={92} label={t.domain.avgQuality} />
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label={t.asset.rows} value={formatNumber(asset.rowCount)} />
        <StatTile label={t.asset.updated} value={freshnessLabel(asset.freshness)} />
        <StatTile label={t.domain.steward} value={asset.steward} />
        <StatTile
          label={t.asset.sourceSystem}
          value={asset.sourceSystem ?? '—'}
          hint={asset.cdiscDomain ? `SDTM ${asset.cdiscDomain}` : undefined}
        />
      </section>

      {asset.qualityBreakdown && (
        <section className="rounded-2xl border border-ink-200 dark:border-ink-800 px-5 py-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400 mb-3">
            {t.asset.qualityBreakdown}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Meter label={t.asset.completeness} value={asset.qualityBreakdown.completeness} />
            <Meter label={t.asset.freshness} value={asset.qualityBreakdown.freshness} />
            <Meter label={t.asset.validity} value={asset.qualityBreakdown.validity} />
            <Meter label={t.asset.lineage} value={asset.qualityBreakdown.lineage} />
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-ink-200 dark:border-ink-800 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-ink-200 dark:border-ink-800 flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-mint-500" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
              {t.asset.schema}
            </span>
            {asset.standard && (
              <span className="ml-auto text-[11px] font-mono text-ink-400">{asset.standard}</span>
            )}
          </div>
          {asset.columns && asset.columns.length > 0 ? (
            <ul className="divide-y divide-ink-100 dark:divide-ink-900">
              {asset.columns.map((c) => (
                <li key={c.name} className="grid grid-cols-12 px-4 py-2.5 text-sm items-center">
                  <div className="col-span-4 font-mono text-[13px] truncate flex items-center gap-1.5">
                    {c.name}
                    {c.pii && (
                      <span title="Contains PII" className="text-amber-500">
                        <ShieldCheck className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="col-span-3 font-mono text-[11px] text-ink-400">
                    {c.dataType}
                  </div>
                  <div className="col-span-5 text-[12px] text-ink-500 dark:text-ink-400 truncate">
                    {c.cdiscVariable && (
                      <span className="font-mono text-mint-500 mr-1.5">{c.cdiscVariable}</span>
                    )}
                    {c.description ?? ''}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-sm text-ink-400">
              {t.asset.noColumns} {asset.type.toLowerCase()}
              {t.asset.noColumnsSuffix || '.'}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-ink-200 dark:border-ink-800 p-4 space-y-3">
            <Detail icon={<User className="h-3.5 w-3.5" />} label={t.domain.steward}>
              <OwnerLink
                name={asset.steward}
                assetId={asset.id}
                assetName={displayName}
                domainName={domainName}
              />
            </Detail>
            {asset.owner && (
              <Detail icon={<User className="h-3.5 w-3.5" />} label={t.asset.owner}>
                <OwnerLink
                  name={asset.owner}
                  assetId={asset.id}
                  assetName={displayName}
                  domainName={domainName}
                />
              </Detail>
            )}
            {asset.smes && asset.smes.length > 0 && (
              <Detail icon={<Users className="h-3.5 w-3.5" />} label={t.asset.smes}>
                <span className="flex flex-wrap gap-x-1.5">
                  {asset.smes.map((sme, i) => (
                    <span key={sme}>
                      <OwnerLink
                        name={sme}
                        assetId={asset.id}
                        assetName={displayName}
                        domainName={domainName}
                      />
                      {i < asset.smes!.length - 1 && <span className="text-ink-400">,</span>}
                    </span>
                  ))}
                </span>
              </Detail>
            )}
            <Detail icon={<Calendar className="h-3.5 w-3.5" />} label={t.asset.lastRefresh}>
              <span>
                {new Date(asset.freshness).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </Detail>
            {asset.sourceSystem && (
              <Detail icon={<Server className="h-3.5 w-3.5" />} label={t.asset.sourceSystem}>
                <span>{asset.sourceSystem}</span>
              </Detail>
            )}
            {asset.database && (
              <Detail
                icon={<Database className="h-3.5 w-3.5" />}
                label={t.asset.physicalLocation}
              >
                <span className="font-mono text-xs break-all">
                  {asset.database}
                  {asset.schema ? `.${asset.schema}` : ''}
                  {asset.tableName ? `.${asset.tableName}` : ''}
                </span>
              </Detail>
            )}
            {asset.cdiscDomain && (
              <Detail
                icon={<FileCode className="h-3.5 w-3.5" />}
                label={t.asset.cdiscDomain}
              >
                <span>{asset.cdiscDomain}</span>
              </Detail>
            )}
          </div>

          {asset.regulatoryFrameworks && asset.regulatoryFrameworks.length > 0 && (
            <div className="rounded-2xl border border-ink-200 dark:border-ink-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-3.5 w-3.5 text-mint-500" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
                  {t.asset.regulatoryScope}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {asset.regulatoryFrameworks.map((f) => (
                  <RegulatoryChip key={f} framework={f} />
                ))}
              </div>
            </div>
          )}

          {asset.tags.length > 0 && (
            <div className="rounded-2xl border border-ink-200 dark:border-ink-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-3.5 w-3.5 text-mint-500" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
                  {t.asset.tags}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {asset.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-ink-200 dark:border-ink-800 px-2 py-0.5 text-[11px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {upstream.length > 0 && (
            <div className="rounded-2xl border border-ink-200 dark:border-ink-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="h-3.5 w-3.5 text-mint-500" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
                  {t.asset.upstreamLineage}
                </span>
              </div>
              <ul className="space-y-1.5">
                {upstream.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/asset/${u.id}/`}
                      className="flex items-center gap-2 text-xs text-ink-600 dark:text-ink-300 hover:text-mint-500 transition-colors"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: u.domainColor }}
                      />
                      <span className="font-mono">{u.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-mint-500/30 bg-mint-500/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500 mb-2">
              {t.asset.requestAccess}
            </div>
            <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
              {t.asset.requestAccessHint}
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-ink-400">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.16em] text-ink-400">{label}</div>
        <div className="text-sm break-words">{children}</div>
      </div>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-ink-400">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            background:
              value >= 90
                ? '#10b981'
                : value >= 80
                  ? '#22d3ee'
                  : value >= 70
                    ? '#fbbf24'
                    : '#f87171',
          }}
        />
      </div>
    </div>
  );
}
