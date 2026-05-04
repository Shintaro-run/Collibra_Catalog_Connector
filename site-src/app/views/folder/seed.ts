import type { ColumnDef, FolderNode, MetaMap, TreeNode } from '@/lib/folder';

export const LIBRARY_NAME = 'R&D Datasets';
export const LIBRARY_PATH = '/sites/RnD/Shared Documents/R&D Datasets';

// Columns the SharePoint admin would have provisioned on this library.
// Equivalent to what `/_api/web/lists/getbytitle('R%26D Datasets')/fields`
// returns, filtered to the user-editable ones.
export const COLUMNS: ColumnDef[] = [
  {
    id: 'therapeuticArea',
    label: 'Therapeutic area',
    labelJa: '治療領域',
    type: 'choice',
    choices: ['Oncology', 'Cardiology', 'Respiratory', 'Neurology', 'Immunology', 'Other'],
  },
  {
    id: 'sensitivity',
    label: 'Sensitivity',
    labelJa: '機密区分',
    type: 'choice',
    required: true,
    choices: ['Public', 'Internal', 'Confidential', 'Restricted'],
  },
  {
    id: 'steward',
    label: 'Data steward',
    labelJa: 'データスチュワード',
    type: 'text',
  },
  {
    id: 'reviewStatus',
    label: 'Review status',
    labelJa: 'レビュー状況',
    type: 'choice',
    choices: ['Draft', 'Under Review', 'Approved', 'Archived'],
  },
  {
    id: 'reviewDate',
    label: 'Review date',
    labelJa: 'レビュー日',
    type: 'date',
  },
  {
    id: 'tags',
    label: 'Tags',
    labelJa: 'タグ',
    type: 'text',
    helpText: 'Comma-separated.',
    helpTextJa: 'カンマ区切り。',
  },
  {
    id: 'containsPii',
    label: 'Contains PII / PHI',
    labelJa: '個人情報を含む',
    type: 'boolean',
  },
  {
    id: 'notes',
    label: 'Notes',
    labelJa: '備考',
    type: 'multiline',
  },
];

const NOW = Date.parse('2026-05-04T09:00:00Z');

function daysAgo(d: number): string {
  return new Date(NOW - d * 86400000).toISOString();
}

function file(
  name: string,
  parentPath: string,
  size: number,
  ageDays: number,
  modifiedBy: string,
): TreeNode {
  return {
    kind: 'file',
    id: `${parentPath}/${name}`,
    name,
    path: `${parentPath}/${name}`,
    size,
    modifiedAt: daysAgo(ageDays),
    modifiedBy,
  };
}

function folder(
  name: string,
  parentPath: string,
  children: TreeNode[],
  modifiedBy: string,
): FolderNode {
  const path = `${parentPath}/${name}`;
  return {
    kind: 'folder',
    id: path,
    name,
    path,
    modifiedAt: daysAgo(2),
    modifiedBy,
    children,
  };
}

