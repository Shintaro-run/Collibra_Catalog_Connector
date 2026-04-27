import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Providers } from '@/components/Providers';
import { Footer } from '@/components/Footer';
import { getAllAssets } from '@/lib/catalog';
import type { SearchItem } from '@/components/SearchPalette';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Collibra Catalog Connector — R&D Data Catalog',
  description:
    'Discover trusted clinical, translational, and real-world data assets across therapeutic areas.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const all = await getAllAssets();
  const index: SearchItem[] = all.map(({ asset, domain }) => ({
    asset: {
      id: asset.id,
      name: asset.name,
      displayName: asset.displayName,
      displayNameJa: asset.displayNameJa,
      type: asset.type,
      description: asset.description,
      tags: asset.tags,
    },
    domain: {
      id: domain.id,
      name: domain.name,
      nameJa: domain.nameJa,
      slug: domain.slug,
      color: domain.color,
    },
  }));

  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen font-sans">
        <Providers>
          <Header searchIndex={index} />
          <main className="mx-auto max-w-[1280px] px-6 py-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
