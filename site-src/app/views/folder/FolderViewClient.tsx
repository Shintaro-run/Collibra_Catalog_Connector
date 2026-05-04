'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Save,
  RotateCcw,
  Check,
  Database,
  KeyRound,
} from 'lucide-react';
import { useAccessRequest } from '@/components/AccessRequestModal';
import type { Classification } from '@/lib/types';
import { useT, type Lang } from '@/lib/i18n';
import {
  type ColumnDef,
  type FileNode,
  type FolderNode,
  type MetaMap,
  type MetaValue,
  type TreeNode,
  formatBytes,
  getMeta,
  saveMeta,
  seedMetaIfEmpty,
} from '@/lib/folder';

type Props = {
  root: FolderNode;
  columns: ColumnDef[];
  libraryName: string;
  libraryPath: string;
  initialMeta: Record<string, MetaMap>;
};

const VALID_CLASSIFICATIONS: readonly Classification[] = [
  'Public',
  'Internal',
  'Confidential',
  'Restricted',
];

function asClassification(v: unknown): Classification {
  return typeof v === 'string' && (VALID_CLASSIFICATIONS as readonly string[]).includes(v)
    ? (v as Classification)
    : 'Internal';
}

export function FolderViewClient({ root, columns, libraryName, libraryPath, initialMeta }: Props) {
  const { t, lang } = useT();
  const tt = t.folderView;
  const accessRequest = useAccessRequest();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [root.path]: true });
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [metaCache, setMetaCache] = useState<Record<string, MetaMap>>({});
  const [draft, setDraft] = useState<MetaMap>({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    seedMetaIfEmpty(() => initialMeta);
    setHydrated(true);
    // Auto-select first file for nice initial render
    const firstFile = findFirstFile(root);
    if (firstFile) {
      setSelectedPath(firstFile.path);
      // Expand its ancestors
      const ancestors = ancestorPaths(firstFile.path, root.path);
      setExpanded((cur) => ({ ...cur, ...Object.fromEntries(ancestors.map((p) => [p, true])) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedPath || !hydrated) return;
    const stored = getMeta(selectedPath);
    setMetaCache((c) => ({ ...c, [selectedPath]: stored }));
    setDraft(stored);
    setSaveState('idle');
  }, [selectedPath, hydrated]);

  const selected = useMemo(() => (selectedPath ? findNode(root, selectedPath) : null), [root, selectedPath]);

  const dirty = useMemo(() => {
    if (!selectedPath) return false;
    const stored = metaCache[selectedPath] ?? {};
    return !shallowEqual(stored, draft);
  }, [draft, metaCache, selectedPath]);

  const handleSave = () => {
    if (!selectedPath) return;
    setSaveState('saving');
    window.setTimeout(() => {
      saveMeta(selectedPath, draft);
      setMetaCache((c) => ({ ...c, [selectedPath]: draft }));
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1400);
    }, 350);
  };

  const handleDiscard = () => {
    if (!selectedPath) return;
    setDraft(metaCache[selectedPath] ?? {});
    setSaveState('idle');
  };

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500">{tt.kicker}</div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-mint-500/15 ring-1 ring-mint-500/40 shrink-0">
                <Database className="h-4 w-4 text-mint-500" />
              </span>
              {tt.title}
            </h1>
            <p className="text-sm text-ink-500 dark:text-ink-400 max-w-2xl leading-relaxed">
              {tt.lede}
            </p>
          </div>
          <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50/30 dark:bg-ink-900/30 px-3 py-2 text-[11px]">
            <div className="text-ink-400 uppercase tracking-[0.16em] text-[10px]">{libraryName}</div>
            <div className="font-mono text-ink-500 dark:text-ink-400 truncate max-w-[360px]">{libraryPath}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-4">
        <aside className="glass rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-ink-200/60 dark:border-ink-800/60 text-[10px] uppercase tracking-[0.16em] text-ink-400">
            {tt.treeHeader}
          </div>
          <div className="px-1 py-2 max-h-[640px] overflow-y-auto">
            <Tree
              node={root}
              depth={0}
              expanded={expanded}
              setExpanded={setExpanded}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
            />
          </div>
        </aside>

        <section className="glass rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-ink-200/60 dark:border-ink-800/60 flex items-center justify-between gap-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-ink-400">
              {tt.detailHeader}
            </div>
            {selected && (
              <DirtyBadge
                dirty={dirty}
                state={saveState}
                labels={{
                  unsaved: tt.actions.unsaved,
                  clean: tt.actions.clean,
                  saved: tt.actions.saved,
                  saving: tt.actions.saving,
                }}
              />
            )}
          </div>
          {selected ? (
            <NodeDetail
              node={selected}
              columns={columns}
              draft={draft}
              setDraft={setDraft}
              dirty={dirty}
              saveState={saveState}
              onSave={handleSave}
              onDiscard={handleDiscard}
              labels={tt}
              requestAccessLabel={t.asset.requestAccess}
              lang={lang}
              onRequestAccess={() => {
                const stewardName =
                  (typeof draft.steward === 'string' && draft.steward) ||
                  root.modifiedBy;
                accessRequest.open({
                  stewardName,
                  assetId: selected.path,
                  assetName: selected.name,
                  assetDisplayName: selected.name,
                  assetType: 'Data Set',
                  classification: asClassification(draft.sensitivity),
                  domainName: libraryName,
                });
              }}
            />
          ) : (
            <div className="px-6 py-16 text-center text-sm text-ink-400">{tt.empty}</div>
          )}
        </section>
      </div>

      <p className="text-[11px] text-ink-400 leading-relaxed">{tt.libraryNote}</p>
    </div>
  );
}

