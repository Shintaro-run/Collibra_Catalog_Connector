'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useT } from '@/lib/i18n';
import {
  create as createRequest,
  nextTrackingId,
  type AccessRequest,
  type DurationCode,
} from '@/lib/requests';
import type { AssetType, Classification } from '@/lib/types';

// All requests are received by the data steward. `ownerName` is captured
// alongside for visibility but the steward owns the decision.
export type AccessRequestTarget = {
  stewardName: string;
  ownerName?: string;
  assetId?: string;
  assetName?: string;
  assetDisplayName?: string;
  assetType?: AssetType;
  classification?: Classification;
  domainName?: string;
};

type Ctx = {
  open: (target: AccessRequestTarget) => void;
};

const AccessRequestContext = createContext<Ctx>({ open: () => undefined });

export function useAccessRequest() {
  return useContext(AccessRequestContext);
}

type Stage = 'form' | 'submitting' | 'done';

export function AccessRequestProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<AccessRequestTarget | null>(null);
  const [stage, setStage] = useState<Stage>('form');

  const value = useMemo<Ctx>(
    () => ({
      open: (t) => {
        setTarget(t);
        setStage('form');
      },
    }),
    [],
  );

  return (
    <AccessRequestContext.Provider value={value}>
      {children}
      <AccessRequestModalView
        target={target}
        stage={stage}
        setStage={setStage}
        onClose={() => setTarget(null)}
      />
    </AccessRequestContext.Provider>
  );
}

