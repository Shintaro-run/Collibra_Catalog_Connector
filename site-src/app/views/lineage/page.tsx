import { loadCatalog } from '@/lib/catalog';
import { LineageClient } from './LineageClient';

export default async function LineagePage() {
  const catalog = await loadCatalog();
  return <LineageClient catalog={catalog} />;
}
