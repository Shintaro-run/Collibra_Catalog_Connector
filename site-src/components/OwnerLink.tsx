'use client';

import { useAccessRequest } from './AccessRequestModal';

type Props = {
  name: string;
  role?: string;
  assetId?: string;
  assetName?: string;
  domainName?: string;
  className?: string;
};

export function OwnerLink({
  name,
  role,
  assetId,
  assetName,
  domainName,
  className = '',
}: Props) {
  const { open } = useAccessRequest();
  return (
    <button
      type="button"
      onClick={() =>
        open({ ownerName: name, ownerRole: role, assetId, assetName, domainName })
      }
      className={`inline-flex items-center gap-1 underline decoration-mint-500/40 decoration-dashed underline-offset-4 hover:decoration-mint-500 hover:text-mint-500 transition-colors ${className}`}
      title="Open access request"
    >
      {name}
    </button>
  );
}
