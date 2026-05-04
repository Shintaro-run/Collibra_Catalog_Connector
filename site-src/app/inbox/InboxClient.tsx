'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Inbox,
  X,
  UserCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import {
  type AccessRequest,
  type InboxResult,
  type RequestStatus,
  counts,
  decide,
  loadInbox,
  seedIfEmpty,
} from '@/lib/requests';

type Props = {
  initialSeed: AccessRequest[];
};

type Filter = 'All' | RequestStatus;

export function InboxClient({ initialSeed }: Props) {
  const { t } = useT();
  const tt = t.inbox;

  const [result, setResult] = useState<InboxResult>({ ok: true, items: [] });
  const [filter, setFilter] = useState<Filter>('Pending');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    seedIfEmpty(() => initialSeed);
    refresh();
    setHydrated(true);
    const onUpdate = () => refresh();
    window.addEventListener('ccc-requests-updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('ccc-requests-updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refresh() {
    setResult(loadInbox());
  }

  const items = result.ok ? result.items : [];

  const stats = useMemo(() => counts(items), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      if (filter !== 'All' && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.asset.displayName.toLowerCase().includes(q) ||
        r.asset.name.toLowerCase().includes(q) ||
        r.requester.name.toLowerCase().includes(q) ||
        r.requester.email.toLowerCase().includes(q) ||
        r.stewardName.toLowerCase().includes(q) ||
        (r.ownerName ?? '').toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      );
    });
  }, [items, filter, query]);

  const active = useMemo(
    () => items.find((r) => r.id === activeId) ?? null,
    [items, activeId],
  );

  if (hydrated && !result.ok && result.reason === 'forbidden') {
    return (
      <>
        <header className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500">{tt.kicker}</div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-mint-500/15 ring-1 ring-mint-500/40 shrink-0">
              <UserCircle2 className="h-4 w-4 text-mint-500" />
            </span>
            {tt.title}
          </h1>
        </header>
        <section className="mt-8 glass rounded-2xl px-6 py-12 flex flex-col items-center text-center gap-4 max-w-xl mx-auto">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/40">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
          </span>
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold tracking-tight">{tt.forbidden.title}</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
              {tt.forbidden.body}
            </p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <header className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500">{tt.kicker}</div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-mint-500/15 ring-1 ring-mint-500/40 shrink-0">
                <UserCircle2 className="h-4 w-4 text-mint-500" />
              </span>
              {tt.title}
            </h1>
            <p className="text-sm text-ink-500 dark:text-ink-400 max-w-2xl leading-relaxed">
              {tt.lede}
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <Stat label={tt.stats.pending} value={stats.pending} tone="amber" />
        <Stat label={tt.stats.needsInfo} value={stats.needsInfo} tone="sky" />
        <Stat label={tt.stats.approved} value={stats.approved} tone="emerald" />
        <Stat label={tt.stats.rejected} value={stats.rejected} tone="rose" />
      </section>

      <section className="mt-6 glass rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-ink-200/60 dark:border-ink-800/60 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            {(['All', 'Pending', 'NeedsInfo', 'Approved', 'Rejected'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors border ${
                  filter === f
                    ? 'bg-mint-500/15 text-mint-500 border-mint-500/40'
                    : 'border-ink-200 dark:border-ink-800 text-ink-500 dark:text-ink-400 hover:border-mint-400 hover:text-mint-500'
                }`}
              >
                {filterLabel(f, tt.filters)}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-ink-200 dark:border-ink-800 bg-ink-50/30 dark:bg-ink-900/30 px-2.5 py-1.5 min-w-[260px]">
            <Search className="h-3.5 w-3.5 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tt.filters.search}
              className="bg-transparent outline-none text-xs flex-1 placeholder:text-ink-400"
            />
          </div>
        </div>

        {hydrated && filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-ink-400 flex flex-col items-center gap-3">
            <Inbox className="h-6 w-6" />
            {tt.table.empty}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-[0.14em] text-ink-400">
                <tr className="border-b border-ink-200/60 dark:border-ink-800/60">
                  <th className="text-left font-medium px-4 py-2.5">{tt.table.requester}</th>
                  <th className="text-left font-medium px-4 py-2.5">{tt.table.asset}</th>
                  <th className="text-left font-medium px-4 py-2.5 hidden md:table-cell">{tt.table.steward}</th>
                  <th className="text-left font-medium px-4 py-2.5 hidden md:table-cell">{tt.table.owner}</th>
                  <th className="text-left font-medium px-4 py-2.5">{tt.table.submitted}</th>
                  <th className="text-left font-medium px-4 py-2.5">{tt.table.status}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setActiveId(r.id)}
                    className="border-b border-ink-200/40 dark:border-ink-800/40 hover:bg-mint-500/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.requester.name}</div>
                      <div className="text-[11px] text-ink-400">{r.requester.department}</div>
                    </td>
                    <td className="px-4 py-3 min-w-0">
                      <div className="font-medium truncate max-w-[260px]">{r.asset.displayName}</div>
                      <div className="text-[11px] font-mono text-ink-400 truncate max-w-[260px]">{r.asset.name}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-ink-500 dark:text-ink-400 whitespace-nowrap">{r.stewardName}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-ink-500 dark:text-ink-400 whitespace-nowrap">
                      {r.ownerName ?? <span className="text-ink-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-500 dark:text-ink-400 whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <RequestStatusPill status={r.status} labels={tt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 text-[11px] text-ink-400 leading-relaxed">{tt.sharepointNote}</p>

      <RequestDrawer
        request={active}
        onClose={() => setActiveId(null)}
        onDecided={() => {
          refresh();
        }}
      />
    </>
  );
}

function filterLabel(f: Filter, labels: { all: string; pending: string; approved: string; rejected: string; needsInfo: string }): string {
  switch (f) {
    case 'All':
      return labels.all;
    case 'Pending':
      return labels.pending;
    case 'Approved':
      return labels.approved;
    case 'Rejected':
      return labels.rejected;
    case 'NeedsInfo':
      return labels.needsInfo;
  }
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'amber' | 'emerald' | 'rose' | 'sky';
}) {
  const toneClass = {
    amber: 'text-amber-500',
    emerald: 'text-emerald-500',
    rose: 'text-rose-500',
    sky: 'text-sky-500',
  }[tone];
  return (
    <div className="glass rounded-xl px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-ink-400">{label}</div>
      <div className={`text-2xl font-semibold tracking-tight mt-1 ${toneClass}`}>{value}</div>
    </div>
  );
}

const STATUS_PILL: Record<
  RequestStatus,
  { bg: string; fg: string; ring: string; icon: React.ReactNode }
> = {
  Pending: {
    bg: 'bg-amber-500/10',
    fg: 'text-amber-500',
    ring: 'ring-amber-500/30',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />,
  },
  NeedsInfo: {
    bg: 'bg-sky-500/10',
    fg: 'text-sky-500',
    ring: 'ring-sky-500/30',
    icon: <HelpCircle className="h-3 w-3" />,
  },
  Approved: {
    bg: 'bg-emerald-500/10',
    fg: 'text-emerald-500',
    ring: 'ring-emerald-500/30',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  Rejected: {
    bg: 'bg-rose-500/10',
    fg: 'text-rose-500',
    ring: 'ring-rose-500/30',
    icon: <XCircle className="h-3 w-3" />,
  },
};

function RequestStatusPill({
  status,
  labels,
}: {
  status: RequestStatus;
  labels: Record<RequestStatus, string>;
}) {
  const s = STATUS_PILL[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${s.bg} ${s.fg} ${s.ring}`}
    >
      {s.icon}
      {labels[status]}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function RequestDrawer({
  request,
  onClose,
  onDecided,
}: {
  request: AccessRequest | null;
  onClose: () => void;
  onDecided: () => void;
}) {
  const { t } = useT();
  const tt = t.inbox.detail;
  const [note, setNote] = useState('');

  useEffect(() => {
    setNote('');
  }, [request?.id]);

  const handleDecision = (status: RequestStatus) => {
    if (!request) return;
    decide(request.id, status, request.stewardName, note.trim() || undefined);
    onDecided();
    onClose();
  };

  return (
    <AnimatePresence>
      {request && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex justify-end"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 32, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-lg h-full glass border-l border-ink-200/60 dark:border-ink-800/60 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 px-5 py-4 border-b border-ink-200/60 dark:border-ink-800/60 backdrop-blur-md bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.16em] text-ink-400">
                  {tt.title}
                </div>
                <div className="text-sm font-mono mt-0.5 truncate">{request.id}</div>
              </div>
              <button
                onClick={onClose}
                aria-label={tt.close}
                className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <DetailGroup title={tt.requester}>
                <KV k={tt.contact} v={`${request.requester.name} · ${request.requester.email}`} />
                <KV k={tt.department} v={request.requester.department} />
                <KV k={tt.manager} v={request.managerEmail} />
              </DetailGroup>

              <DetailGroup title={tt.asset}>
                <KV
                  k={request.asset.displayName}
                  v={request.asset.name}
                  vMono
                  link={`/asset/${request.asset.id}/`}
                />
                <KV k={tt.classification} v={request.asset.classification} />
                <KV k={tt.duration} v={request.duration} />
                <KV k={tt.steward} v={request.stewardName} />
                {request.ownerName && <KV k={tt.owner} v={request.ownerName} />}
              </DetailGroup>

              <DetailGroup title={tt.reason}>
                <p className="text-xs leading-relaxed">{request.reason}</p>
              </DetailGroup>

              <DetailGroup title={tt.intendedUse}>
                <p className="text-xs leading-relaxed">{request.intendedUse}</p>
              </DetailGroup>

              {request.decision ? (
                <DetailGroup title={t.inbox.status[request.status]}>
                  <KV k={tt.decidedBy} v={request.decision.by} />
                  <KV k={tt.decidedAt} v={formatDate(request.decision.at)} />
                  {request.decision.note && (
                    <p className="text-xs leading-relaxed mt-2">{request.decision.note}</p>
                  )}
                </DetailGroup>
              ) : (
                <DetailGroup title={tt.decisionNote}>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={tt.decisionNotePlaceholder}
                    className="w-full rounded-lg border border-ink-200 dark:border-ink-800 bg-ink-50/30 dark:bg-ink-900/30 px-3 py-2 text-xs h-20 resize-none outline-none focus:border-mint-400 focus:ring-1 focus:ring-mint-500/30 transition-colors"
                  />
                </DetailGroup>
              )}
            </div>

            {!request.decision && (
              <div className="sticky bottom-0 px-5 py-3 border-t border-ink-200/60 dark:border-ink-800/60 backdrop-blur-md bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] flex items-center justify-end gap-2">
                <button
                  onClick={() => handleDecision('NeedsInfo')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 text-sky-500 px-3 py-1.5 text-xs hover:bg-sky-500/10 transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  {tt.needsInfo}
                </button>
                <button
                  onClick={() => handleDecision('Rejected')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 text-rose-500 px-3 py-1.5 text-xs hover:bg-rose-500/10 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {tt.reject}
                </button>
                <button
                  onClick={() => handleDecision('Approved')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-mint-500 text-ink-950 px-4 py-1.5 text-xs font-medium hover:bg-mint-400 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {tt.approve}
                </button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-200/60 dark:border-ink-800/60 px-3 py-3 bg-ink-50/30 dark:bg-ink-900/30">
      <div className="text-[10px] uppercase tracking-[0.16em] text-ink-400 mb-2">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function KV({
  k,
  v,
  vMono,
  link,
}: {
  k: string;
  v: string;
  vMono?: boolean;
  link?: string;
}) {
  const valueEl = (
    <span className={`text-xs ${vMono ? 'font-mono' : ''} ${link ? 'text-mint-500 hover:underline' : ''}`}>
      {v}
    </span>
  );
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-ink-400 shrink-0">{k}</span>
      {link ? <Link href={link}>{valueEl}</Link> : valueEl}
    </div>
  );
}
