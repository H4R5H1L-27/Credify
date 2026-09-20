import { loadDeployment, ChainClient } from './chain/client.js';
import { ProjectionStore } from './store/projection.js';
import { VerificationStore } from './store/verification.js';
import { ChainIndexer } from './chain/indexer.js';

async function runReset() {
  const deployment = await loadDeployment();
  const chain = new ChainClient(deployment);
  const store = new ProjectionStore();
  const verificationStore = new VerificationStore();
  const indexer = new ChainIndexer(chain, store);

  await store.reset();
  await verificationStore.reset();
  await indexer.indexOnce();
  console.log(`Demo reset complete. Indexed through block ${store.lastIndexedBlock.toString()}`);
}

runReset().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
