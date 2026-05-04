// Mock folder/file tree + per-file metadata store for the Folder view PoC.
// The shape mirrors what SharePoint exposes via REST (`/_api/web/GetFolderByServerRelativeUrl`,
// `/_api/web/lists/getbytitle('Lib')/fields`, `/_api/web/lists/getbytitle('Lib')/items`),
// so the swap to a real library is one file. localStorage acts as the
// metadata-write target until the SharePoint backend is wired in.

export type ColumnType = 'text' | 'multiline' | 'choice' | 'date' | 'boolean';

export type ColumnDef = {
  id: string;
  label: string;
  labelJa?: string;
  type: ColumnType;
  required?: boolean;
  choices?: string[];
  helpText?: string;
  helpTextJa?: string;
};

export type MetaValue = string | boolean | null;
export type MetaMap = Record<string, MetaValue>;

export type FileNode = {
  kind: 'file';
  id: string;
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
  modifiedBy: string;
  meta?: MetaMap;
};

export type FolderNode = {
  kind: 'folder';
  id: string;
  name: string;
  path: string;
  modifiedAt: string;
  modifiedBy: string;
  children: TreeNode[];
};

export type TreeNode = FolderNode | FileNode;

const META_STORAGE_KEY = 'ccc-folder-meta-v1';
const META_SEEDED_KEY = 'ccc-folder-meta-v1-seeded';

function safeWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

export function loadAllMeta(): Record<string, MetaMap> {
  const w = safeWindow();
  if (!w) return {};
  try {
    const raw = w.localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, MetaMap>) : {};
  } catch {
    return {};
  }
}

function saveAllMeta(map: Record<string, MetaMap>) {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.setItem(META_STORAGE_KEY, JSON.stringify(map));
  w.dispatchEvent(new Event('ccc-folder-meta-updated'));
}

export function getMeta(path: string): MetaMap {
  return loadAllMeta()[path] ?? {};
}

export function saveMeta(path: string, meta: MetaMap) {
  const map = loadAllMeta();
  map[path] = meta;
  saveAllMeta(map);
}

export function seedMetaIfEmpty(seed: () => Record<string, MetaMap>) {
  const w = safeWindow();
  if (!w) return;
  if (w.localStorage.getItem(META_SEEDED_KEY)) return;
  if (Object.keys(loadAllMeta()).length === 0) {
    saveAllMeta(seed());
  }
  w.localStorage.setItem(META_SEEDED_KEY, '1');
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}
