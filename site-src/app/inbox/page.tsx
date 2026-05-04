import { InboxClient } from './InboxClient';
import { buildSeedRequests } from './seed';

export default async function InboxPage() {
  const seed = await buildSeedRequests();
  return <InboxClient initialSeed={seed} />;
}
