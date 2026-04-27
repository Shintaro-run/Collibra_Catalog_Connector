import type { Asset, Domain } from './types';

export const PIPELINE_PHASES = [
  'discovery',
  'preclinical',
  'phase1',
  'phase2',
  'phase3',
  'submission',
  'postmarketing',
] as const;

export type PipelinePhase = (typeof PIPELINE_PHASES)[number];

export const PHASE_LABELS: Record<PipelinePhase, { en: string; ja: string; color: string }> = {
  discovery: { en: 'Discovery', ja: '探索', color: '#a855f7' },
  preclinical: { en: 'Pre-clinical', ja: '非臨床', color: '#6366f1' },
  phase1: { en: 'Phase I', ja: '第I相', color: '#06b6d4' },
  phase2: { en: 'Phase II', ja: '第II相', color: '#14b8a6' },
  phase3: { en: 'Phase III', ja: '第III相', color: '#22c55e' },
  submission: { en: 'Submission', ja: '申請', color: '#fbbf24' },
  postmarketing: { en: 'Post-marketing', ja: '市販後', color: '#fb7185' },
};

export function inferPhase(asset: Asset, domain: Domain): PipelinePhase {
  const tags = new Set(asset.tags ?? []);
  const desc = (asset.description ?? '').toLowerCase();
  const id = asset.id;

  if (
    domain.id === 'dom-pharmacovigilance' ||
    tags.has('signal') ||
    tags.has('icsr')
  ) {
    return 'postmarketing';
  }
  if (tags.has('real-world-evidence') || tags.has('rwe')) return 'postmarketing';
  if (
    tags.has('psur') ||
    tags.has('regulatory') ||
    desc.includes('regulatory submission') ||
    desc.includes('psur') ||
    id.endsWith('psur_summary')
  ) {
    return 'submission';
  }

  if (tags.has('exploratory') || tags.has('liquid-biopsy') || tags.has('radiomics')) {
    return 'discovery';
  }

  if (
    tags.has('genomics') ||
    tags.has('ngs') ||
    tags.has('biomarker') ||
    tags.has('cytokine') ||
    tags.has('flow')
  ) {
    return 'preclinical';
  }

  if (asset.cdiscDomain === 'PC' || asset.cdiscDomain === 'PP' || tags.has('pk') || tags.has('nca')) {
    return 'phase1';
  }

  if (
    tags.has('phase-3') ||
    desc.includes('phase iii') ||
    asset.standard === 'ADaM IG 1.3' ||
    tags.has('primary-endpoint') ||
    tags.has('endpoint')
  ) {
    return 'phase3';
  }

  if (
    asset.cdiscDomain === 'AE' ||
    asset.cdiscDomain === 'LB' ||
    asset.cdiscDomain === 'EG' ||
    asset.cdiscDomain === 'QS' ||
    asset.cdiscDomain === 'VS' ||
    asset.cdiscDomain === 'CM' ||
    asset.cdiscDomain === 'EX' ||
    asset.cdiscDomain === 'DM'
  ) {
    return 'phase2';
  }

  if (domain.id === 'dom-clinical-operations') return 'phase2';
  if (domain.id === 'dom-glossary') return 'preclinical';

  return 'phase2';
}
