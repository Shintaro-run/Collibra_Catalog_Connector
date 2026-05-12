import type { ColumnDef, MetaMap, MetaValue, TreeNode } from './folder';

export type ItemChange = {
  path: string;
  fileName: string;
  libraryName: string;
  changes: { columnId: string; before: MetaValue | undefined; after: MetaValue | undefined }[];
};

export type Diff = {
  addedColumns: ColumnDef[];
  removedColumns: string[];
  changedItems: ItemChange[];
  hasChanges: boolean;
};

export type BaselineSnapshot = {
  tree: TreeNode[];
  columns: ColumnDef[];
  meta: Record<string, MetaMap>;
  spLookup?: Record<string, { listId: string; itemId: string }>;
  libraries?: { listId: string; displayName: string; rootPath: string }[];
};

export type CurrentSnapshot = {
  tree: TreeNode | null;
  columns: ColumnDef[];
  meta: Record<string, MetaMap>;
};

export function computeDiff(current: CurrentSnapshot, baseline: BaselineSnapshot): Diff {
  const baselineColIds = new Set(baseline.columns.map((c) => c.id));
  const currentColIds = new Set(current.columns.map((c) => c.id));
  const addedColumns = current.columns.filter((c) => !baselineColIds.has(c.id));
  const removedColumns = baseline.columns
    .filter((c) => !currentColIds.has(c.id))
    .map((c) => c.id);

  const allPaths = new Set<string>([
    ...Object.keys(current.meta),
    ...Object.keys(baseline.meta),
  ]);

  const pathInfo = buildPathInfo(baseline.tree);
  const changedItems: ItemChange[] = [];

  for (const path of allPaths) {
    const before = baseline.meta[path] ?? {};
    const after = current.meta[path] ?? {};
    const colIds = new Set<string>([...Object.keys(before), ...Object.keys(after)]);
    const changes: ItemChange['changes'] = [];
    for (const colId of colIds) {
      const b = before[colId];
      const a = after[colId];
      if (isBlank(b) && isBlank(a)) continue;
      if (b !== a) changes.push({ columnId: colId, before: b, after: a });
    }
    if (changes.length > 0) {
      const info = pathInfo.get(path);
      changedItems.push({
        path,
        fileName: info?.fileName ?? path.split('/').pop() ?? path,
        libraryName: info?.libraryName ?? '',
        changes,
      });
    }
  }

  return {
    addedColumns,
    removedColumns,
    changedItems,
    hasChanges:
      addedColumns.length > 0 || removedColumns.length > 0 || changedItems.length > 0,
  };
}

function isBlank(v: MetaValue | undefined): boolean {
  return v === undefined || v === null || v === '';
}

function buildPathInfo(
  trees: TreeNode[],
): Map<string, { fileName: string; libraryName: string }> {
  const map = new Map<string, { fileName: string; libraryName: string }>();
  for (const root of trees) {
    if (root.kind === 'folder') {
      for (const child of root.children) {
        const libName = child.kind === 'folder' ? child.name : root.name;
        walkPathInfo(child, libName, map);
      }
      map.set(root.path, { fileName: root.name, libraryName: root.name });
    } else {
      walkPathInfo(root, root.name, map);
    }
  }
  return map;
}

function walkPathInfo(
  node: TreeNode,
  libraryName: string,
  map: Map<string, { fileName: string; libraryName: string }>,
) {
  map.set(node.path, { fileName: node.name, libraryName });
  if (node.kind === 'folder') {
    for (const c of node.children) walkPathInfo(c, libraryName, map);
  }
}

export function renderWriteBackCsv(diff: Diff): string {
  if (diff.changedItems.length === 0) return '';

  const involved = new Set<string>();
  for (const item of diff.changedItems) {
    for (const ch of item.changes) involved.add(ch.columnId);
  }
  const columnIds = Array.from(involved);
  const headers = ['Path', 'Name', ...columnIds];
  const lines: string[] = [escapeCsvRow(headers)];

  for (const item of diff.changedItems) {
    const row = [
      item.path,
      item.fileName,
      ...columnIds.map((colId) => {
        const change = item.changes.find((c) => c.columnId === colId);
        return change ? csvFormat(change.after) : '';
      }),
    ];
    lines.push(escapeCsvRow(row));
  }

  return lines.join('\n');
}

