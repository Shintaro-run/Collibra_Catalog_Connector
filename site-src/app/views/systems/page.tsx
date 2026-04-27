import { loadCatalog } from '@/lib/catalog';
import { SystemsClient } from './SystemsClient';

export default async function SystemsPage() {
  const catalog = await loadCatalog();
  return <SystemsClient catalog={catalog} />;
}
