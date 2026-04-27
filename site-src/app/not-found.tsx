'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 space-y-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500">
        {t.notFound.kicker}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{t.notFound.headline}</h1>
      <p className="text-sm text-ink-400 max-w-md">{t.notFound.body}</p>
      <Link
        href="/"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-mint-500/40 px-4 py-2 text-sm text-mint-500 hover:bg-mint-500/10 transition-colors"
      >
        {t.notFound.back}
      </Link>
    </div>
  );
}
