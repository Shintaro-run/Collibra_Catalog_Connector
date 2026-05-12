import Papa from 'papaparse';
import type { ColumnDef, FileNode, FolderNode, MetaMap } from './folder';

export type RawRow = Record<string, string>;

export type ParsedLibrary = {
  fileName: string;
  libraryName: string;
  rows: RawRow[];
  headers: string[];
  pathColumn: string | null;
  nameColumn: string | null;
  typeColumn: string | null;
  sizeColumn: string | null;
  modifiedColumn: string | null;
  modifiedByColumn: string | null;
  customColumns: string[];
  commonPathPrefix: string;
  warnings: string[];
};

export type LibraryTree = {
  root: FolderNode;
  columns: ColumnDef[];
  meta: Record<string, MetaMap>;
  fileCount: number;
  folderCount: number;
};

export type CombinedImport = {
  tree: FolderNode;
  columns: ColumnDef[];
  meta: Record<string, MetaMap>;
  libraryCount: number;
  folderCount: number;
  fileCount: number;
};

const PATH_HEADERS = [
  'path',
  'file path',
  'folder path',
  'url path',
  'fullpath',
  'full path',
  'パス',
  'ファイル パス',
  'フォルダー パス',
  'フォルダーパス',
];

const NAME_HEADERS = ['name', 'title', 'file name', '名前', 'ファイル名', 'タイトル'];

const TYPE_HEADERS = [
  'item type',
  'type',
  'file type',
  '種類',
  '項目の種類',
  'アイテムの種類',
];

const SIZE_HEADERS = ['file size', 'size', 'サイズ', 'ファイル サイズ'];

const MODIFIED_HEADERS = [
  'modified',
  'last modified',
  'date modified',
  '更新日時',
  '変更日時',
  '最終更新',
];

const MODIFIED_BY_HEADERS = [
  'modified by',
  'last modified by',
  '更新者',
  '変更者',
];

const SYSTEM_HEADERS = new Set(
  [
    'id',
    '#',
    'created',
    'created by',
    '作成日時',
    '作成者',
    'edit',
    'compliance asset id',
    'content type',
    '_uipversion_string',
    '_moderationstatus',
    'check in comment',
    'app created by',
    'app modified by',
  ].map((s) => s.toLowerCase()),
);

function findHeader(headers: string[], candidates: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const c of candidates) {
    const idx = lower.indexOf(c.toLowerCase());
    if (idx >= 0) return headers[idx];
  }
  return null;
}

export async function parseFile(file: File): Promise<RawRow[]> {
  if (/\.xlsx?$/i.test(file.name)) {
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return [];
    const sheet = wb.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '', raw: false });
  }
  return parseCsv(file);
}

function parseCsv(file: File): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (result) => {
        if (result.data.length === 0 && result.errors.length > 0) {
          reject(new Error(result.errors[0].message));
          return;
        }
        resolve(result.data);
      },
      error: (err) => reject(err),
    });
  });
}