function Tree({
  node,
  depth,
  expanded,
  setExpanded,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  expanded: Record<string, boolean>;
  setExpanded: (cb: (cur: Record<string, boolean>) => Record<string, boolean>) => void;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const isFolder = node.kind === 'folder';
  const isOpen = expanded[node.path];
  const isSelected = selectedPath === node.path;

  const indent = { paddingLeft: 8 + depth * 14 };

  if (!isFolder) {
    const file = node as FileNode;
    return (
      <button
        type="button"
        onClick={() => onSelect(file.path)}
        style={indent}
        className={`group w-full flex items-center gap-1.5 pr-2 py-1.5 rounded-md text-xs text-left transition-colors ${
          isSelected
            ? 'bg-mint-500/15 text-mint-500'
            : 'hover:bg-ink-200/40 dark:hover:bg-ink-800/40'
        }`}
      >
        <FileText className="h-3.5 w-3.5 shrink-0 text-ink-400" />
        <span className="truncate flex-1">{file.name}</span>
        <span className="text-[10px] text-ink-400 font-mono shrink-0">{formatBytes(file.size)}</span>
      </button>
    );
  }

  const folder = node as FolderNode;
  return (
    <div>
      <div
        style={indent}
        className={`group flex items-center gap-1 pr-2 py-1.5 rounded-md text-xs transition-colors ${
          isSelected
            ? 'bg-mint-500/15 text-mint-500'
            : 'hover:bg-ink-200/40 dark:hover:bg-ink-800/40'
        }`}
      >
        <button
          type="button"
          onClick={() =>
            setExpanded((cur) => ({ ...cur, [folder.path]: !cur[folder.path] }))
          }
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 shrink-0"
        >
          {isOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onSelect(folder.path)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
        >
          {isOpen ? (
            <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          )}
          <span className="truncate font-medium">{folder.name}</span>
        </button>
      </div>
      {isOpen && (
        <div>
          {folder.children.map((child) => (
            <Tree
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              setExpanded={setExpanded}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DirtyBadge({
  dirty,
  state,
  labels,
}: {
  dirty: boolean;
  state: 'idle' | 'saving' | 'saved';
  labels: { unsaved: string; clean: string; saved: string; saving: string };
}) {
  if (state === 'saving') {
    return <span className="text-[10px] uppercase tracking-[0.16em] text-amber-500">{labels.saving}</span>;
  }
  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-emerald-500">
        <Check className="h-3 w-3" />
        {labels.saved}
      </span>
    );
  }
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.16em] ${
        dirty ? 'text-amber-500' : 'text-ink-400'
      }`}
    >
      {dirty ? labels.unsaved : labels.clean}
    </span>
  );
}

function NodeDetail({
  node,
  columns,
  draft,
  setDraft,
  dirty,
  saveState,
  onSave,
  onDiscard,
  onRequestAccess,
  labels,
  requestAccessLabel,
  lang,
}: {
  node: TreeNode;
  columns: ColumnDef[];
  draft: MetaMap;
  setDraft: (m: MetaMap) => void;
  dirty: boolean;
  saveState: 'idle' | 'saving' | 'saved';
  onSave: () => void;
  onDiscard: () => void;
  onRequestAccess: () => void;
  labels: ReturnType<typeof useT>['t']['folderView'];
  requestAccessLabel: string;
  lang: Lang;
}) {
  const isFolder = node.kind === 'folder';
  const fileNode = node.kind === 'file' ? (node as FileNode) : null;
  const HeaderIcon = isFolder ? Folder : FileText;
  const typeLabel = isFolder ? labels.meta.folder : extOf(node.name);

  return (
    <div className="px-5 py-4 space-y-5">
      <div>
        <div className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <HeaderIcon className={`h-4 w-4 ${isFolder ? 'text-amber-500' : 'text-ink-400'}`} />
          <span className="font-mono flex-1 min-w-0 truncate">{node.name}</span>
          <button
            type="button"
            onClick={onRequestAccess}
            className="inline-flex items-center gap-1.5 rounded-lg border border-mint-500/40 text-mint-500 px-3 py-1.5 text-[11px] font-medium hover:bg-mint-500/10 transition-colors shrink-0"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {requestAccessLabel}
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          <Meta label={labels.meta.modified} value={formatDate(node.modifiedAt, lang)} />
          <Meta label={labels.meta.modifiedBy} value={node.modifiedBy} />
          <Meta
            label={labels.meta.size}
            value={fileNode ? formatBytes(fileNode.size) : labels.none}
          />
          <Meta label={labels.meta.type} value={typeLabel} mono />
        </div>
        <div className="mt-2 text-[10px] font-mono text-ink-400 truncate">{node.path}</div>
      </div>

      <div className="border-t border-ink-200/60 dark:border-ink-800/60" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {columns.map((col) => (
          <ColumnInput
            key={col.id}
            col={col}
            value={draft[col.id] ?? null}
            onChange={(v) => setDraft({ ...draft, [col.id]: v })}
            lang={lang}
          />
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-200/60 dark:border-ink-800/60">
        <button
          type="button"
          onClick={onDiscard}
          disabled={!dirty || saveState === 'saving'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 dark:border-ink-800 px-3 py-1.5 text-xs hover:border-rose-400 hover:text-rose-400 transition-colors disabled:opacity-40 disabled:hover:border-ink-200 disabled:hover:text-current"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {labels.actions.cancel}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saveState === 'saving'}
          className="inline-flex items-center gap-1.5 rounded-lg bg-mint-500 text-ink-950 px-4 py-1.5 text-xs font-medium hover:bg-mint-400 transition-colors disabled:opacity-40"
        >
          <Save className="h-3.5 w-3.5" />
          {saveState === 'saving' ? labels.actions.saving : labels.actions.save}
        </button>
      </div>
    </div>
  );
}

function ColumnInput({
  col,
  value,
  onChange,
  lang,
}: {
  col: ColumnDef;
  value: MetaValue;
  onChange: (v: MetaValue) => void;
  lang: Lang;
}) {
  const label = lang === 'ja' && col.labelJa ? col.labelJa : col.label;
  const help = lang === 'ja' && col.helpTextJa ? col.helpTextJa : col.helpText;

  if (col.type === 'boolean') {
    return (
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 accent-mint-500"
        />
        <span>
          <span className="text-[11px] font-medium block">
            {label}
            {col.required && <span className="text-rose-400 ml-0.5">*</span>}
          </span>
          {help && <span className="text-[10px] text-ink-400 block leading-relaxed">{help}</span>}
        </span>
      </label>
    );
  }

  return (
    <label className="block">
      <div className="text-[11px] font-medium mb-1">
        {label}
        {col.required && <span className="text-rose-400 ml-0.5">*</span>}
      </div>
      {col.type === 'choice' ? (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value || null)}
          className={inputClass}
        >
          <option value="">—</option>
          {col.choices?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      ) : col.type === 'date' ? (
        <input
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value || null)}
          className={inputClass}
        />
      ) : col.type === 'multiline' ? (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} h-20 resize-none`}
        />
      ) : (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
      {help && <div className="text-[10px] text-ink-400 mt-1 leading-relaxed">{help}</div>}
    </label>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.16em] text-ink-400">{label}</div>
      <div className={`mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

function findNode(root: TreeNode, path: string): TreeNode | null {
  if (root.path === path) return root;
  if (root.kind === 'folder') {
    for (const c of root.children) {
      const hit = findNode(c, path);
      if (hit) return hit;
    }
  }
  return null;
}

function findFirstFile(node: TreeNode): FileNode | null {
  if (node.kind === 'file') return node;
  for (const c of node.children) {
    const hit = findFirstFile(c);
    if (hit) return hit;
  }
  return null;
}

function ancestorPaths(target: string, rootPath: string): string[] {
  const out: string[] = [rootPath];
  const parts = target.split('/');
  for (let i = parts.length - 1; i > 1; i--) {
    out.push(parts.slice(0, i).join('/'));
  }
  return out;
}

function shallowEqual(a: MetaMap, b: MetaMap): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const av = a[k] ?? null;
    const bv = b[k] ?? null;
    if (av !== bv) return false;
  }
  return true;
}

function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : 'FILE';
}

function formatDate(iso: string, lang: Lang): string {
  try {
    return new Date(iso).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US', {
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

const inputClass =
  'w-full rounded-lg border border-ink-200 dark:border-ink-800 bg-ink-50/30 dark:bg-ink-900/30 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-1 focus:ring-mint-500/30 transition-colors';
