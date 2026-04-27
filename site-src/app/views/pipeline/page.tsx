import { loadCatalog } from '@/lib/catalog';
import { PipelineClient } from './PipelineClient';

export default async function PipelinePage() {
  const catalog = await loadCatalog();
  return <PipelineClient catalog={catalog} />;
}