export function analyzeLibrary(file: File, rows: RawRow[]): ParsedLibrary {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const pathColumn = findHeader(headers, PATH_HEADERS);
  const nameColumn = findHeader(headers, NAME_HEADERS);
  const typeColumn = findHeader(headers, TYPE_HEADERS);
  const sizeColumn = findHeader(headers, SIZE_HEADERS);
  const modifiedColumn = findHeader(headers, MODIFIED_HEADERS);
  const modifiedByColumn = findHeader(headers, MODIFIED_BY_HEADERS);

  const reserved = new Set<string>(
    [pathColumn, nameColumn, typeColumn, sizeColumn, modifiedColumn, modifiedByColumn]
      .filter((h): h is string => h !== null)
      .concat(headers.filter((h) => SYSTEM_HEADERS.has(h.toLowerCase().trim()))),
  );
  const customColumns = headers.filter((h) => !reserved.has(h) && h.trim() !== '');

  const libraryName = file.name
    .replace(/\.(csv|xlsx?)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();

  const warnings: string[] = [];
  if (!nameColumn) warnings.push('No "Name" or "Title" column detected — rows cannot be placed in the tree.');
  if (!pathColumn) warnings.push('No "Path" column detected — all items will appear flat under the library root.');

  let commonPathPrefix = '';
  if (pathColumn && nameColumn) {
    const folderPaths: string[] = [];
    for (const row of rows) {
      const n = (row[nameColumn] || '').trim();
      const p = (row[pathColumn] || '').trim();
      if (!n || !p) continue;
      const folder = stripTrailingName(p, n);
      if (folder) folderPaths.push(folder);
    }
    const candidate = findCommonPathPrefix(folderPaths);
    if (candidate && splitPath(candidate).length >= 2) {
      commonPathPrefix = candidate;
      warnings.push(`Common path prefix "${candidate}" was detected and will be stripped from every row.`);
    }
  }

  return {
    fileName: file.name,
    libraryName: libraryName || file.name,
    rows,
    headers,
    pathColumn,
    nameColumn,
    typeColumn,
    sizeColumn,
    modifiedColumn,
    modifiedByColumn,
    customColumns,
    commonPathPrefix,
    warnings,
  };
}

export function buildLibraryTree(lib: ParsedLibrary): LibraryTree {
  const {
    libraryName,
    rows,
    pathColumn,
    nameColumn,
    typeColumn,
    sizeColumn,
    modifiedColumn,
    modifiedByColumn,
    customColumns,
    commonPathPrefix,
  } = lib;

  const rootPath = '/' + safeSlug(libraryName);
  const root: FolderNode = {
    kind: 'folder',
    id: 'lib:' + libraryName,
    name: libraryName,
    path: rootPath,
    modifiedAt: new Date().toISOString(),
    modifiedBy: '',
    children: [],
  };

  const folderMap = new Map<string, FolderNode>();
  folderMap.set(root.path, root);

  const meta: Record<string, MetaMap> = {};
  let fileCount = 0;
  let folderCount = 0;

  for (const row of rows) {
    const name = nameColumn ? (row[nameColumn] || '').trim() : '';
    if (!name) continue;

    let folderPath = pathColumn ? (row[pathColumn] || '').trim() : '';
    folderPath = stripTrailingName(folderPath, name);
    folderPath = stripCommonPrefix(folderPath, commonPathPrefix);
    const segments = splitPath(folderPath);

    const isFolder = typeColumn
      ? /folder|フォルダ|ディレクト/i.test(row[typeColumn] || '')
      : false;

    let parent = root;
    let cumPath = root.path;
    for (const seg of segments) {
      cumPath = cumPath + '/' + seg;
      let folder = folderMap.get(cumPath);
      if (!folder) {
        folder = {
          kind: 'folder',
          id: 'f:' + cumPath,
          name: seg,
          path: cumPath,
          modifiedAt: '',
          modifiedBy: '',
          children: [],
        };
        folderMap.set(cumPath, folder);
        parent.children.push(folder);
        folderCount++;
      }
      parent = folder;
    }

    const itemPath = parent.path + '/' + name;
    const modifiedAt = modifiedColumn ? toIso(row[modifiedColumn]) : '';
    const modifiedBy = modifiedByColumn ? row[modifiedByColumn] || '' : '';

    if (isFolder) {
      let folder = folderMap.get(itemPath);
      if (!folder) {
        folder = {
          kind: 'folder',
          id: 'f:' + itemPath,
          name,
          path: itemPath,
          modifiedAt,
          modifiedBy,
          children: [],
        };
        folderMap.set(itemPath, folder);
        parent.children.push(folder);
        folderCount++;
      } else {
        folder.modifiedAt = modifiedAt || folder.modifiedAt;
        folder.modifiedBy = modifiedBy || folder.modifiedBy;
      }
    } else {
      const size = sizeColumn ? parseSize(row[sizeColumn]) : 0;
      const fileNode: FileNode = {
        kind: 'file',
        id: 'i:' + itemPath,
        name,
        path: itemPath,
        size,
        modifiedAt,
        modifiedBy,
      };
      parent.children.push(fileNode);
      fileCount++;

      const metaMap: MetaMap = {};
      for (const col of customColumns) {
        const v = row[col];
        if (v !== undefined && v !== '') metaMap[col] = v;
      }
      if (Object.keys(metaMap).length > 0) meta[itemPath] = metaMap;
    }
  }

  const columns: ColumnDef[] = customColumns.map((id) => ({
    id,
    label: id,
    type: 'text',
  }));

  return { root, columns, meta, fileCount, folderCount };
}

export function combineLibraries(libs: LibraryTree[]): CombinedImport {
  if (libs.length === 0) {
    throw new Error('No libraries to combine.');
  }
  if (libs.length === 1) {
    const lib = libs[0];
    return {
      tree: lib.root,
      columns: lib.columns,
      meta: lib.meta,
      libraryCount: 1,
      folderCount: lib.folderCount,
      fileCount: lib.fileCount,
    };
  }

  const root: FolderNode = {
    kind: 'folder',
    id: 'root:imports',
    name: 'SharePoint imports',
    path: '/imports',
    modifiedAt: new Date().toISOString(),
    modifiedBy: '',
    children: libs.map((l) => l.root),
  };

  const columnMap = new Map<string, ColumnDef>();
  for (const lib of libs) {
    for (const c of lib.columns) {
      if (!columnMap.has(c.id)) columnMap.set(c.id, c);
    }
  }

  const meta: Record<string, MetaMap> = {};
  for (const lib of libs) Object.assign(meta, lib.meta);

  return {
    tree: root,
    columns: Array.from(columnMap.values()),
    meta,
    libraryCount: libs.length,
    folderCount: libs.reduce((s, l) => s + l.folderCount, 0),
    fileCount: libs.reduce((s, l) => s + l.fileCount, 0),
  };
}

function safeSlug(name: string): string {
  return name.replace(/[\/\\?#%]+/g, '-').trim() || 'library';
}

function splitPath(p: string): string[] {
  return p.split(/[\\\/]+/).filter(Boolean);
}

function stripTrailingName(folderPath: string, name: string): string {
  if (!folderPath || !name) return folderPath;
  const segs = splitPath(folderPath);
  if (segs.length > 0 && segs[segs.length - 1] === name) {
    segs.pop();
    return segs.join('/');
  }
  return folderPath;
}

function findCommonPathPrefix(paths: string[]): string {
  if (paths.length === 0) return '';
  const split = paths.map(splitPath);
  const min = Math.min(...split.map((s) => s.length));
  const result: string[] = [];
  for (let i = 0; i < min; i++) {
    const seg = split[0][i];
    if (split.every((s) => s[i] === seg)) result.push(seg);
    else break;
  }
  return result.join('/');
}

function stripCommonPrefix(folderPath: string, prefix: string): string {
  if (!prefix || !folderPath) return folderPath;
  const segs = splitPath(folderPath);
  const prefixSegs = splitPath(prefix);
  if (segs.length < prefixSegs.length) return folderPath;
  for (let i = 0; i < prefixSegs.length; i++) {
    if (segs[i] !== prefixSegs[i]) return folderPath;
  }
  return segs.slice(prefixSegs.length).join('/');
}

function toIso(v: string | undefined): string {
  if (!v) return '';
  const t = Date.parse(v);
  return isNaN(t) ? v : new Date(t).toISOString();
}

function parseSize(v: string | undefined): number {
  if (!v) return 0;
  const trimmed = v.trim();
  const m = /^([\d,.]+)\s*([KMGT]?B)?$/i.exec(trimmed);
  if (!m) return Number(trimmed.replace(/[^\d.]/g, '')) || 0;
  const num = parseFloat(m[1].replace(/,/g, ''));
  const unit = (m[2] || 'B').toUpperCase();
  const mult: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
  };
  return Math.round(num * (mult[unit] || 1));
}
