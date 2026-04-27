import { loadCatalog } from '@/lib/catalog';
import { ComplianceClient } from './ComplianceClient';

export default async function CompliancePage() {
  const catalog = await loadCatalog();
  return <ComplianceClient catalog={catalog} />;
}
