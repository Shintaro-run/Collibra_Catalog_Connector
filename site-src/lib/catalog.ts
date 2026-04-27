import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Catalog, Domain, Asset } from './types';

let cached: Catalog | null = null;

export async function loadCatalog(): Promise<Catalog> {
  if (cached) return cached;
  const file = path.join(process.cwd(), 'public', 'catalog.json');
  const raw = await fs.readFile(file, 'utf8');
  cached = JSON.parse(raw) as Catalog;
  return cached;
}

export async function getDomains(): Promise<Domain[]> {
  const catalog = await loadCatalog();
  return catalog.domains;
}

export async function getDomain(slug: string): Promise<Domain | undefined> {
  const domains = await getDomains();
  return domains.find((d) => d.slug === slug);
}

export async function getAsset(id: string): Promise<{ asset: Asset; domain: Domain } | undefined> {
  const domains = await getDomains();
  for (const domain of domains) {
    const asset = domain.assets.find((a) => a.id === id);
    if (asset) return { asset, domain };
  }
  return undefined;
}

export async function getAllAssets(): Promise<{ asset: Asset; domain: Domain }[]> {
  const domains = await getDomains();
  return domains.flatMap((domain) => domain.assets.map((asset) => ({ asset, domain })));
}
