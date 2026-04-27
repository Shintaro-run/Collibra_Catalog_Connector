import { loadCatalog } from '@/lib/catalog';
import { QualityClient } from './QualityClient';

export default async function QualityPage() {
  const catalog = await loadCatalog();
  return <QualityClient catalog={catalog} />;
}
