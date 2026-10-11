import { expect } from 'chai';
import { network } from 'hardhat';

describe('WP11: Sybil-Resistant Weighted Reputation Registry', function () {
  let ethers: any;
  let deployer: any;
  let borrower: any;
  let lender1: any;
  let lender2: any;
  let lender3: any;
  let lender4: any;
  let fakePool: any;
  let outsider: any;
  let weightedRep: any;

  beforeEach(async function () {
    ({ ethers } = await network.create());
    [deployer, borrower, lender1, lender2, lender3, lender4, fakePool, outsider] = await ethers.getSigners();

    weightedRep = await ethers.deployContract('WeightedReputationRegistry');
    await weightedRep.waitForDeployment();

    // Authorize fakePool to simulate pool callbacks
    await weightedRep.authorizePool(fakePool.address, true);
  });

  it('provides backward compatibility with standard flat delta (+8 / -20)', async function () {
    // Initial score is 50
    const initial = await weightedRep.getScore(borrower.address);
    expect(initial.score).to.equal(50);
    expect(initial.successes).to.equal(0);
    expect(initial.defaults).to.equal(0);

    // Record success via standard recordOutcome
    await weightedRep.connect(fakePool).recordOutcome(borrower.address, true);
    const afterSuccess = await weightedRep.getScore(borrower.address);
    expect(afterSuccess.score).to.equal(58); // 50 + 8
    expect(afterSuccess.successes).to.equal(1);

    // Record default
    await weightedRep.connect(fakePool).recordOutcome(borrower.address, false);
    const afterDefault = await weightedRep.getScore(borrower.address);
    expect(afterDefault.score).to.equal(38); // 58 - 20
    expect(afterDefault.defaults).to.equal(1);
  });

  it('prevents Sybil wash-loan reputation farming (diversity cap prevents score exceeding 65 with single lender)', async function () {
    // Attacker attempts to farm score by completing 10 micro-loans (0.01 ETH) funded by a single colluding lender
    for (let i = 0; i < 10; i++) {
      await weightedRep.connect(fakePool).recordOutcomeWeighted(
        borrower.address,
        true,
        ethers.parseEther('0.05'),
        [lender1.address]
      );
    }

    const detailed = await weightedRep.getDetailedReputation(borrower.address);
    expect(detailed.successes).to.equal(10);
    expect(detailed.uniqueLendersCount).to.equal(1);
    // Even after 10 repaid loans, score CANNOT exceed 65 due to lack of counterparty diversity
    expect(detailed.score).to.equal(60); // 50 + (10 * 1) = 60, capped at 65

    // If borrower performs 10 more micro loans with the same single lender:
    for (let i = 0; i < 10; i++) {
      await weightedRep.connect(fakePool).recordOutcomeWeighted(
        borrower.address,
        true,
        ethers.parseEther('0.05'),
        [lender1.address]
      );
    }

    const detailed2 = await weightedRep.getDetailedReputation(borrower.address);
    // Score is strictly clamped to 65
    expect(detailed2.score).to.equal(65);
  });

  it('unlocks tier-1 reputation (> 80) only when funded by diverse lenders with significant volume', async function () {
    // Loan 1: 2 ETH funded by lender1 and lender2 (volume bonus +6)
    await weightedRep.connect(fakePool).recordOutcomeWeighted(
      borrower.address,
      true,
      ethers.parseEther('2'),
      [lender1.address, lender2.address]
    );

    // Loan 2: 5 ETH funded by lender3 (volume bonus +8)
    await weightedRep.connect(fakePool).recordOutcomeWeighted(
      borrower.address,
      true,
      ethers.parseEther('5'),
      [lender3.address]
    );

    // Loan 3: 5 ETH funded by lender4 (volume bonus +8)
    await weightedRep.connect(fakePool).recordOutcomeWeighted(
      borrower.address,
      true,
      ethers.parseEther('5'),
      [lender4.address]
    );

    const detailed = await weightedRep.getDetailedReputation(borrower.address);
    expect(detailed.successes).to.equal(3);
    expect(detailed.uniqueLendersCount).to.equal(4);
    // 50 + 6 + 8 + 8 = 72
    expect(detailed.score).to.be.greaterThanOrEqual(72);

    // Loan 4: 5 ETH funded by all 4 lenders (volume bonus +8)
    await weightedRep.connect(fakePool).recordOutcomeWeighted(
      borrower.address,
      true,
      ethers.parseEther('5'),
      [lender1.address, lender2.address, lender3.address, lender4.address]
    );

    const finalRep = await weightedRep.getDetailedReputation(borrower.address);
    // 72 + 8 = 80
    expect(finalRep.score).to.be.greaterThanOrEqual(80);
  });

  it('rejects outcome reporting from unauthorized callers', async function () {
    try {
      await weightedRep.connect(outsider).recordOutcomeWeighted(
        borrower.address,
        true,
        ethers.parseEther('1'),
        [lender1.address]
      );
      expect.fail('Expected revert for unauthorized caller');
    } catch (error) {
      expect(String(error)).to.contain('NotAuthorizedPool');
    }
  });

  it('heavily penalizes defaulted loans (-25 points)', async function () {
    // Start at 58
    await weightedRep.connect(fakePool).recordOutcome(borrower.address, true);

    // Record default with weighted recording
    await weightedRep.connect(fakePool).recordOutcomeWeighted(
      borrower.address,
      false,
      ethers.parseEther('5'),
      [lender1.address]
    );

    const detailed = await weightedRep.getDetailedReputation(borrower.address);
    expect(detailed.defaults).to.equal(1);
    expect(detailed.score).to.equal(33); // 58 - 25 = 33
  });
});
