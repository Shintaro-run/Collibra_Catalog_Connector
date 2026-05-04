// Mock request store for the inbox PoC. The shape mirrors what a SharePoint
// List would expose, so swapping `loadAll`/`save` for SharePoint REST calls
// (`/_api/web/lists/getbytitle('AccessRequests')/items`) is a one-file change.
// All read/write helpers guard `window` so the module is safe to import from
// server components (for shared types) — only the browser actually persists.

import type { Asset, Classification } from './types';

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'NeedsInfo';
export type DurationCode = '30d' | '90d' | '180d' | '365d' | 'ongoing';

// All access requests are routed to the data steward (single point of contact).
// `ownerName` is captured for visibility — the steward can consult the owner
// before approving — but the steward owns the decision.
export type AccessRequest = {
  id: string;
  createdAt: string;
  asset: {
    id: string;
    name: string;
    displayName: string;
    type: Asset['type'];
    classification: Classification;
    domainName: string;
  };
  requester: {
    name: string;
    email: string;
    department: string;
  };
  reason: string;
  intendedUse: string;
  duration: DurationCode;
  managerEmail: string;
  stewardName: string;
  ownerName?: string;
  status: RequestStatus;
  decision?: {
    by: string;
    at: string;
    note?: string;
  };
};

const STORAGE_KEY = 'ccc-access-requests-v2';
const SEEDED_KEY = 'ccc-access-requests-v2-seeded';

export function nextTrackingId(): string {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `AR-${stamp}-${rand}`;
}

export function loadAll(): AccessRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AccessRequest[]) : [];
  } catch {
    return [];
  }
}

function saveAll(items: AccessRequest[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('ccc-requests-updated'));
}

export function list(): AccessRequest[] {
  return loadAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// Result shape that the SharePoint swap will return: a 403 from the
// AccessRequests List call surfaces here as `{ ok: false, reason: 'forbidden' }`,
// letting the UI render a "no permission" message instead of an empty table.
export type InboxResult =
  | { ok: true; items: AccessRequest[] }
  | { ok: false; reason: 'forbidden' | 'error'; message?: string };

export function loadInbox(): InboxResult {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('forbidden') === '1') {
      return { ok: false, reason: 'forbidden' };
    }
  }
  return { ok: true, items: list() };
}

export function get(id: string): AccessRequest | undefined {
  return loadAll().find((r) => r.id === id);
}

export function create(req: AccessRequest) {
  const all = loadAll();
  saveAll([req, ...all]);
}

export function update(id: string, patch: Partial<AccessRequest>) {
  const all = loadAll().map((r) => (r.id === id ? { ...r, ...patch } : r));
  saveAll(all);
}

export function decide(
  id: string,
  status: RequestStatus,
  by: string,
  note?: string,
) {
  update(id, {
    status,
    decision: { by, at: new Date().toISOString(), note },
  });
}

export function seedIfEmpty(seed: () => AccessRequest[]) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(SEEDED_KEY)) return;
  const existing = loadAll();
  if (existing.length === 0) {
    saveAll(seed());
  }
  window.localStorage.setItem(SEEDED_KEY, '1');
}

export function counts(items: AccessRequest[]) {
  return {
    total: items.length,
    pending: items.filter((r) => r.status === 'Pending').length,
    approved: items.filter((r) => r.status === 'Approved').length,
    rejected: items.filter((r) => r.status === 'Rejected').length,
    needsInfo: items.filter((r) => r.status === 'NeedsInfo').length,
  };
}
