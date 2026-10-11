import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_ACCOUNTS } from '@credify/shared';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('WP9: DEMO_ACCOUNTS preset contains all 7 verified presentation personas', () => {
  assert.equal(DEMO_ACCOUNTS.length, 7, 'Must have exactly 7 demo accounts');

  const ids = DEMO_ACCOUNTS.map((a) => a.id);
  assert.ok(ids.includes('operator'), 'Must include operator persona');
  assert.ok(ids.includes('borrower'), 'Must include borrower persona');
  assert.ok(ids.includes('lender-alpha'), 'Must include lead lender persona');
  assert.ok(ids.includes('lender-beta'), 'Must include syndicate lender persona');
  assert.ok(ids.includes('lender-gamma'), 'Must include governance lender persona');
  assert.ok(ids.includes('merchant-a'), 'Must include supplier A persona');
  assert.ok(ids.includes('merchant-b'), 'Must include supplier B persona');

  for (const account of DEMO_ACCOUNTS) {
    assert.match(account.address, /^0x[a-fA-F0-9]{40}$/, `Valid address for ${account.id}`);
    assert.match(account.privateKey, /^0x[a-fA-F0-9]{64}$/, `Valid private key for ${account.id}`);
    assert.ok(account.displayName.length > 2, `Valid display name for ${account.id}`);
    assert.ok(account.description.length > 5, `Valid description for ${account.id}`);
  }
});

test('WP9: ScenarioSeeder enforces presentation-safe short durations', async () => {
  const seederFile = path.resolve(__dirname, 'services/scenario-seeder.ts');
  assert.ok(fs.existsSync(seederFile), 'scenario-seeder.ts exists');

  const content = fs.readFileSync(seederFile, 'utf-8');

  // Verify that durations comply with minimum (300 seconds) and presentation duration limits (<= 1800 seconds)
  assert.match(content, /duration1 = 600/, 'Scenario 1 uses presentation-safe 10 minute duration');
  assert.match(content, /duration2 = 1800/, 'Scenario 4 uses presentation-safe 30 minute duration');
  assert.match(content, /duration3 = 1800/, 'Scenario 5 uses presentation-safe 30 minute duration');
  assert.match(content, /fundingDurationSeconds: 300/, 'Funding windows are 5 minutes for rapid presentation demonstration');
});

test('WP9: Web application provides GuidedModeSwitcher and Guided Mode contract execution', () => {
  const webSrcDir = path.resolve(__dirname, '../../web/src');

  const guidedSwitcherFile = path.join(webSrcDir, 'components/layout/GuidedModeSwitcher.tsx');
  assert.ok(fs.existsSync(guidedSwitcherFile), 'GuidedModeSwitcher.tsx component exists');

  const identityContextFile = path.join(webSrcDir, 'context/IdentityContext.tsx');
  const identityContent = fs.readFileSync(identityContextFile, 'utf-8');
  assert.ok(identityContent.includes('isGuidedMode'), 'IdentityContext exposes isGuidedMode');
  assert.ok(identityContent.includes('switchPersona'), 'IdentityContext exposes switchPersona');
  assert.ok(identityContent.includes('activePersona'), 'IdentityContext exposes activePersona');

  const contractActionFile = path.join(webSrcDir, 'hooks/useContractAction.ts');
  const contractActionContent = fs.readFileSync(contractActionFile, 'utf-8');
  assert.ok(contractActionContent.includes('runGuidedLifecycle'), 'useContractAction provides runGuidedLifecycle');
  assert.ok(contractActionContent.includes('api.createLoan'), 'useContractAction routes createLoan to server in Guided Mode');
  assert.ok(contractActionContent.includes('api.contribute'), 'useContractAction routes contribute to server in Guided Mode');
  assert.ok(contractActionContent.includes('api.spend'), 'useContractAction routes spend to server in Guided Mode');
  assert.ok(contractActionContent.includes('api.repay'), 'useContractAction routes repay to server in Guided Mode');
  assert.ok(contractActionContent.includes('api.claimRepayment'), 'useContractAction routes claim to server in Guided Mode');

  const appShellFile = path.join(webSrcDir, 'components/layout/AppShell.tsx');
  const appShellContent = fs.readFileSync(appShellFile, 'utf-8');
  assert.ok(appShellContent.includes('GuidedModeSwitcher'), 'AppShell mounts GuidedModeSwitcher in header');
});
