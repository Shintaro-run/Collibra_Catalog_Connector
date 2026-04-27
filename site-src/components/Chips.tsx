import { Lock, Shield, Stethoscope } from 'lucide-react';
import type { Classification } from '@/lib/types';

const CLASSIFICATION_STYLE: Record<Classification, { bg: string; fg: string }> = {
  Public: { bg: 'bg-ink-500/10', fg: 'text-ink-500' },
  Internal: { bg: 'bg-sky-500/10', fg: 'text-sky-500' },
  Confidential: { bg: 'bg-amber-500/10', fg: 'text-amber-500' },
  Restricted: { bg: 'bg-rose-500/10', fg: 'text-rose-500' },
};

export function ClassificationChip({ value }: { value: Classification }) {
  const s = CLASSIFICATION_STYLE[value];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${s.bg} ${s.fg}`}>
      <Lock className="h-2.5 w-2.5" />
      {value}
    </span>
  );
}

export function GxpChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium bg-violet-500/10 text-violet-500">
      <Shield className="h-2.5 w-2.5" />
      GxP
    </span>
  );
}

export function PhiChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium bg-rose-500/10 text-rose-500">
      <Stethoscope className="h-2.5 w-2.5" />
      PHI
    </span>
  );
}

export function PiiChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium bg-amber-500/10 text-amber-500">
      <Lock className="h-2.5 w-2.5" />
      PII
    </span>
  );
}

export function RegulatoryChip({ framework }: { framework: string }) {
  return (
    <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-mono bg-ink-100/80 dark:bg-ink-800/60 text-ink-600 dark:text-ink-300">
      {framework}
    </span>
  );
}