function escapeCsvRow(cells: string[]): string {
  return cells.map(escapeCsvCell).join(',');
}

function escapeCsvCell(s: string): string {
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function csvFormat(v: MetaValue | undefined): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

export function renderInstructionsMd(diff: Diff): string {
  const lines: string[] = [];
  lines.push('# SharePoint write-back instructions');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('Follow these steps to push your Data Magazine changes back to SharePoint.');
  lines.push('');

  let stepIdx = 1;

  if (diff.addedColumns.length > 0) {
    lines.push(`## Step ${stepIdx++}. Add new columns to the SharePoint library`);
    lines.push('');
    lines.push(
      'In SharePoint, open the document library → **Library settings** → **Create column** (or click **+ Add column** in the library header). Create the following:',
    );
    lines.push('');
    lines.push('| Column name | Type | Notes |');
    lines.push('| --- | --- | --- |');
    for (const col of diff.addedColumns) {
      const notes: string[] = [];
      if (col.required) notes.push('Required');
      if (col.choices && col.choices.length > 0)
        notes.push(`Choices: ${col.choices.join(' | ')}`);
      if (col.labelJa) notes.push(`Japanese label: ${col.labelJa}`);
      lines.push(`| ${col.label} | ${mapTypeToSharePoint(col.type)} | ${notes.join('; ') || '—'} |`);
    }
    lines.push('');
  }

  if (diff.changedItems.length > 0) {
    lines.push(`## Step ${stepIdx++}. Switch the library to grid view (Quick Edit)`);
    lines.push('');
    lines.push(
      'On the library command bar, click **Edit in grid view**. The library becomes a spreadsheet-style editable grid.',
    );
    lines.push('');

    lines.push(`## Step ${stepIdx++}. Paste values from the generated CSV`);
    lines.push('');
    lines.push(
      'Open **`data-magazine-writeback.csv`** in Excel or a similar editor. The first two columns (`Path`, `Name`) identify each file; the remaining columns are the values to set.',
    );
    lines.push('');
    lines.push('For each row in the CSV:');
    lines.push('');
    lines.push('1. Locate the matching file in SharePoint by **Path** + **Name**.');
    lines.push('2. Select the cells in SharePoint that correspond to columns 3..N of the CSV row.');
    lines.push('3. Copy the matching values from the CSV and paste them into SharePoint.');
    lines.push('');
    lines.push(
      'Tip: when the CSV columns line up with the SharePoint grid columns, you can select an entire range in Excel and paste it in one operation per file.',
    );
    lines.push('');

    lines.push(`## Step ${stepIdx++}. Exit grid view to commit`);
    lines.push('');
    lines.push(
      'Click **Exit grid view** in the SharePoint command bar. SharePoint persists all pasted changes.',
    );
    lines.push('');
  }

  if (diff.removedColumns.length > 0) {
    lines.push(`## Step ${stepIdx++}. (Optional) Removed columns`);
    lines.push('');
    lines.push(
      'The following columns existed in the original SharePoint export but are no longer present in Data Magazine:',
    );
    lines.push('');
    for (const id of diff.removedColumns) lines.push(`- ${id}`);
    lines.push('');
    lines.push(
      'Data Magazine does **not** auto-delete columns. If you want them gone, delete them manually from **Library settings → Columns**.',
    );
    lines.push('');
  }

  lines.push('## Summary');
  lines.push('');
  lines.push(`- New columns to add: **${diff.addedColumns.length}**`);
  lines.push(`- Files with value changes: **${diff.changedItems.length}**`);
  lines.push(`- Removed columns: **${diff.removedColumns.length}**`);
  lines.push('');

  return lines.join('\n');
}

function mapTypeToSharePoint(t: ColumnDef['type']): string {
  switch (t) {
    case 'text':
      return 'Single line of text';
    case 'multiline':
      return 'Multiple lines of text';
    case 'choice':
      return 'Choice';
    case 'date':
      return 'Date and Time';
    case 'boolean':
      return 'Yes/No';
    default:
      return 'Single line of text';
  }
}
