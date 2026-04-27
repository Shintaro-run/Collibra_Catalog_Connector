'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Domain, BodyRegion } from '@/lib/types';

type Props = {
  domains: Domain[];
};

type RegionGeometry = {
  id: BodyRegion;
  label: string;
  d: string;
  centroid: [number, number];
};

const REGIONS: RegionGeometry[] = [
  {
    id: 'head',
    label: 'Head',
    d: 'M150 20 a40 42 0 1 1 -0.1 0 z M125 84 q25 18 50 0 l-3 22 q-22 14 -44 0 z',
    centroid: [150, 60],
  },
  {
    id: 'chest-left',
    label: 'Chest (L)',
    d: 'M97 116 q-12 4 -16 18 l-2 60 q12 10 30 8 l8 -86 z',
    centroid: [98, 158],
  },
  {
    id: 'chest-right',
    label: 'Chest (R)',
    d: 'M203 116 q12 4 16 18 l2 60 q-12 10 -30 8 l-8 -86 z',
    centroid: [202, 158],
  },
  {
    id: 'abdomen-upper',
    label: 'Upper abdomen',
    d: 'M118 204 l64 0 l-2 44 l-60 0 z',
    centroid: [150, 226],
  },
  {
    id: 'abdomen-lower',
    label: 'Lower abdomen',
    d: 'M120 252 l60 0 l-2 38 l-56 0 z',
    centroid: [150, 270],
  },
  {
    id: 'pelvis',
    label: 'Pelvis',
    d: 'M122 294 l56 0 l-4 36 l-48 0 z',
    centroid: [150, 312],
  },
  {
    id: 'arms',
    label: 'Arms',
    d: 'M70 124 q-8 6 -10 18 l-4 90 q4 8 14 6 l8 -90 q2 -10 6 -18 z M230 124 q8 6 10 18 l4 90 q-4 8 -14 6 l-8 -90 q-2 -10 -6 -18 z',
    centroid: [62, 200],
  },
  {
    id: 'legs',
    label: 'Legs',
    d: 'M124 332 l24 0 l-4 138 l-22 0 z M152 332 l24 0 l-2 138 l-22 0 z',
    centroid: [150, 410],
  },
  {
    id: 'systemic',
    label: 'Systemic',
    d: 'M0 0 0 0',
    centroid: [260, 96],
  },
];

const GEOMETRY = new Map(REGIONS.map((r) => [r.id, r]));

