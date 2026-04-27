import { loadCatalog } from '@/lib/catalog';
import { HomeClient } from './HomeClient';

export default async function HomePage() {
  const catalog = await loadCatalog();
  return <HomeClient catalog={catalog} />;
}
