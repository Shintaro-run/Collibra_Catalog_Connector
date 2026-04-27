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
} from 'lucide-react';

type DomainSummary = {
  id: string;
  name: string;
  domainType: string;
  assetCount: number;
};

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
  filters: {
    selectedDomainIds: string[];
    assetTypes: string[];
    maxAssetsPerDomain: number;
    onlyApproved: boolean;
    onlyCertified: boolean;
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
    documentLibrary: 'Atlas Catalog',
  },
  schedule: {
    mode: 'daily',
    timeOfDay: '03:00',
    cron: '0 3 * * *',
    timezone: 'Asia/Tokyo',
  },
  filters: {
    selectedDomainIds: [],
    assetTypes: ['Table', 'Business Term', 'Data Set', 'Report'],
    maxAssetsPerDomain: 500,
    onlyApproved: false,
    onlyCertified: false,
  },
};

const STORAGE_KEY = 'atlas-settings';
const ASSET_TYPE_CHOICES = [
  'Table',
  'Column',
  'Database',
  'Schema',
  'Business Term',
  'Code Set',
  'Data Set',
  'Report',
  'Dashboard',
];
const TIMEZONES = [
  'Asia/Tokyo',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Berlin',
  'UTC',
];

export function SettingsClient({ domains }: { domains: DomainSummary[] }) {
  const [state, setState] = useState<SettingsState>(DEFAULT_STATE);
  const [saved, setSaved] = useState(false);
  const [showSecrets, setShowSecrets] = useState({ collibra: false, entra: false });
  const [testing, setTesting] = useState<{ [k: string]: 'idle' | 'pending' | 'ok' | 'fail' }>({
    collibra: 'idle',
    entra: 'idle',
  });

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

  const updateFilters = <K extends keyof SettingsState['filters']>(
    key: K,
    value: SettingsState['filters'][K],
  ) => setState((s) => ({ ...s, filters: { ...s.filters, [key]: value } }));

  const toggleDomain = (id: string) => {
    setState((s) => {
      const sel = new Set(s.filters.selectedDomainIds);
      if (sel.has(id)) sel.delete(id);
      else sel.add(id);
      return { ...s, filters: { ...s.filters, selectedDomainIds: [...sel] } };
    });
  };

  const toggleAssetType = (t: string) => {
    setState((s) => {
      const sel = new Set(s.filters.assetTypes);
      if (sel.has(t)) sel.delete(t);
      else sel.add(t);
      return { ...s, filters: { ...s.filters, assetTypes: [...sel] } };
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500">Configuration</div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-ink-500 dark:text-ink-400 text-sm leading-relaxed max-w-2xl">
          Connection parameters, sync schedule, and content filters. Settings are stored in your
          browser only — values entered here are not transmitted from this page.
        </p>
      </header>

      <Section
        title="Collibra connection"
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
        title="Microsoft Entra ID + SharePoint"
        description="Required for publishing the catalog site to a SharePoint document library. Register an app in Entra ID (Microsoft Graph: Sites.ReadWrite.All, Application permission) with admin consent."
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
            placeholder="Atlas Catalog"
            className={inputClass}
          />
        </Row>
        <TestRow
          state={testing.entra}
          onTest={() => handleTest('entra')}
          label="Test SharePoint connection"
        />
      </Section>

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

      <Section
        title="Catalog filters"
        description="Limit which Collibra domains and asset types are pulled into the published catalog. Empty domain selection means all domains are included."
      >
        <Row label="Domains" hint={`${state.filters.selectedDomainIds.length} selected (empty = all)`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {domains.map((d) => {
              const checked = state.filters.selectedDomainIds.includes(d.id);
              return (
                <label
                  key={d.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                    checked
                      ? 'border-mint-500/50 bg-mint-500/5'
                      : 'border-ink-200 dark:border-ink-800 hover:border-mint-400'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDomain(d.id)}
                      className="accent-mint-500"
                    />
                    <span className="text-sm truncate">{d.name}</span>
                  </div>
                  <span className="text-[10px] text-ink-400 tabular-nums">{d.assetCount}</span>
                </label>
              );
            })}
          </div>
        </Row>
        <Row label="Asset types">
          <div className="flex flex-wrap gap-1.5">
            {ASSET_TYPE_CHOICES.map((t) => {
              const active = state.filters.assetTypes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleAssetType(t)}
                  className={`rounded-md px-2 py-1 text-[11px] transition-colors ${
                    active
                      ? 'bg-mint-500/15 text-mint-500 ring-1 ring-mint-500/40'
                      : 'bg-ink-100/60 dark:bg-ink-900/40 text-ink-500 hover:text-mint-500'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Row>
        <Row label="Max assets per domain">
          <input
            type="number"
            min={10}
            max={10000}
            step={10}
            value={state.filters.maxAssetsPerDomain}
            onChange={(e) =>
              updateFilters('maxAssetsPerDomain', Number(e.target.value))
            }
            className={`${inputClass} w-32`}
          />
        </Row>
        <Row label="Quality gates">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={state.filters.onlyApproved}
                onChange={(e) => updateFilters('onlyApproved', e.target.checked)}
                className="accent-mint-500"
              />
              Only publish assets with status <span className="font-medium">Approved</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={state.filters.onlyCertified}
                onChange={(e) => updateFilters('onlyCertified', e.target.checked)}
                className="accent-mint-500"
              />
              Only publish certified assets
            </label>
          </div>
        </Row>
      </Section>

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
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
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
