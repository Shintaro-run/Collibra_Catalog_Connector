'use client';

import { LanguageProvider } from '@/lib/i18n';
import { TopProgressBar } from './TopProgressBar';
import { AccessRequestProvider } from './AccessRequestModal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AccessRequestProvider>
        <TopProgressBar />
        {children}
      </AccessRequestProvider>
    </LanguageProvider>
  );
}