function AccessRequestModalView({
  target,
  stage,
  setStage,
  onClose,
}: {
  target: AccessRequestTarget | null;
  stage: Stage;
  setStage: (s: Stage) => void;
  onClose: () => void;
}) {
  const [trackingId, setTrackingId] = useState<string>('');
  const { t, lang } = useT();
  const tt = t.accessRequest;

  const [form, setForm] = useState({
    name: '',
    email: '',
    department: '',
    reason: '',
    intendedUse: '',
    duration: '90d',
    managerEmail: '',
    consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (target) {
      setForm({
        name: '',
        email: '',
        department: '',
        reason: '',
        intendedUse: '',
        duration: '90d',
        managerEmail: '',
        consent: false,
      });
      setErrors({});
    }
  }, [target]);

  if (!target) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = tt.validation.required;
    if (!form.email.trim()) errs.email = tt.validation.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = tt.validation.email;
    if (!form.reason.trim()) errs.reason = tt.validation.required;
    if (!form.intendedUse.trim()) errs.intendedUse = tt.validation.required;
    if (!form.managerEmail.trim()) errs.managerEmail = tt.validation.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.managerEmail))
      errs.managerEmail = tt.validation.email;
    if (!form.consent) errs.consent = tt.validation.compliance;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !target) return;
    setStage('submitting');
    const id = nextTrackingId();
    setTrackingId(id);
    const req: AccessRequest = {
      id,
      createdAt: new Date().toISOString(),
      asset: {
        id: target.assetId ?? 'unknown',
        name: target.assetName ?? target.assetDisplayName ?? 'unknown',
        displayName: target.assetDisplayName ?? target.assetName ?? 'Asset',
        type: target.assetType ?? 'Table',
        classification: target.classification ?? 'Internal',
        domainName: target.domainName ?? '',
      },
      requester: {
        name: form.name,
        email: form.email,
        department: form.department,
      },
      reason: form.reason,
      intendedUse: form.intendedUse,
      duration: form.duration as DurationCode,
      managerEmail: form.managerEmail,
      stewardName: target.stewardName,
      ownerName: target.ownerName,
      status: 'Pending',
    };
    window.setTimeout(() => {
      createRequest(req);
      setStage('done');
    }, 900);
  };

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => stage !== 'submitting' && onClose()}
        >
          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-xl glass rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {stage === 'done' ? (
              <Success target={target} trackingId={trackingId} onClose={onClose} />
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="px-5 py-4 border-b border-ink-200/60 dark:border-ink-800/60 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-mint-500/15 ring-1 ring-mint-500/40 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4 text-mint-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold tracking-tight">{tt.title}</div>
                    <div className="text-[11px] text-ink-400 mt-0.5">{tt.subtitle}</div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={tt.close}
                    className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-5 py-4 grid grid-cols-2 gap-3 text-xs border-b border-ink-200/60 dark:border-ink-800/60 bg-ink-50/30 dark:bg-ink-900/30">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-ink-400">
                      {tt.steward}
                    </div>
                    <div className="text-sm font-medium mt-0.5">{target.stewardName}</div>
                  </div>
                  {target.assetName && (
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-ink-400">
                        {tt.asset}
                      </div>
                      <div className="text-sm font-medium mt-0.5 truncate">
                        {target.assetName}
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto scroll-fade">
                  <Field label={tt.requesterName} error={errors.name}>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputClass}
                      placeholder={lang === 'ja' ? '山田 太郎' : 'Jane Doe'}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={tt.requesterEmail} error={errors.email}>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={inputClass}
                        placeholder="name@yourcompany.com"
                      />
                    </Field>
                    <Field label={tt.requesterDept}>
                      <input
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        className={inputClass}
                        placeholder={lang === 'ja' ? '臨床開発本部' : 'Clinical Development'}
                      />
                    </Field>
                  </div>
                  <Field label={tt.reason} error={errors.reason}>
                    <textarea
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      className={`${inputClass} h-20 resize-none`}
                      placeholder={
                        lang === 'ja'
                          ? '例: COMPOUND-X PopPK 解析のため、対象集団の曝露プロファイルが必要。'
                          : 'e.g. Required for COMPOUND-X PopPK analysis to characterise exposure in the target population.'
                      }
                    />
                  </Field>
                  <Field label={tt.intendedUse} error={errors.intendedUse}>
                    <textarea
                      value={form.intendedUse}
                      onChange={(e) => setForm({ ...form, intendedUse: e.target.value })}
                      className={`${inputClass} h-20 resize-none`}
                      placeholder={
                        lang === 'ja'
                          ? '例: 内部解析および規制提出 (PMDA Module 5) のサポート資料として使用。'
                          : 'e.g. Internal analysis and supporting evidence for the regulatory submission (PMDA Module 5).'
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={tt.duration}>
                      <select
                        value={form.duration}
                        onChange={(e) => setForm({ ...form, duration: e.target.value })}
                        className={inputClass}
                      >
                        <option value="30d">{tt.durationOptions['30d']}</option>
                        <option value="90d">{tt.durationOptions['90d']}</option>
                        <option value="180d">{tt.durationOptions['180d']}</option>
                        <option value="365d">{tt.durationOptions['365d']}</option>
                        <option value="ongoing">{tt.durationOptions.ongoing}</option>
                      </select>
                    </Field>
                    <Field label={tt.managerEmail} error={errors.managerEmail}>
                      <input
                        type="email"
                        value={form.managerEmail}
                        onChange={(e) =>
                          setForm({ ...form, managerEmail: e.target.value })
                        }
                        className={inputClass}
                        placeholder="manager@yourcompany.com"
                      />
                    </Field>
                  </div>

                  <label className="flex items-start gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                      className="mt-0.5 accent-mint-500"
                    />
                    <span className="text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed">
                      {tt.compliance}
                    </span>
                  </label>
                  {errors.consent && (
                    <div className="text-[11px] text-rose-400 -mt-1">{errors.consent}</div>
                  )}
                </div>

                <div className="px-5 py-3 flex items-center justify-end gap-2 border-t border-ink-200/60 dark:border-ink-800/60 bg-[color-mix(in_oklab,var(--bg)_92%,transparent)]">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={stage === 'submitting'}
                    className="rounded-lg border border-ink-200 dark:border-ink-800 px-3 py-1.5 text-xs hover:border-rose-400 hover:text-rose-400 transition-colors disabled:opacity-50"
                  >
                    {tt.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={stage === 'submitting'}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-mint-500 text-ink-950 px-4 py-1.5 text-xs font-medium hover:bg-mint-400 transition-colors disabled:opacity-60"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {stage === 'submitting' ? tt.submitting : tt.submit}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Success({
  target,
  trackingId,
  onClose,
}: {
  target: AccessRequestTarget;
  trackingId: string;
  onClose: () => void;
}) {
  const { t } = useT();

  return (
    <div className="px-6 py-8 text-center space-y-4">
      <div className="mx-auto h-14 w-14 rounded-full bg-mint-500/15 ring-2 ring-mint-500/40 flex items-center justify-center">
        <CheckCircle2 className="h-7 w-7 text-mint-500" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight">
          {t.accessRequest.successTitle}
        </h3>
        <p className="text-xs text-ink-500 dark:text-ink-400 max-w-md mx-auto leading-relaxed">
          {t.accessRequest.successBody}
        </p>
      </div>
      <div className="rounded-xl bg-ink-50/60 dark:bg-ink-900/40 px-4 py-3 text-left text-xs space-y-1 max-w-md mx-auto">
        <Row label={t.accessRequest.steward} value={target.stewardName} />
        {target.assetName && (
          <Row label={t.accessRequest.asset} value={target.assetName} mono />
        )}
        <Row label="Tracking ID" value={trackingId} mono />
      </div>
      <button
        onClick={onClose}
        className="rounded-lg border border-ink-200 dark:border-ink-800 px-4 py-1.5 text-xs hover:border-mint-400 hover:text-mint-500 transition-colors"
      >
        {t.accessRequest.close}
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-ink-400">{label}</span>
      <span className={mono ? 'font-mono' : ''}>{value}</span>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[11px] font-medium mb-1">{label}</div>
      {children}
      {error && <div className="text-[11px] text-rose-400 mt-1">{error}</div>}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-ink-200 dark:border-ink-800 bg-ink-50/30 dark:bg-ink-900/30 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-1 focus:ring-mint-500/30 transition-colors';
