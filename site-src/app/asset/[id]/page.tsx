import { notFound } from 'next/navigation';
import { getAsset, getAllAssets } from '@/lib/catalog';
import { AssetClient } from './AssetClient';

export async function generateStaticParams() {
  const all = await getAllAssets();
  return all.map(({ asset }) => ({ id: asset.id }));
}

export default async function AssetPage({ params }: { params: { id: string } }) {
  const found = await getAsset(params.id);
  if (!found) notFound();
  const all = await getAllAssets();
  const upstream = (found.asset.upstreamAssetIds ?? [])
    .map((id) => all.find((a) => a.asset.id === id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map(({ asset, domain }) => ({
      id: asset.id,
      name: asset.name,
      displayName: asset.displayName,
      displayNameJa: asset.displayNameJa,
      domainColor: domain.color,
    }));

  return <AssetClient asset={found.asset} domain={found.domain} upstream={upstream} />;
}
