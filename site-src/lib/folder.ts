// Folder/file tree + per-file metadata store for the Folder view.
// Shape mirrors SharePoint document libraries (`/_api/web/GetFolderByServerRelativeUrl`,
// `/_api/web/lists/getbytitle('Lib')/fields`, `/_api/web/lists/getbytitle('Lib')/items`),
// so an import from a real library can populate localStorage without transformation.

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

export type SourceKind = 'collibra' | 'graph-ps' | 'manual-csv';

export type SourceConfig =
  | { kind: 'collibra' }
  | { kind: 'graph-ps'; sharepointSiteUrl: string; tenantId: string; clientId: string }
  | { kind: 'manual-csv' };

export type ImportMeta = {
  source: SourceKind;
  importedAt: string;
  libraryCount: number;
  folderCount: number;
  fileCount: number;
};

export type ImportHistory = {
  current?: ImportMeta;
  baseline?: {
    tree: TreeNode[];
    columns: ColumnDef[];
    meta: Record<string, MetaMap>;
  };
};

const TREE_KEY = 'dm-folder-tree-v1';
const COLUMNS_KEY = 'dm-folder-columns-v1';
const META_KEY = 'dm-folder-meta-v1';
const META_SEEDED_KEY = 'dm-folder-meta-v1-seeded';
const SOURCE_KEY = 'dm-folder-source-v1';
const HISTORY_KEY = 'dm-folder-import-history-v1';

export const FOLDER_UPDATE_EVENT = 'dm-folder-meta-updated';

function safeWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

function readJSON<T>(key: string): T | null {
  const w = safeWindow();
  if (!w) return null;
  try {
    const raw = w.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.setItem(key, JSON.stringify(value));
  w.dispatchEvent(new Event(FOLDER_UPDATE_EVENT));
}

export function loadAllMeta(): Record<string, MetaMap> {
  const parsed = readJSON<Record<string, MetaMap>>(META_KEY);
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function saveAllMeta(map: Record<string, MetaMap>) {
  writeJSON(META_KEY, map);
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

export function loadTree(): TreeNode | null {
  return readJSON<TreeNode>(TREE_KEY);
}

export function saveTree(tree: TreeNode) {
  writeJSON(TREE_KEY, tree);
}

export function loadColumns(): ColumnDef[] | null {
  const parsed = readJSON<ColumnDef[]>(COLUMNS_KEY);
  return Array.isArray(parsed) ? parsed : null;
}

export function saveColumns(columns: ColumnDef[]) {
  writeJSON(COLUMNS_KEY, columns);
}

export function loadSource(): SourceConfig {
  const parsed = readJSON<SourceConfig>(SOURCE_KEY);
  if (parsed && typeof parsed === 'object' && 'kind' in parsed) return parsed;
  return { kind: 'collibra' };
}

export function saveSource(source: SourceConfig) {
  writeJSON(SOURCE_KEY, source);
}

export function loadHistory(): ImportHistory {
  const parsed = readJSON<ImportHistory>(HISTORY_KEY);
  return parsed && typeof parsed === 'object' ? parsed : {};
}

export function saveHistory(history: ImportHistory) {
  writeJSON(HISTORY_KEY, history);
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
