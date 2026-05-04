import { getAllAssets } from '@/lib/catalog';
import type { AccessRequest } from '@/lib/requests';

const SAMPLE_REQUESTERS = [
  { name: 'Aiko Tanaka', email: 'aiko.tanaka@example.com', department: 'Clinical Pharmacology' },
  { name: 'Marcus Lee', email: 'marcus.lee@example.com', department: 'Translational Sciences' },
  { name: 'Priya Shah', email: 'priya.shah@example.com', department: 'Biostatistics' },
  { name: 'Hiroshi Sato', email: 'hiroshi.sato@example.com', department: 'Pharmacovigilance' },
  { name: 'Elena Rossi', email: 'elena.rossi@example.com', department: 'Regulatory Affairs' },
  { name: 'Daniel Park', email: 'daniel.park@example.com', department: 'Real-World Evidence' },
];

const SAMPLE_REASONS = [
  {
    reason: 'PopPK / PopPD analysis to characterise exposure–response in the target population.',
    use: 'Internal modelling and supporting evidence for the regulatory submission (PMDA Module 5).',
  },
  {
    reason: 'Safety signal triage following a new ICSR cluster from the Q1 batch.',
    use: 'Aggregate review for the upcoming PSUR; no patient-level disclosure.',
  },
  {
    reason: 'Subgroup efficacy analysis stratified by biomarker status.',
    use: 'Internal R&D readout for the Phase 2b interim analysis.',
  },
  {
    reason: 'Real-world cohort comparator for the HTA submission.',
    use: 'Indirect treatment comparison; output limited to summary statistics.',
  },
  {
    reason: 'Quality investigation into source-system freshness lag.',
    use: 'Operational fix; no analytical use.',
  },
];

const STATUS_MIX: AccessRequest['status'][] = [
  'Pending',
  'Pending',
  'Pending',
  'NeedsInfo',
  'Approved',
  'Rejected',
];

const DURATIONS: AccessRequest['duration'][] = ['30d', '90d', '180d', '365d', 'ongoing'];

export async function buildSeedRequests(): Promise<AccessRequest[]> {
  const all = await getAllAssets();
  if (all.length === 0) return [];

  const picks = pickSpread(all, 14);
  const now = Date.now();

  return picks.map((entry, idx) => {
    const requester = SAMPLE_REQUESTERS[idx % SAMPLE_REQUESTERS.length];
    const reason = SAMPLE_REASONS[idx % SAMPLE_REASONS.length];
    const status = STATUS_MIX[idx % STATUS_MIX.length];
    const duration = DURATIONS[idx % DURATIONS.length];
    const createdAt = new Date(now - (idx + 1) * 1000 * 60 * 60 * 9).toISOString();
    const decision =
      status === 'Approved' || status === 'Rejected'
        ? {
            by: entry.asset.steward,
            at: new Date(now - idx * 1000 * 60 * 60 * 6).toISOString(),
            note:
              status === 'Approved'
                ? 'Approved with standard 90-day review cadence.'
                : 'Insufficient justification — please re-submit with sponsor sign-off.',
          }
        : undefined;

    return {
      id: `AR-${formatStamp(createdAt)}-${1000 + idx}`,
      createdAt,
      asset: {
        id: entry.asset.id,
        name: entry.asset.name,
        displayName: entry.asset.displayName,
        type: entry.asset.type,
        classification: entry.asset.classification,
        domainName: entry.domain.name,
      },
      requester,
      reason: reason.reason,
      intendedUse: reason.use,
      duration,
      managerEmail: `${requester.email.split('@')[0]}.lead@example.com`,
      stewardName: entry.asset.steward,
      ownerName: entry.asset.owner,
      status,
      decision,
    };
  });
}

function pickSpread<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const step = items.length / n;
  return Array.from({ length: n }, (_, i) => items[Math.floor(i * step)]);
}

function formatStamp(iso: string): string {
  return iso.slice(2, 10).replace(/-/g, '');
}
