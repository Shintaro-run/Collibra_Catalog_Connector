import { FolderViewClient } from './FolderViewClient';
import { COLUMNS, LIBRARY_NAME, LIBRARY_PATH, buildSeedMeta, buildTree } from './seed';

export default function FolderViewPage() {
  return (
    <FolderViewClient
      root={buildTree()}
      columns={COLUMNS}
      libraryName={LIBRARY_NAME}
      libraryPath={LIBRARY_PATH}
      initialMeta={buildSeedMeta()}
    />
  );
}
