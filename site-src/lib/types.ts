export type BodyRegion =
  | 'head'
  | 'chest-left'
  | 'chest-right'
  | 'abdomen-upper'
  | 'abdomen-lower'
  | 'pelvis'
  | 'arms'
  | 'legs'
  | 'systemic';

export type AssetType =
  | 'Table'
  | 'Column'
  | 'Database'
  | 'Schema'
  | 'Business Term'
  | 'Code Set'
  | 'Data Set'
  | 'Report'
  | 'Dashboard';

export type AssetStatus =
  | 'Approved'
  | 'Accepted'
  | 'Under Review'
  | 'Submitted for Approval'
  | 'Candidate'
  | 'Obsolete'
  | 'Rejected';

export type Classification = 'Public' | 'Internal' | 'Confidential' | 'Restricted';

export type DomainType =
  | 'Therapeutic Area'
  | 'Glossary'
  | 'Operations'
  | 'Pharmacovigilance'
  | 'Regulatory';

export type Column = {
  name: string;
  dataType: string;
  description?: string;
  pii?: boolean;
  cdiscVariable?: string;
};

export type QualityBreakdown = {
  completeness: number;
  freshness: number;
  validity: number;
  lineage: number;
};

export type Asset = {
  id: string;
  name: string;
  displayName: string;
  displayNameJa?: string;
  type: AssetType;
  status: AssetStatus;
  certified: boolean;
  description: string;
  descriptionJa?: string;
  domainId: string;

  sourceSystem?: string;
  database?: string;
  schema?: string;
  tableName?: string;

  cdiscDomain?: string;
  standard?: string;

  steward: string;
  owner?: string;
  smes?: string[];

  tags: string[];
  classification: Classification;
  containsPii: boolean;
  containsPhi: boolean;
  gxpRelevant: boolean;
  regulatoryFrameworks?: string[];

  qualityScore: number;
  qualityBreakdown?: QualityBreakdown;
  freshness: string;
  rowCount?: number;

  upstreamAssetIds?: string[];

  columns?: Column[];

  createdOn?: string;
  lastModifiedOn?: string;
};

export type Domain = {
  id: string;
  name: string;
  nameJa?: string;
  slug: string;
  domainType: DomainType;
  bodyRegions: BodyRegion[];
  description: string;
  descriptionJa?: string;
  steward: string;
  technicalSteward?: string;
  color: string;
  assets: Asset[];
  assetCount: number;
};

export type Community = {
  id: string;
  name: string;
  description: string;
};

export type Catalog = {
  generatedAt: string;
  source: string;
  community: Community;
  domainCount: number;
  assetCount: number;
  domains: Domain[];
};
