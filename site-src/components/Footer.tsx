'use client';

import { useT } from '@/lib/i18n';

export function Footer() {
  const { t } = useT();
  return (
    <footer className="mx-auto max-w-[1280px] px-6 py-10 text-[11px] text-ink-400 border-t border-ink-200/60 dark:border-ink-800/60 mt-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>{t.footer.sourcedFrom}</div>
        <div>{t.footer.internal}</div>
      </div>
    </footer>
  );
}