export function buildTree(): FolderNode {
  return folder(
    LIBRARY_NAME,
    '/sites/RnD/Shared Documents',
    [
      folder(
        'Compounds',
        `${LIBRARY_PATH}`,
        [
          folder(
            'COMPOUND-X',
            `${LIBRARY_PATH}/Compounds`,
            [
              file('PK_summary_v3.xlsx', `${LIBRARY_PATH}/Compounds/COMPOUND-X`, 184_320, 1, 'Aiko Tanaka'),
              file('safety_signals_q1.csv', `${LIBRARY_PATH}/Compounds/COMPOUND-X`, 41_982, 4, 'Hiroshi Sato'),
              file('DMPK_report_v3.pdf', `${LIBRARY_PATH}/Compounds/COMPOUND-X`, 2_410_240, 9, 'Marcus Lee'),
              file('exposure_response_model.r', `${LIBRARY_PATH}/Compounds/COMPOUND-X`, 8_392, 12, 'Marcus Lee'),
            ],
            'Aiko Tanaka',
          ),
          folder(
            'COMPOUND-Y',
            `${LIBRARY_PATH}/Compounds`,
            [
              file('toxicology_summary.pdf', `${LIBRARY_PATH}/Compounds/COMPOUND-Y`, 1_088_000, 21, 'Priya Shah'),
              file('IND_supporting_data.xlsx', `${LIBRARY_PATH}/Compounds/COMPOUND-Y`, 612_000, 33, 'Priya Shah'),
            ],
            'Priya Shah',
          ),
        ],
        'Marcus Lee',
      ),
      folder(
        'Clinical Trials',
        `${LIBRARY_PATH}`,
        [
          folder(
            'PHARMA-001',
            `${LIBRARY_PATH}/Clinical Trials`,
            [
              file('protocol_v2.pdf', `${LIBRARY_PATH}/Clinical Trials/PHARMA-001`, 3_200_000, 6, 'Elena Rossi'),
              file('ICF_template.docx', `${LIBRARY_PATH}/Clinical Trials/PHARMA-001`, 92_160, 14, 'Elena Rossi'),
              file('enrollment_log.xlsx', `${LIBRARY_PATH}/Clinical Trials/PHARMA-001`, 320_000, 1, 'Daniel Park'),
              file('monitoring_visit_q2.pdf', `${LIBRARY_PATH}/Clinical Trials/PHARMA-001`, 720_000, 3, 'Daniel Park'),
            ],
            'Elena Rossi',
          ),
          folder(
            'PHARMA-007',
            `${LIBRARY_PATH}/Clinical Trials`,
            [
              file('synopsis_draft.docx', `${LIBRARY_PATH}/Clinical Trials/PHARMA-007`, 88_000, 19, 'Aiko Tanaka'),
              file('investigator_brochure_v1.pdf', `${LIBRARY_PATH}/Clinical Trials/PHARMA-007`, 4_900_000, 27, 'Aiko Tanaka'),
            ],
            'Aiko Tanaka',
          ),
        ],
        'Elena Rossi',
      ),
      folder(
        'RWE Datasets',
        `${LIBRARY_PATH}`,
        [
          file('claims_extract_2025_q1.parquet', `${LIBRARY_PATH}/RWE Datasets`, 184_320_000, 8, 'Daniel Park'),
          file('ehr_cohort_definition.sql', `${LIBRARY_PATH}/RWE Datasets`, 12_280, 8, 'Daniel Park'),
          file('cohort_baseline_table.csv', `${LIBRARY_PATH}/RWE Datasets`, 992_000, 8, 'Daniel Park'),
        ],
        'Daniel Park',
      ),
      folder(
        'Pharmacovigilance',
        `${LIBRARY_PATH}`,
        [
          file('PSUR_2025_draft.docx', `${LIBRARY_PATH}/Pharmacovigilance`, 280_000, 2, 'Hiroshi Sato'),
          file('signal_register.xlsx', `${LIBRARY_PATH}/Pharmacovigilance`, 410_000, 1, 'Hiroshi Sato'),
        ],
        'Hiroshi Sato',
      ),
    ],
    'Marcus Lee',
  );
}

// A handful of pre-set metadata values so the panel doesn't look empty
// on first visit. Keyed by file path.
export function buildSeedMeta(): Record<string, MetaMap> {
  return {
    [`${LIBRARY_PATH}/Compounds/COMPOUND-X/PK_summary_v3.xlsx`]: {
      therapeuticArea: 'Oncology',
      sensitivity: 'Confidential',
      steward: 'Aiko Tanaka',
      reviewStatus: 'Approved',
      reviewDate: '2026-04-15',
      tags: 'pk,popPK,compound-x',
      containsPii: false,
      notes: 'Latest PopPK readout — exposure–response covariate set finalised.',
    },
    [`${LIBRARY_PATH}/Compounds/COMPOUND-X/safety_signals_q1.csv`]: {
      therapeuticArea: 'Oncology',
      sensitivity: 'Restricted',
      steward: 'Hiroshi Sato',
      reviewStatus: 'Under Review',
      tags: 'safety,signals,compound-x',
      containsPii: true,
    },
    [`${LIBRARY_PATH}/Clinical Trials/PHARMA-001/enrollment_log.xlsx`]: {
      therapeuticArea: 'Cardiology',
      sensitivity: 'Restricted',
      steward: 'Daniel Park',
      reviewStatus: 'Under Review',
      reviewDate: '2026-05-01',
      tags: 'enrollment,phase2,pharma-001',
      containsPii: true,
      notes: 'Site-level enrollment refreshed weekly.',
    },
    [`${LIBRARY_PATH}/RWE Datasets/claims_extract_2025_q1.parquet`]: {
      therapeuticArea: 'Cardiology',
      sensitivity: 'Confidential',
      steward: 'Daniel Park',
      reviewStatus: 'Approved',
      reviewDate: '2026-04-08',
      tags: 'rwe,claims,2025q1',
      containsPii: false,
    },
  };
}
