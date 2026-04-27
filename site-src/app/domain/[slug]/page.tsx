import { notFound } from 'next/navigation';
import { getDomain, getDomains, loadCatalog } from '@/lib/catalog';
import { DomainClient } from './DomainClient';

export async function generateStaticParams() {
  const domains = await getDomains();
  return domains.map((d) => ({ slug: d.slug }));
}

export default async function DomainPage({ params }: { params: { slug: string } }) {
  const domain = await getDomain(params.slug);
  if (!domain) notFound();
  const catalog = await loadCatalog();
  return <DomainClient domain={domain} community={catalog.community} />;
}
