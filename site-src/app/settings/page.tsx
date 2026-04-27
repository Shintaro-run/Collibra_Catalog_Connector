import { SettingsClient } from './SettingsClient';
import { loadCatalog } from '@/lib/catalog';

export default async function SettingsPage() {
  const catalog = await loadCatalog();
  const domains = catalog.domains.map((d) => ({
    id: d.id,
    name: d.name,
    domainType: d.domainType,
    assetCount: d.assetCount,
  }));
  return <SettingsClient domains={domains} />;
}
