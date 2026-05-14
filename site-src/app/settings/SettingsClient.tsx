'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Save,
  TestTube,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Upload,
  FileSpreadsheet,
  X,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  RotateCcw,
  Copy,
} from 'lucide-react';
import {
  FOLDER_UPDATE_EVENT,
  loadAllMeta,
  loadColumns,
  loadHistory,
  loadSource,
  loadTree,
  saveAllMeta,
  saveColumns,
  saveHistory,
  saveSource,
  saveTree,
  type ColumnDef,
  type MetaMap,
  type SourceConfig,
  type SourceKind,
  type TreeNode,
} from '@/lib/folder';
import {
  analyzeLibrary,
  buildLibraryTree,
  combineLibraries,
  parseFile,
  type ParsedLibrary,
} from '@/lib/sharepointImport';
import {
  computeDiff,
  renderInstructionsMd,
  renderWriteBackCsv,
  type BaselineSnapshot,
} from '@/lib/sharepointDiff';
import { generatePowerShellScript, parseGraphImportJson } from '@/lib/graphImportScript';
import { prepareWriteBack } from '@/lib/graphWriteBackScript';

type SettingsState = {
  collibra: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    timeoutSeconds: number;
  };
  entra: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    sharepointSiteUrl: string;
    documentLibrary: string;
  };
  schedule: {
    mode: 'daily' | 'hourly' | 'cron' | 'manual';
    timeOfDay: string;
    cron: string;
    timezone: string;
  };
};

const DEFAULT_STATE: SettingsState = {
  collibra: {
    baseUrl: 'https://yourcompany.collibra.com',
    clientId: '',
    clientSecret: '',
    timeoutSeconds: 30,
  },
  entra: {
    tenantId: '',
    clientId: '',
    clientSecret: '',
    sharepointSiteUrl: '',
    documentLibrary: 'Data Magazine',
  },
  schedule: {
    mode: 'daily',
    timeOfDay: '03:00',
    cron: '0 3 * * *',
    timezone: 'Asia/Tokyo',
  },
};

const STORAGE_KEY = 'dm-settings';
const SOURCE_OPTIONS: { kind: SourceKind; label: string; desc: string }[] = [
  {
    kind: 'collibra',
    label: 'Collibra-mapped',
    desc: 'Default. Folder view reflects Collibra metadata mapped to a folder structure.',
  },
  {
    kind: 'graph-ps',
    label: 'SharePoint via Microsoft Graph (PowerShell)',
    desc: 'Bidirectional read/write. Generates a self-contained PowerShell script using device code flow. Requires Entra ID app registration.',
  },
  {
    kind: 'manual-csv',
    label: 'SharePoint via manual Excel/CSV export',
    desc: 'No admin approval needed. Use SharePoint’s built-in "Export to Excel/CSV" and import the file. Write-back generates a CSV plus Quick Edit instructions.',
  },
];
const TIMEZONES = [
  'Asia/Tokyo',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Berlin',
  'UTC',
];