export function BodyMap({ domains }: Props) {
  const [hoveredDomain, setHoveredDomain] = useState<Domain | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);

  const regionToDomains = useMemo(() => {
    const map = new Map<BodyRegion, Domain[]>();
    for (const domain of domains) {
      for (const region of domain.bodyRegions) {
        if (!map.has(region)) map.set(region, []);
        map.get(region)!.push(domain);
      }
    }
    return map;
  }, [domains]);

  const activeRegions = useMemo(() => {
    if (hoveredDomain) return new Set(hoveredDomain.bodyRegions);
    if (hoveredRegion) return new Set([hoveredRegion]);
    return new Set<BodyRegion>();
  }, [hoveredDomain, hoveredRegion]);

  const connections = useMemo(() => {
    if (!hoveredDomain || hoveredDomain.bodyRegions.length < 2) return [];
    const points = hoveredDomain.bodyRegions
      .map((r) => GEOMETRY.get(r)?.centroid)
      .filter((p): p is [number, number] => Boolean(p));
    const lines: { from: [number, number]; to: [number, number] }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      lines.push({ from: points[i], to: points[i + 1] });
    }
    return lines;
  }, [hoveredDomain]);

  const systemicDomains = regionToDomains.get('systemic') ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
      <div className="relative aspect-[3/5] max-h-[680px] mx-auto w-full">
        <svg
          viewBox="0 0 300 500"
          className="w-full h-full"
          aria-label="Anatomical map of therapeutic areas"
        >
          <defs>
            <radialGradient id="bodyGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="rgba(45,212,191,0.10)" />
              <stop offset="100%" stopColor="rgba(45,212,191,0)" />
            </radialGradient>
            <linearGradient id="bodyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(148,163,184,0.16)" />
              <stop offset="100%" stopColor="rgba(148,163,184,0.06)" />
            </linearGradient>
          </defs>

          <ellipse cx="150" cy="220" rx="160" ry="240" fill="url(#bodyGlow)" />

          <path
            d="M150 18 a42 44 0 1 1 -0.1 0 M120 90 q30 20 60 0 l-3 26 q22 6 32 28 l4 80 q-2 26 -16 38 l4 60 q-4 36 -16 68 l4 90 q4 12 -10 14 l-22 0 l-6 -180 l-22 0 l-6 180 l-22 0 q-14 -2 -10 -14 l4 -90 q-12 -32 -16 -68 l4 -60 q-14 -12 -16 -38 l4 -80 q10 -22 32 -28 z"
            fill="url(#bodyFill)"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {REGIONS.filter((r) => r.id !== 'systemic').map((region) => {
            const isActive = activeRegions.has(region.id);
            const isDimmed = hoveredDomain && !isActive;
            return (
              <path
                key={region.id}
                d={region.d}
                className={[
                  'region',
                  isActive ? 'active' : '',
                  isDimmed ? 'dim' : '',
                ].join(' ')}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
            );
          })}

          {connections.map((line, i) => (
            <motion.line
              key={i}
              x1={line.from[0]}
              y1={line.from[1]}
              x2={line.to[0]}
              y2={line.to[1]}
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.85 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            />
          ))}

          {REGIONS.filter((r) => r.id !== 'systemic').map((region) => {
            const list = regionToDomains.get(region.id) ?? [];
            const total = list.reduce((sum, d) => sum + d.assetCount, 0);
            if (total === 0) return null;
            const isActive = activeRegions.has(region.id);
            return (
              <g key={`badge-${region.id}`} pointerEvents="none">
                <circle
                  cx={region.centroid[0]}
                  cy={region.centroid[1]}
                  r={isActive ? 14 : 11}
                  fill="rgba(15,23,42,0.85)"
                  stroke="var(--accent)"
                  strokeWidth="1"
                />
                <text
                  x={region.centroid[0]}
                  y={region.centroid[1] + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#e6edf3"
                >
                  {total}
                </text>
              </g>
            );
          })}
        </svg>

        <AnimatePresence>
          {(hoveredRegion || hoveredDomain) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              className="absolute top-2 left-2 glass rounded-xl px-3 py-2 text-xs"
            >
              <div className="font-semibold tracking-tight">
                {hoveredDomain?.name ?? GEOMETRY.get(hoveredRegion!)?.label}
              </div>
              {hoveredRegion && !hoveredDomain && (
                <div className="text-ink-400 mt-1">
                  {(regionToDomains.get(hoveredRegion) ?? [])
                    .map((d) => d.name)
                    .join(' · ') || 'No mapped therapeutic areas'}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
          Therapeutic areas
        </div>
        <ul className="space-y-2">
          {domains
            .filter((d) => !d.bodyRegions.includes('systemic') || d.bodyRegions.length === 1)
            .map((domain) => (
              <DomainRow
                key={domain.id}
                domain={domain}
                onHover={setHoveredDomain}
              />
            ))}
        </ul>

        {systemicDomains.length > 0 && (
          <>
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400 pt-3">
              Cross-system
            </div>
            <ul className="space-y-2">
              {domains
                .filter((d) => d.bodyRegions.includes('systemic') && d.bodyRegions.length > 1)
                .concat(systemicDomains.filter((d) => d.bodyRegions.length === 1))
                .filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i)
                .map((domain) => (
                  <DomainRow
                    key={domain.id}
                    domain={domain}
                    onHover={setHoveredDomain}
                    crossSystem
                  />
                ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function DomainRow({
  domain,
  onHover,
  crossSystem,
}: {
  domain: Domain;
  onHover: (d: Domain | null) => void;
  crossSystem?: boolean;
}) {
  return (
    <li>
      <Link
        href={`/domain/${domain.slug}/`}
        onMouseEnter={() => onHover(domain)}
        onMouseLeave={() => onHover(null)}
        className="group flex items-center justify-between rounded-xl border border-ink-200 dark:border-ink-800 px-3 py-2.5 hover:border-mint-400 hover:bg-mint-50/50 dark:hover:bg-mint-900/10 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: domain.color }}
          />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{domain.name}</div>
            <div className="text-[11px] text-ink-400 truncate">
              {crossSystem ? 'Spans multiple regions · ' : ''}
              {domain.steward}
            </div>
          </div>
        </div>
        <span className="text-xs tabular-nums text-ink-500 dark:text-ink-400 group-hover:text-mint-500">
          {domain.assetCount}
        </span>
      </Link>
    </li>
  );
}
