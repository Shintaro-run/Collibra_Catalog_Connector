type Props = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
};

export function StatTile({ label, value, hint, accent }: Props) {
  return (
    <div className="rounded-2xl border border-ink-200 dark:border-ink-800 bg-ink-50/30 dark:bg-ink-900/30 px-5 py-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-ink-400">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <div
          className="text-2xl font-semibold tabular-nums tracking-tight"
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </div>
        {hint && <div className="text-[11px] text-ink-400">{hint}</div>}
      </div>
    </div>
  );
}
