import { Check, Clock, AlertCircle, Archive, Sparkles, FileWarning, FileX } from 'lucide-react';
import type { AssetStatus } from '@/lib/types';

const STYLES: Record<
  AssetStatus,
  { bg: string; fg: string; ring: string; icon: React.ReactNode }
> = {
  Approved: {
    bg: 'bg-emerald-500/10',
    fg: 'text-emerald-500',
    ring: 'ring-emerald-500/30',
    icon: <Check className="h-3 w-3" />,
  },
  Accepted: {
    bg: 'bg-emerald-500/10',
    fg: 'text-emerald-500',
    ring: 'ring-emerald-500/30',
    icon: <Check className="h-3 w-3" />,
  },
  'Under Review': {
    bg: 'bg-amber-500/10',
    fg: 'text-amber-500',
    ring: 'ring-amber-500/30',
    icon: <Clock className="h-3 w-3" />,
  },
  'Submitted for Approval': {
    bg: 'bg-amber-500/10',
    fg: 'text-amber-500',
    ring: 'ring-amber-500/30',
    icon: <Clock className="h-3 w-3" />,
  },
  Candidate: {
    bg: 'bg-sky-500/10',
    fg: 'text-sky-500',
    ring: 'ring-sky-500/30',
    icon: <Sparkles className="h-3 w-3" />,
  },
  Obsolete: {
    bg: 'bg-ink-500/10',
    fg: 'text-ink-500',
    ring: 'ring-ink-500/30',
    icon: <Archive className="h-3 w-3" />,
  },
  Rejected: {
    bg: 'bg-rose-500/10',
    fg: 'text-rose-500',
    ring: 'ring-rose-500/30',
    icon: <FileX className="h-3 w-3" />,
  },
};

export function StatusBadge({ status }: { status: AssetStatus }) {
  const style = STYLES[status] ?? {
    bg: 'bg-ink-500/10',
    fg: 'text-ink-500',
    ring: 'ring-ink-500/30',
    icon: <AlertCircle className="h-3 w-3" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${style.bg} ${style.fg} ${style.ring}`}
    >
      {style.icon}
      {status}
    </span>
  );
}

export function CertifiedMark({ certified }: { certified: boolean }) {
  if (!certified) return null;
  return (
    <span
      title="Certified asset"
      className="inline-flex items-center gap-1 rounded-full bg-mint-500/10 text-mint-500 ring-1 ring-mint-500/30 px-2 py-0.5 text-[11px] font-medium"
    >
      <Check className="h-3 w-3" />
      Certified
    </span>
  );
}
