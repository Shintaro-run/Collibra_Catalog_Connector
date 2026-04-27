import { loadCatalog } from '@/lib/catalog';
import { TimelineClient } from './TimelineClient';

export default async function TimelinePage() {
  const catalog = await loadCatalog();
  return <TimelineClient catalog={catalog} />;
}
