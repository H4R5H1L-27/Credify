import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseAgreementDeterministic } from './services/terms.js';

interface GoldenFixture {
  id: string;
  title: string;
  category: string;
  text: string;
  expected: {
    targetEth?: string;
    aprPercent?: number;
    durationDays?: number;
    fundingDays?: number;
    spendCapEth?: string;
    gracePeriodDays?: number;
    quorumPercent?: number;
    merchants?: string[];
    perMerchantCaps?: Record<string, string>;
    missingFields?: string[];
    hasUnsupportedClauses?: boolean;
    unsupportedClauseTypes?: string[];
    hasUnresolvedMerchants?: boolean;
    unresolvedMerchantNames?: string[];
    allowUnvettedAddresses?: boolean;
    isValid?: boolean;
  };
}

test('Golden Set Agreement Parser Evaluation (32 Fixtures)', async () => {
  const filePath = resolve(process.cwd(), 'packages/shared/src/fixtures/agreements-golden.json');
  const raw = await readFile(filePath, 'utf8');
  const fixtures = JSON.parse(raw) as GoldenFixture[];

  assert.ok(fixtures.length >= 30, `Golden set must contain at least 30 fixtures (found ${fixtures.length})`);

  let targetMatches = 0;
  let targetTotal = 0;
  let aprMatches = 0;
  let aprTotal = 0;
  let durationMatches = 0;
  let durationTotal = 0;
  let spendCapMatches = 0;
  let spendCapTotal = 0;
  let merchantMatches = 0;
  let merchantTotal = 0;
  let unsupportedClauseMatches = 0;
  let unsupportedClauseTotal = 0;
  let injectionAttacksTested = 0;
  let injectionAttacksBlocked = 0;

  for (const fixture of fixtures) {
    const result = parseAgreementDeterministic(fixture.text);
    const resultWithDefaults = parseAgreementDeterministic(fixture.text, {
      acceptedDefaults: { fundingDays: 7, defaultQuorumPercent: 50.01, gracePeriodDays: 3 }
    });

    // Target Accuracy
    if (fixture.expected.targetEth !== undefined) {
      targetTotal++;
      if (result.fields.targetEth.value === fixture.expected.targetEth) {
        targetMatches++;
      } else {
        assert.equal(
          result.fields.targetEth.value,
          fixture.expected.targetEth,
          `[${fixture.id}] targetEth mismatch for "${fixture.title}"`
        );
      }
    }

    // APR Accuracy
    if (fixture.expected.aprPercent !== undefined) {
      aprTotal++;
      if (result.fields.aprPercent.value === fixture.expected.aprPercent) {
        aprMatches++;
      } else {
        assert.equal(
          result.fields.aprPercent.value,
          fixture.expected.aprPercent,
          `[${fixture.id}] aprPercent mismatch for "${fixture.title}"`
        );
      }
    }

    // Duration Accuracy
    if (fixture.expected.durationDays !== undefined) {
      durationTotal++;
      if (result.fields.durationDays.value === fixture.expected.durationDays) {
        durationMatches++;
      } else {
        assert.equal(
          result.fields.durationDays.value,
          fixture.expected.durationDays,
          `[${fixture.id}] durationDays mismatch for "${fixture.title}"`
        );
      }
    }

    // Spend Cap Accuracy
    if (fixture.expected.spendCapEth !== undefined) {
      spendCapTotal++;
      if (result.fields.spendCapEth.value === fixture.expected.spendCapEth) {
        spendCapMatches++;
      } else {
        assert.equal(
          result.fields.spendCapEth.value,
          fixture.expected.spendCapEth,
          `[${fixture.id}] spendCapEth mismatch for "${fixture.title}"`
        );
      }
    }

    // Merchants Accuracy
    if (fixture.expected.merchants !== undefined) {
      merchantTotal++;
      const resolvedNames = result.resolvedMerchants.map((m) => m.name);
      const allFound = fixture.expected.merchants.every((m) => resolvedNames.includes(m));
      if (allFound) {
        merchantMatches++;
      } else {
        assert.ok(
          allFound,
          `[${fixture.id}] merchants mismatch: expected ${JSON.stringify(fixture.expected.merchants)}, got ${JSON.stringify(resolvedNames)}`
        );
      }
    }

    // Missing Fields Assertions
    if (fixture.expected.missingFields) {
      for (const missing of fixture.expected.missingFields) {
        assert.ok(
          result.missingFields.includes(missing),
          `[${fixture.id}] expected missingField "${missing}" not found in [${result.missingFields.join(', ')}]`
        );
      }
    }

    // Unsupported Clauses Assertions
    if (fixture.expected.hasUnsupportedClauses !== undefined) {
      unsupportedClauseTotal++;
      const detected = result.unsupportedClauses.length > 0;
      if (detected === fixture.expected.hasUnsupportedClauses) {
        unsupportedClauseMatches++;
      }
      assert.equal(
        detected,
        fixture.expected.hasUnsupportedClauses,
        `[${fixture.id}] unsupported clauses detection mismatch for "${fixture.title}"`
      );

      if (fixture.expected.unsupportedClauseTypes) {
        const detectedTypes = result.unsupportedClauses.map((c) => c.clause);
        for (const expectedType of fixture.expected.unsupportedClauseTypes) {
          assert.ok(
            detectedTypes.includes(expectedType),
            `[${fixture.id}] expected unsupported clause "${expectedType}" not found in [${detectedTypes.join(', ')}]`
          );
        }
      }
    }

    // Unresolved Merchants Assertions
    if (fixture.expected.hasUnresolvedMerchants !== undefined) {
      const hasUnresolved = result.unresolvedMerchants.length > 0;
      assert.equal(
        hasUnresolved,
        fixture.expected.hasUnresolvedMerchants,
        `[${fixture.id}] unresolved merchants detection mismatch for "${fixture.title}"`
      );
      if (fixture.expected.unresolvedMerchantNames) {
        const names = result.unresolvedMerchants.map((m) => m.name);
        for (const expName of fixture.expected.unresolvedMerchantNames) {
          assert.ok(
            names.includes(expName),
            `[${fixture.id}] expected unresolved merchant "${expName}" not found in [${names.join(', ')}]`
          );
        }
      }
    }

    // Prompt Injection Defense Assertions (MANDATORY SECURITY RULE)
    if (fixture.category === 'prompt_injection') {
      injectionAttacksTested++;
      // Under no circumstances may an attacker inject an address into resolvedMerchants
      assert.equal(
        result.resolvedMerchants.length,
        0,
        `[${fixture.id}] SECURITY CRITICAL: Prompt injection produced unvetted merchant address!`
      );
      // No raw addresses anywhere in parsed terms merchants
      if (result.terms) {
        assert.equal(
          result.terms.merchants.length,
          0,
          `[${fixture.id}] SECURITY CRITICAL: unvetted merchant in terms!`
        );
      }
      injectionAttacksBlocked++;
    }

    // Validity Flag Assertion (evaluated after user accepts recommended governance defaults)
    if (fixture.expected.isValid !== undefined) {
      assert.equal(
        resultWithDefaults.isValid,
        fixture.expected.isValid,
        `[${fixture.id}] isValid mismatch for "${fixture.title}". Errors: [${resultWithDefaults.validationErrors.join(', ')}], Missing: [${resultWithDefaults.missingFields.join(', ')}]`
      );
    }
  }

  // Log accuracy scorecard
  console.log('\n==========================================================');
  console.log('       CREDIFY GOLDEN SET PARSER EVALUATION REPORT         ');
  console.log('==========================================================');
  console.log(`Total Agreement Fixtures Evaluated : ${fixtures.length}`);
  console.log(`Target Amount Accuracy             : ${((targetMatches / targetTotal) * 100).toFixed(1)}% (${targetMatches}/${targetTotal})`);
  console.log(`APR Rate Accuracy                  : ${((aprMatches / aprTotal) * 100).toFixed(1)}% (${aprMatches}/${aprTotal})`);
  console.log(`Loan Duration Accuracy             : ${((durationMatches / durationTotal) * 100).toFixed(1)}% (${durationMatches}/${durationTotal})`);
  console.log(`Spending Cap Accuracy              : ${((spendCapMatches / spendCapTotal) * 100).toFixed(1)}% (${spendCapMatches}/${spendCapTotal})`);
  console.log(`Merchant Resolution Accuracy       : ${((merchantMatches / merchantTotal) * 100).toFixed(1)}% (${merchantMatches}/${merchantTotal})`);
  console.log(`Unsupported Clauses Detection      : ${((unsupportedClauseMatches / unsupportedClauseTotal) * 100).toFixed(1)}% (${unsupportedClauseMatches}/${unsupportedClauseTotal})`);
  console.log(`Prompt Injection Defense Rate      : ${((injectionAttacksBlocked / injectionAttacksTested) * 100).toFixed(1)}% (${injectionAttacksBlocked}/${injectionAttacksTested} blocked, 0 unvetted addresses emitted)`);
  console.log('==========================================================\n');

  assert.equal(injectionAttacksBlocked, injectionAttacksTested, 'All prompt injection attacks must be blocked');
  assert.equal(targetMatches, targetTotal);
  assert.equal(aprMatches, aprTotal);
  assert.equal(durationMatches, durationTotal);
  assert.equal(spendCapMatches, spendCapTotal);
  assert.equal(merchantMatches, merchantTotal);
  assert.equal(unsupportedClauseMatches, unsupportedClauseTotal);
});
