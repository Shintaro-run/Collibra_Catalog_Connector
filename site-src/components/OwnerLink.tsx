'use client';

import { useAccessRequest } from './AccessRequestModal';
import type { AssetType, Classification } from '@/lib/types';

// `name` is the visible label (steward, owner, or SME). All requests are
// received by the data steward, so `stewardName` is what gets recorded as
// the recipient — it may differ from `name` (e.g. when an SME or owner is
// clicked).
type Props = {
  name: string;
  role?: string;
  stewardName?: string;
  ownerName?: string;
  assetId?: string;
  assetName?: string;
  assetDisplayName?: string;
  assetType?: AssetType;
  classification?: Classification;
  domainName?: string;
  className?: string;
};

export function OwnerLink({
  name,
  role,
  stewardName,
  ownerName,
  assetId,
  assetName,
  assetDisplayName,
  assetType,
  classification,
  domainName,
  className = '',
}: Props) {
  const { open } = useAccessRequest();
  return (
    <button
      type="button"
      onClick={() =>
        open({
          stewardName: stewardName ?? name,
          ownerName,
          assetId,
          assetName,
          assetDisplayName,
          assetType,
          classification,
          domainName,
        })
      }
      className={`inline-flex items-center gap-1 underline decoration-mint-500/40 decoration-dashed underline-offset-4 hover:decoration-mint-500 hover:text-mint-500 transition-colors ${className}`}
      title="Open access request"
    >
      {name}
    </button>
  );
}