export function SettingsClient() {
  const [state, setState] = useState<SettingsState>(DEFAULT_STATE);
  const [saved, setSaved] = useState(false);
  const [showSecrets, setShowSecrets] = useState({ collibra: false, entra: false });
  const [testing, setTesting] = useState<{ [k: string]: 'idle' | 'pending' | 'ok' | 'fail' }>({
    collibra: 'idle',
    entra: 'idle',
  });

  const [sourceKind, setSourceKind] = useState<SourceKind>('collibra');
  const [graphSiteUrl, setGraphSiteUrl] = useState('');
  const [graphTenantId, setGraphTenantId] = useState('');
  const [graphClientId, setGraphClientId] = useState('');
  const [sourceHydrated, setSourceHydrated] = useState(false);

  const [pickedLibraries, setPickedLibraries] = useState<ParsedLibrary[]>([]);
  const [pickError, setPickError] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [showExportHelp, setShowExportHelp] = useState(false);

  const [graphImportError, setGraphImportError] = useState<string | null>(null);
  const [graphImportDone, setGraphImportDone] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [wbScriptCopied, setWbScriptCopied] = useState(false);

  const [baseline, setBaseline] = useState<BaselineSnapshot | null>(null);
  const [currentTree, setCurrentTree] = useState<TreeNode | null>(null);
  const [currentColumns, setCurrentColumns] = useState<ColumnDef[]>([]);
  const [currentMeta, setCurrentMeta] = useState<Record<string, MetaMap>>({});

  useEffect(() => {
    const refresh = () => {
      setBaseline(loadHistory().baseline ?? null);
      setCurrentTree(loadTree());
      setCurrentColumns(loadColumns() ?? []);
      setCurrentMeta(loadAllMeta());
    };
    refresh();
    window.addEventListener(FOLDER_UPDATE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(FOLDER_UPDATE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const graphScript = useMemo(() => {
    if (!graphSiteUrl.trim() || !graphTenantId.trim() || !graphClientId.trim()) return null;
    return generatePowerShellScript({
      tenantId: graphTenantId,
      clientId: graphClientId,
      siteUrl: graphSiteUrl,
    });
  }, [graphSiteUrl, graphTenantId, graphClientId]);

  const writeBackDiff = useMemo(() => {
    if (!baseline) return null;
    return computeDiff(
      { tree: currentTree, columns: currentColumns, meta: currentMeta },
      baseline,
    );
  }, [baseline, currentTree, currentColumns, currentMeta]);

  const graphWriteBack = useMemo(() => {
    if (!writeBackDiff?.hasChanges) return null;
    if (!baseline?.spLookup || !baseline?.libraries) return null;
    if (!graphSiteUrl.trim() || !graphTenantId.trim() || !graphClientId.trim()) return null;
    return prepareWriteBack({
      tenantId: graphTenantId,
      clientId: graphClientId,
      siteUrl: graphSiteUrl,
      diff: writeBackDiff,
      spLookup: baseline.spLookup,
      libraries: baseline.libraries,
    });
  }, [writeBackDiff, baseline, graphSiteUrl, graphTenantId, graphClientId]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SettingsState;
        setState({ ...DEFAULT_STATE, ...parsed });
      }
    } catch {
      // first-run, ignore
    }
  }, []);

  useEffect(() => {
    const cfg = loadSource();
    setSourceKind(cfg.kind);
    if (cfg.kind === 'graph-ps') {
      setGraphSiteUrl(cfg.sharepointSiteUrl);
      setGraphTenantId(cfg.tenantId);
      setGraphClientId(cfg.clientId);
    }
    setSourceHydrated(true);
  }, []);

  useEffect(() => {
    if (!sourceHydrated) return;
    let cfg: SourceConfig;
    if (sourceKind === 'collibra') cfg = { kind: 'collibra' };
    else if (sourceKind === 'manual-csv') cfg = { kind: 'manual-csv' };
    else
      cfg = {
        kind: 'graph-ps',
        sharepointSiteUrl: graphSiteUrl,
        tenantId: graphTenantId,
        clientId: graphClientId,
      };
    saveSource(cfg);
  }, [sourceKind, graphSiteUrl, graphTenantId, graphClientId, sourceHydrated]);

  const dirty = useMemo(
    () => JSON.stringify(state) !== JSON.stringify(DEFAULT_STATE),
    [state],
  );

  const handleSave = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults? This cannot be undone.')) {
      setState(DEFAULT_STATE);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPickError(null);
    setImportDone(false);
    const newLibs: ParsedLibrary[] = [];
    for (const f of Array.from(files)) {
      try {
        const rows = await parseFile(f);
        if (rows.length === 0) {
          setPickError(`${f.name}: file is empty or contains no rows.`);
          return;
        }
        newLibs.push(analyzeLibrary(f, rows));
      } catch (err) {
        setPickError(`${f.name}: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
    }
    setPickedLibraries((cur) => [...cur, ...newLibs]);
  };

  const handleRenameLibrary = (idx: number, newName: string) => {
    setPickedLibraries((cur) =>
      cur.map((l, i) => (i === idx ? { ...l, libraryName: newName } : l)),
    );
  };

  const handleRemoveLibrary = (idx: number) => {
    setPickedLibraries((cur) => cur.filter((_, i) => i !== idx));
  };

  const handleClearPicks = () => {
    setPickedLibraries([]);
    setPickError(null);
    setImportDone(false);
  };

  const handleScriptCopy = async () => {
    if (!graphScript) return;
    try {
      await navigator.clipboard.writeText(graphScript);
      setScriptCopied(true);
      window.setTimeout(() => setScriptCopied(false), 1800);
    } catch {
      // Clipboard API may be unavailable; user can still use Download.
    }
  };

  const handleScriptDownload = () => {
    if (!graphScript) return;
    downloadFile(graphScript, 'data-magazine-import.ps1', 'text/plain;charset=utf-8');
  };

  const handleGraphJsonImport = async (file: File) => {
    setGraphImportError(null);
    setGraphImportDone(false);
    try {
      const text = await file.text();
      const parsed = parseGraphImportJson(text);
      saveTree(parsed.tree);
      saveColumns(parsed.columns);
      saveAllMeta(parsed.meta);
      saveHistory({
        current: {
          source: 'graph-ps',
          importedAt: parsed.generatedAt,
          libraryCount: parsed.stats.libraryCount,
          folderCount: parsed.stats.folderCount,
          fileCount: parsed.stats.fileCount,
        },
        baseline: {
          tree: [parsed.tree],
          columns: parsed.columns,
          meta: parsed.meta,
          ...(parsed.spLookup ? { spLookup: parsed.spLookup } : {}),
          ...(parsed.libraries ? { libraries: parsed.libraries } : {}),
        },
      });
      setGraphImportDone(true);
      window.setTimeout(() => setGraphImportDone(false), 4000);
    } catch (err) {
      setGraphImportError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleWbScriptCopy = async () => {
    if (!graphWriteBack) return;
    try {
      await navigator.clipboard.writeText(graphWriteBack.script);
      setWbScriptCopied(true);
      window.setTimeout(() => setWbScriptCopied(false), 1800);
    } catch {
      // clipboard unavailable; download remains an option.
    }
  };

  const handleWbScriptDownload = () => {
    if (!graphWriteBack) return;
    downloadFile(
      graphWriteBack.script,
      'data-magazine-writeback.ps1',
      'text/plain;charset=utf-8',
    );
  };

  const handleDownloadCsv = () => {
    if (!writeBackDiff) return;
    const csv = renderWriteBackCsv(writeBackDiff);
    downloadFile(csv, 'data-magazine-writeback.csv', 'text/csv;charset=utf-8');
  };

  const handleDownloadInstructions = () => {
    if (!writeBackDiff) return;
    const md = renderInstructionsMd(writeBackDiff);
    downloadFile(md, 'data-magazine-writeback-instructions.md', 'text/markdown;charset=utf-8');
  };

  const handleResetToImported = () => {
    if (!baseline) return;
    if (
      !window.confirm(
        'Reset all Folder view edits back to the imported state? Any unsaved column additions and value changes will be lost.',
      )
    )
      return;
    saveColumns(baseline.columns);
    saveAllMeta(baseline.meta);
  };

  const handleImport = () => {
    if (pickedLibraries.length === 0) return;
    setImportBusy(true);
    try {
      const trees = pickedLibraries.map(buildLibraryTree);
      const combined = combineLibraries(trees);
      saveTree(combined.tree);
      saveColumns(combined.columns);
      saveAllMeta(combined.meta);
      saveHistory({
        current: {
          source: 'manual-csv',
          importedAt: new Date().toISOString(),
          libraryCount: combined.libraryCount,
          folderCount: combined.folderCount,
          fileCount: combined.fileCount,
        },
        baseline: {
          tree: [combined.tree],
          columns: combined.columns,
          meta: combined.meta,
        },
      });
      setPickedLibraries([]);
      setImportDone(true);
      window.setTimeout(() => setImportDone(false), 4000);
    } catch (err) {
      setPickError(err instanceof Error ? err.message : String(err));
    } finally {
      setImportBusy(false);
    }
  };

  const handleTest = (which: 'collibra' | 'entra') => {
    setTesting((t) => ({ ...t, [which]: 'pending' }));
    const required =
      which === 'collibra'
        ? state.collibra.baseUrl && state.collibra.clientId && state.collibra.clientSecret
        : state.entra.tenantId && state.entra.clientId && state.entra.clientSecret;
    window.setTimeout(() => {
      setTesting((t) => ({ ...t, [which]: required ? 'ok' : 'fail' }));
      window.setTimeout(() => setTesting((t) => ({ ...t, [which]: 'idle' })), 3000);
    }, 900);
  };

  const updateCollibra = <K extends keyof SettingsState['collibra']>(
    key: K,
    value: SettingsState['collibra'][K],
  ) => setState((s) => ({ ...s, collibra: { ...s.collibra, [key]: value } }));

  const updateEntra = <K extends keyof SettingsState['entra']>(
    key: K,
    value: SettingsState['entra'][K],
  ) => setState((s) => ({ ...s, entra: { ...s.entra, [key]: value } }));

  const updateSchedule = <K extends keyof SettingsState['schedule']>(
    key: K,
    value: SettingsState['schedule'][K],
  ) => setState((s) => ({ ...s, schedule: { ...s.schedule, [key]: value } }));

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500">Configuration</div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-ink-500 dark:text-ink-400 text-sm leading-relaxed max-w-2xl">
          Connection parameters and sync schedule. Settings are stored in your browser only —
          values entered here are not transmitted from this page.
        </p>
      </header>

      <div className="space-y-4">
        <GroupHeader
          icon={Database}
          title="Data acquisition"
          description="Where the catalog reads its source data. Configure whichever paths you have access to — multiple sources can be set up at once."
        />

      <Section
        title="Collibra · API"
        description="OAuth 2.0 Client Credentials. Register an Integration-type application in Collibra (Settings → Manage OAuth applications) to obtain a Client ID and Client Secret."
      >
        <Row label="Base URL" hint="Your Collibra instance URL, no trailing slash.">
          <input
            value={state.collibra.baseUrl}
            onChange={(e) => updateCollibra('baseUrl', e.target.value)}
            placeholder="https://yourcompany.collibra.com"
            className={inputClass}
          />
        </Row>
        <Row label="Client ID">
          <input
            value={state.collibra.clientId}
            onChange={(e) => updateCollibra('clientId', e.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
            className={`${inputClass} font-mono`}
          />
        </Row>
        <Row label="Client Secret">
          <SecretInput
            value={state.collibra.clientSecret}
            onChange={(v) => updateCollibra('clientSecret', v)}
            visible={showSecrets.collibra}
            onToggle={() =>
              setShowSecrets((s) => ({ ...s, collibra: !s.collibra }))
            }
          />
        </Row>
        <Row label="Request timeout" hint="Seconds.">
          <input
            type="number"
            min={5}
            max={600}
            value={state.collibra.timeoutSeconds}
            onChange={(e) =>
              updateCollibra('timeoutSeconds', Number(e.target.value))
            }
            className={`${inputClass} w-32`}
          />
        </Row>
        <TestRow
          state={testing.collibra}
          onTest={() => handleTest('collibra')}
          label="Test Collibra connection"
        />
      </Section>

      <Section
        title="Collibra · Manual (XLSX)"
        description="Alternative ingest path for environments where the Python connector cannot reach Collibra directly (no outbound API allowed, no GitHub Actions, etc.). In Collibra, configure a view with the columns you want to publish, export it as XLSX, then run the conversion tool on any PC with Python 3.12+ to produce catalog.json. Drop the result into site-src/public/ and rebuild."
      >
        <Row
          label="Workflow"
          hint="Three steps, all offline after the export."
        >
          <ol className="text-xs leading-relaxed text-ink-500 dark:text-ink-400 list-decimal pl-4 space-y-1">
            <li>Collibra UI → configure a view with the asset attributes you want → Export as XLSX.</li>
            <li>Run the conversion tool locally: <code className="font-mono text-[11px]">python scripts/from_collibra_xlsx.py path/to/export.xlsx</code></li>
            <li>The tool writes <code className="font-mono text-[11px]">site-src/public/catalog.json</code>. Run <code className="font-mono text-[11px]">npm run build</code> and upload the <code className="font-mono text-[11px]">site-src/out/</code> contents to SharePoint.</li>
          </ol>
        </Row>
        <Row
          label="Conversion tool"
          hint="Python 3.12+ required. Internet access not needed."
        >
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled
              title="Not yet available — pending a real Collibra XLSX export sample to lock the column mapping."
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 dark:border-ink-800 px-3 py-1.5 text-xs text-ink-400 cursor-not-allowed w-fit"
            >
              <Download className="h-3.5 w-3.5" />
              Download from_collibra_xlsx.py
            </button>
            <p className="inline-flex items-start gap-1.5 text-[11px] text-amber-500 leading-relaxed max-w-xl">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                Not yet released. Collibra XLSX exports have no fixed schema — columns reflect whichever view was exported. The converter will ship once a real export sample from this tenant is available, so the column-name mapping can be validated against actual data rather than guessed.
              </span>
            </p>
          </div>
        </Row>
      </Section>

      <Section
        title="SharePoint · API (Graph PowerShell)"
        description="Direct read/write to a SharePoint document library via Microsoft Graph, using a self-contained PowerShell script and the OAuth 2.0 device code flow (no Client Secret). Requires a Public Client app registration in Entra ID with delegated Sites.Read.All and Sites.ReadWrite.All. Used as a Folder view source."
      >
        <Row
          label="SharePoint site URL"
          hint="All document libraries under this site will be auto-enumerated."
        >
              <input
                value={graphSiteUrl}
                onChange={(e) => setGraphSiteUrl(e.target.value)}
                placeholder="https://yourcompany.sharepoint.com/sites/data-catalog"
                className={inputClass}
              />
            </Row>
            <Row label="Tenant ID" hint="Provided by your Entra ID admin after app registration.">
              <input
                value={graphTenantId}
                onChange={(e) => setGraphTenantId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className={`${inputClass} font-mono`}
              />
            </Row>
            <Row label="Client ID" hint="Public client app ID. No client secret needed.">
              <input
                value={graphClientId}
                onChange={(e) => setGraphClientId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className={`${inputClass} font-mono`}
              />
            </Row>

            {graphScript ? (
              <>
                <div className="rounded-lg border border-ink-200 dark:border-ink-800 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-ink-200 dark:border-ink-800 bg-ink-50/40 dark:bg-ink-900/40">
                    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-500">
                      PowerShell script
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleScriptCopy}
                        className="inline-flex items-center gap-1 rounded-md border border-ink-200 dark:border-ink-800 px-2 py-1 text-[10px] hover:border-mint-400 hover:text-mint-500 transition-colors"
                      >
                        {scriptCopied ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {scriptCopied ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={handleScriptDownload}
                        className="inline-flex items-center gap-1 rounded-md border border-ink-200 dark:border-ink-800 px-2 py-1 text-[10px] hover:border-mint-400 hover:text-mint-500 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        Download .ps1
                      </button>
                    </div>
                  </div>
                  <textarea
                    readOnly
                    value={graphScript}
                    className="w-full h-72 bg-ink-50/30 dark:bg-ink-950/40 px-3 py-2 text-[11px] font-mono whitespace-pre resize-y outline-none"
                  />
                </div>
                <p className="text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed">
                  Copy or download the script, run it in PowerShell (a browser will open for
                  sign-in), then come back here and import the generated{' '}
                  <span className="font-mono">data-magazine-import.json</span>.
                </p>

                <div className="rounded-lg border border-dashed border-ink-300 dark:border-ink-700 px-4 py-4 text-center">
                  <Upload className="mx-auto h-5 w-5 text-ink-400 mb-1.5" />
                  <label className="text-sm cursor-pointer inline-block">
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleGraphJsonImport(f);
                        e.target.value = '';
                      }}
                      className="sr-only"
                    />
                    <span className="font-medium text-mint-500 hover:underline">
                      Import JSON output
                    </span>
                    <span className="text-ink-400">
                      {' '}
                      — select data-magazine-import.json
                    </span>
                  </label>
                </div>

                {graphImportError && (
                  <div className="rounded-lg border border-rose-400/40 bg-rose-500/5 px-3 py-2 text-[11px] text-rose-600 dark:text-rose-300 inline-flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{graphImportError}</span>
                  </div>
                )}
                {graphImportDone && (
                  <div className="rounded-lg border border-mint-500/40 bg-mint-500/5 px-3 py-2 text-[11px] text-mint-600 dark:text-mint-300 inline-flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Import complete — Folder view updated.
                  </div>
                )}

                {writeBackDiff?.hasChanges && baseline && !baseline.spLookup && (
                  <div className="rounded-lg border border-amber-400/40 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-200 leading-relaxed">
                    Folder view has unsaved changes, but write-back via Graph needs a fresh
                    import done with the current Data Magazine version (the previous import is
                    missing SharePoint IDs). Re-run the import script and re-import the JSON.
                  </div>
                )}

                {graphWriteBack && writeBackDiff?.hasChanges && (
                  <div className="rounded-lg border border-amber-400/40 bg-amber-500/5 px-4 py-3 space-y-3">
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                        Write back to SharePoint
                      </div>
                      <p className="text-[11px] text-ink-600 dark:text-ink-300 mt-1 leading-relaxed">
                        Folder view has changes not yet in SharePoint. The generated script POSTs
                        new columns to every captured library and PATCHes the changed list items
                        in place.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <DiffStat label="New columns" value={writeBackDiff.addedColumns.length} />
                      <DiffStat label="Items updated" value={graphWriteBack.mappedItemCount} />
                      <DiffStat
                        label="Skipped (no SP id)"
                        value={graphWriteBack.unmappedItemCount}
                      />
                    </div>
                    {graphWriteBack.unmappedItemCount > 0 && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed">
                        {graphWriteBack.unmappedItemCount} item(s) cannot be written back because
                        they are missing SharePoint IDs (likely added in Data Magazine after the
                        last import). Re-import to refresh.
                      </div>
                    )}

                    <div className="rounded-lg border border-ink-200 dark:border-ink-800 overflow-hidden">
                      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-ink-200 dark:border-ink-800 bg-ink-50/40 dark:bg-ink-900/40">
                        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-500">
                          Write-back PowerShell script
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleWbScriptCopy}
                            className="inline-flex items-center gap-1 rounded-md border border-ink-200 dark:border-ink-800 px-2 py-1 text-[10px] hover:border-mint-400 hover:text-mint-500 transition-colors"
                          >
                            {wbScriptCopied ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {wbScriptCopied ? 'Copied' : 'Copy'}
                          </button>
                          <button
                            type="button"
                            onClick={handleWbScriptDownload}
                            className="inline-flex items-center gap-1 rounded-md border border-ink-200 dark:border-ink-800 px-2 py-1 text-[10px] hover:border-mint-400 hover:text-mint-500 transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            Download .ps1
                          </button>
                        </div>
                      </div>
                      <textarea
                        readOnly
                        value={graphWriteBack.script}
                        className="w-full h-72 bg-ink-50/30 dark:bg-ink-950/40 px-3 py-2 text-[11px] font-mono whitespace-pre resize-y outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={handleResetToImported}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 dark:border-ink-800 px-3 py-1.5 text-[11px] text-ink-500 hover:border-rose-400 hover:text-rose-400 transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset to imported state
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-ink-200 dark:border-ink-800 px-4 py-3 text-[11px] text-ink-500 dark:text-ink-400">
                Fill in all three fields above to generate the PowerShell script.
              </div>
            )}
      </Section>

      <Section
        title="SharePoint · Manual (Excel/CSV)"
        description="Read/write using SharePoint's built-in Export to Excel / Export to CSV (no admin approval required). Drop the exported files in here to import; write-back generates a CSV plus step-by-step Quick Edit instructions. Used as a Folder view source."
      >
        <div className="space-y-3">
            <ExportHelpBlock
              open={showExportHelp}
              onToggle={() => setShowExportHelp((v) => !v)}
            />

            <div className="rounded-lg border border-dashed border-ink-300 dark:border-ink-700 px-4 py-5 text-center">
              <Upload className="mx-auto h-6 w-6 text-ink-400 mb-2" />
              <label className="text-sm cursor-pointer inline-block">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  multiple
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
                <span className="font-medium text-mint-500 hover:underline">
                  Choose CSV or Excel files
                </span>
                <span className="text-ink-400"> — one per library, multiple allowed</span>
              </label>
            </div>

            {pickError && (
              <div className="rounded-lg border border-rose-400/40 bg-rose-500/5 px-3 py-2 text-[11px] text-rose-600 dark:text-rose-300 inline-flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{pickError}</span>
              </div>
            )}

            {importDone && (
              <div className="rounded-lg border border-mint-500/40 bg-mint-500/5 px-3 py-2 text-[11px] text-mint-600 dark:text-mint-300 inline-flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Import complete — Folder view updated.
              </div>
            )}

            {pickedLibraries.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-400">
                  Preview ({pickedLibraries.length}{' '}
                  {pickedLibraries.length === 1 ? 'library' : 'libraries'})
                </div>
                {pickedLibraries.map((lib, idx) => (
                  <LibraryPreviewCard
                    key={`${lib.fileName}-${idx}`}
                    lib={lib}
                    onRename={(n) => handleRenameLibrary(idx, n)}
                    onRemove={() => handleRemoveLibrary(idx)}
                  />
                ))}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={handleClearPicks}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 dark:border-ink-800 px-3 py-1.5 text-xs hover:border-rose-400 hover:text-rose-400 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importBusy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-mint-500 text-ink-950 px-4 py-1.5 text-xs font-medium hover:bg-mint-400 transition-colors disabled:opacity-50"
                  >
                    <Database className="h-3.5 w-3.5" />
                    {importBusy ? 'Importing…' : 'Import to Folder view'}
                  </button>
                </div>
              </div>
            )}

            {writeBackDiff?.hasChanges && baseline && (
              <div className="rounded-lg border border-amber-400/40 bg-amber-500/5 px-4 py-3 space-y-3">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                    Write back to SharePoint
                  </div>
                  <p className="text-[11px] text-ink-600 dark:text-ink-300 mt-1 leading-relaxed">
                    Folder view has changes that are not yet in SharePoint. Generate a CSV plus
                    step-by-step instructions to copy them across.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <DiffStat label="New columns" value={writeBackDiff.addedColumns.length} />
                  <DiffStat label="Files changed" value={writeBackDiff.changedItems.length} />
                  <DiffStat
                    label="Removed columns"
                    value={writeBackDiff.removedColumns.length}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    disabled={writeBackDiff.changedItems.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-mint-500 text-ink-950 px-3 py-1.5 text-xs font-medium hover:bg-mint-400 transition-colors disabled:opacity-40"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadInstructions}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 dark:border-ink-800 px-3 py-1.5 text-xs hover:border-mint-400 hover:text-mint-500 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download instructions (Markdown)
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToImported}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-ink-200 dark:border-ink-800 px-3 py-1.5 text-[11px] text-ink-500 hover:border-rose-400 hover:text-rose-400 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to imported state
                  </button>
                </div>
              </div>
            )}
          </div>
      </Section>
      </div>

      <div className="space-y-4">
        <GroupHeader
          icon={Eye}
          title="Folder view display"
          description="Which acquired source the Folder view page renders. This is a display switch only — it does not configure or trigger data acquisition above."
        />
        <Section
          title="Display source"
          description="Pick which source to render in Folder view. Setup for each source lives under Data acquisition above."
        >
          <Row label="Source">
            <div className="space-y-2">
              {SOURCE_OPTIONS.map((opt) => {
                const active = sourceKind === opt.kind;
                return (
                  <label
                    key={opt.kind}
                    className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                      active
                        ? 'border-mint-500 bg-mint-500/5'
                        : 'border-ink-200 dark:border-ink-800 hover:border-mint-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="folder-source"
                      checked={active}
                      onChange={() => setSourceKind(opt.kind)}
                      className="mt-1 accent-mint-500"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed">
                        {opt.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </Row>
        </Section>
      </div>

      <div className="space-y-4">
        <GroupHeader
          icon={Upload}
          title="Site publishing"
          description="Auth for uploading the built static site to a SharePoint document library. Only needed if you want CI to push the site automatically — manual drag-and-drop into SharePoint never touches these settings."
        />
        <Section
          title="SharePoint upload target (Microsoft Entra ID)"
          description="Register an app in Entra ID (Microsoft Graph: Sites.ReadWrite.All, Application permission) with admin consent. This is a separate registration from the device-code app used by the SharePoint · API source above."
        >
          <Row label="Tenant ID">
            <input
              value={state.entra.tenantId}
              onChange={(e) => updateEntra('tenantId', e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className={`${inputClass} font-mono`}
            />
          </Row>
          <Row label="Client ID">
            <input
              value={state.entra.clientId}
              onChange={(e) => updateEntra('clientId', e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className={`${inputClass} font-mono`}
            />
          </Row>
          <Row label="Client Secret">
            <SecretInput
              value={state.entra.clientSecret}
              onChange={(v) => updateEntra('clientSecret', v)}
              visible={showSecrets.entra}
              onToggle={() => setShowSecrets((s) => ({ ...s, entra: !s.entra }))}
            />
          </Row>
          <Row label="SharePoint site URL" hint="The site collection that will host the catalog.">
            <input
              value={state.entra.sharepointSiteUrl}
              onChange={(e) => updateEntra('sharepointSiteUrl', e.target.value)}
              placeholder="https://yourcompany.sharepoint.com/sites/data-catalog"
              className={inputClass}
            />
          </Row>
          <Row label="Document library">
            <input
              value={state.entra.documentLibrary}
              onChange={(e) => updateEntra('documentLibrary', e.target.value)}
              placeholder="Data Magazine"
              className={inputClass}
            />
          </Row>
          <TestRow
            state={testing.entra}
            onTest={() => handleTest('entra')}
            label="Test SharePoint connection"
          />
        </Section>
      </div>

      <div className="space-y-4">
        <GroupHeader
          icon={RefreshCw}
          title="Synchronization"
          description="When the Collibra connector should refresh the catalog. Manual runs are always available regardless of this setting."
        />
      <Section
        title="Sync schedule"
        description="When the connector should pull from Collibra and refresh SharePoint. Manual runs are always available regardless of this setting."
      >
        <Row label="Frequency">
          <div className="flex flex-wrap gap-2">
            {(['daily', 'hourly', 'cron', 'manual'] as const).map((m) => (
              <button
                key={m}
                onClick={() => updateSchedule('mode', m)}
                className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors ${
                  state.schedule.mode === m
                    ? 'border-mint-500 bg-mint-500/10 text-mint-500'
                    : 'border-ink-200 dark:border-ink-800 text-ink-600 dark:text-ink-300 hover:border-mint-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </Row>
        {state.schedule.mode === 'daily' && (
          <Row label="Time of day">
            <input
              type="time"
              value={state.schedule.timeOfDay}
              onChange={(e) => updateSchedule('timeOfDay', e.target.value)}
              className={`${inputClass} w-40`}
            />
          </Row>
        )}
        {state.schedule.mode === 'cron' && (
          <Row label="Cron expression" hint="UNIX cron format. UTC unless timezone is set.">
            <input
              value={state.schedule.cron}
              onChange={(e) => updateSchedule('cron', e.target.value)}
              placeholder="0 3 * * *"
              className={`${inputClass} font-mono`}
            />
          </Row>
        )}
        {state.schedule.mode !== 'manual' && (
          <Row label="Timezone">
            <select
              value={state.schedule.timezone}
              onChange={(e) => updateSchedule('timezone', e.target.value)}
              className={inputClass}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </Row>
        )}
        <Row label="Manual run">
          <button
            onClick={() => alert('A manual sync would be triggered here. Not connected in demo mode.')}
            className="inline-flex items-center gap-2 rounded-lg border border-mint-500/40 bg-mint-500/10 px-3 py-1.5 text-xs text-mint-500 hover:bg-mint-500/20 transition-colors"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            Run sync now
          </button>
        </Row>
      </Section>
      </div>

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-ink-200 dark:border-ink-800 bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] backdrop-blur px-5 py-3">
        <div className="text-xs text-ink-400">
          {saved ? (
            <span className="inline-flex items-center gap-1.5 text-mint-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved to this browser
            </span>
          ) : dirty ? (
            'Unsaved changes'
          ) : (
            'No changes'
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 dark:border-ink-800 px-3 py-1.5 text-xs hover:border-rose-400 hover:text-rose-400 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-mint-500 text-ink-950 px-4 py-1.5 text-xs font-medium hover:bg-mint-400 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-ink-200 dark:border-ink-800 bg-ink-50/30 dark:bg-ink-900/30 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-1 focus:ring-mint-500/30 transition-colors';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink-200 dark:border-ink-800 px-6 py-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function GroupHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 pt-1">
      <div className="rounded-lg bg-mint-500/10 text-mint-500 p-2 mt-0.5">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 sm:gap-4 sm:items-start">
      <div className="pt-2">
        <div className="text-xs font-medium">{label}</div>
        {hint && <div className="text-[11px] text-ink-400 mt-0.5">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SecretInput({
  value,
  onChange,
  visible,
  onToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••••••"
        className={`${inputClass} pr-9 font-mono`}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? 'Hide secret' : 'Show secret'}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition-colors"
      >
        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function TestRow({
  state,
  onTest,
  label,
}: {
  state: 'idle' | 'pending' | 'ok' | 'fail';
  onTest: () => void;
  label: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 sm:gap-4 sm:items-center pt-1">
      <div />
      <div className="flex items-center gap-3">
        <button
          onClick={onTest}
          disabled={state === 'pending'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 dark:border-ink-800 px-3 py-1.5 text-xs hover:border-mint-400 hover:text-mint-500 transition-colors disabled:opacity-50"
        >
          <TestTube className="h-3.5 w-3.5" />
          {label}
        </button>
        {state === 'pending' && (
          <span className="text-xs text-ink-400">Authenticating…</span>
        )}
        {state === 'ok' && (
          <span className="inline-flex items-center gap-1 text-xs text-mint-500">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Connection succeeded (demo)
          </span>
        )}
        {state === 'fail' && (
          <span className="inline-flex items-center gap-1 text-xs text-rose-400">
            <AlertCircle className="h-3.5 w-3.5" />
            Required fields are missing
          </span>
        )}
      </div>
    </div>
  );
}

function ExportHelpBlock({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-lg border border-ink-200 dark:border-ink-800 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-ink-100/40 dark:hover:bg-ink-900/40 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        <span className="font-medium">How to export from SharePoint</span>
      </button>
      {open && (
        <ol className="border-t border-ink-200 dark:border-ink-800 px-5 py-3 text-[12px] leading-relaxed space-y-1.5 list-decimal text-ink-600 dark:text-ink-300">
          <li>Open the SharePoint document library in your browser.</li>
          <li>
            Switch to (or create) a view that displays every custom column you want to import.
            Hidden columns are not exported.
          </li>
          <li>
            If the library has more than about 5,000 items, raise the view&rsquo;s Item Limit so the
            export is not paginated.
          </li>
          <li>
            Click <KeyTag>Export</KeyTag> on the command bar →{' '}
            <KeyTag>Export to CSV</KeyTag> (preferred) or <KeyTag>Export to Excel</KeyTag>.
          </li>
          <li>
            Save the resulting <KeyTag>.csv</KeyTag> or <KeyTag>.xlsx</KeyTag> file locally.
          </li>
          <li>Repeat for each library you want to import.</li>
          <li>
            Click <span className="font-medium">Choose CSV or Excel files</span> below and select all
            saved files at once. Each file becomes one library inside Folder view.
          </li>
        </ol>
      )}
    </div>
  );
}

function KeyTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono bg-ink-100/60 dark:bg-ink-900/40 px-1 rounded text-[11px]">
      {children}
    </span>
  );
}

function LibraryPreviewCard({
  lib,
  onRename,
  onRemove,
}: {
  lib: ParsedLibrary;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-ink-200 dark:border-ink-800 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileSpreadsheet className="h-3.5 w-3.5 text-ink-400 shrink-0" />
          <input
            value={lib.libraryName}
            onChange={(e) => onRename(e.target.value)}
            className="flex-1 min-w-0 text-sm font-medium bg-transparent border-b border-transparent hover:border-ink-300 dark:hover:border-ink-700 focus:border-mint-400 outline-none transition-colors"
          />
          <span className="text-[10px] text-ink-400 font-mono shrink-0 truncate max-w-[180px]">
            {lib.fileName}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="text-ink-400 hover:text-rose-400 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <StatCell label="Rows" value={String(lib.rows.length)} />
        <StatCell label="Custom columns" value={String(lib.customColumns.length)} />
        <StatCell label="Path column" value={lib.pathColumn || '(missing)'} />
        <StatCell label="Name column" value={lib.nameColumn || '(missing)'} />
      </div>

      {lib.warnings.length > 0 && (
        <div className="rounded border border-amber-400/40 bg-amber-500/5 px-2 py-1 text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed">
          {lib.warnings.join(' · ')}
        </div>
      )}

      {lib.customColumns.length > 0 && (
        <div className="text-[10px] text-ink-500 dark:text-ink-400 leading-relaxed">
          <span className="font-medium">Custom columns: </span>
          {lib.customColumns.slice(0, 8).map((c) => (
            <span
              key={c}
              className="inline-block bg-ink-100/60 dark:bg-ink-900/40 rounded px-1.5 py-0.5 mr-1 mb-1 font-mono"
            >
              {c}
            </span>
          ))}
          {lib.customColumns.length > 8 && (
            <span className="ml-1">+{lib.customColumns.length - 8} more</span>
          )}
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-[0.16em] text-ink-400">{label}</div>
      <div className="font-mono truncate text-[11px]">{value}</div>
    </div>
  );
}

function DiffStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-ink-50/40 dark:bg-ink-900/40 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.16em] text-ink-400">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
