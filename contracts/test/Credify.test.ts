import { expect } from 'chai';
import { network } from 'hardhat';

async function expectRevert(action: () => Promise<unknown>, token: string) {
  try {
    await action();
    expect.fail(`Expected revert containing ${token}`);
  } catch (error) {
    expect(String(error)).to.contain(token);
  }
}

describe('Credify protocol', function () {
  let ethers: any;
  let kyc: any;
  let reputation: any;
  let factory: any;
  let pool: any;
  let borrower: any;
  let lenderA: any;
  let lenderB: any;
  let lenderC: any;
  let merchantA: any;
  let outsider: any;

  beforeEach(async function () {
    ({ ethers } = await network.create());
    [, borrower, lenderA, lenderB, lenderC, merchantA, outsider] = await ethers.getSigners();

    kyc = await ethers.deployContract('KYCRegistry');
    await kyc.waitForDeployment();
    reputation = await ethers.deployContract('ReputationRegistry');
    await reputation.waitForDeployment();
    factory = await ethers.deployContract('LoanFactory', [await kyc.getAddress(), await reputation.getAddress()]);
    await factory.waitForDeployment();
    await reputation.transferOwnership(await factory.getAddress());

    for (const [i, s] of [borrower, lenderA, lenderB, lenderC].entries()) {
      await kyc.setVerified(s.address, true, ethers.id(`test:${i}`));
    }

    await (await factory.createLoan(
      borrower.address,
      ethers.parseEther('10'),
      14 * 24 * 60 * 60,
      800,
      ethers.parseEther('8'),
      5001,
      [merchantA.address]
    )).wait();
    const pools = await factory.getPools();
    pool = await ethers.getContractAt('LoanPool', pools[0]);
  });

  it('instantiates a parameterized pool and authorizes it in reputation', async function () {
    expect(await pool.borrower()).to.equal(borrower.address);
    expect(await pool.targetWei()).to.equal(ethers.parseEther('10'));
    expect(await reputation.authorizedPools(await pool.getAddress())).to.equal(true);
  });

  it('rejects unverified lender and activates exactly at target', async function () {
    await expectRevert(() => pool.connect(outsider).contribute({ value: ethers.parseEther('1') }), 'NotVerifiedLender');
    await (await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') })).wait();
    expect(await pool.status()).to.equal(0);
    await (await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') })).wait();
    expect(await pool.status()).to.equal(1);
  });

  it('rejects borrower attempting to contribute to their own syndicate pool', async function () {
    await expectRevert(() => pool.connect(borrower).contribute({ value: ethers.parseEther('1') }), 'BorrowerCannotContribute');
  });

  it('activates contract through incremental multi-lender contributions (4 ETH -> 7 ETH -> 10 ETH -> ACTIVE)', async function () {
    // 1. Lender A contributes 4 ETH
    const txA = await pool.connect(lenderA).contribute({ value: ethers.parseEther('4') });
    await txA.wait();
    expect(await pool.totalContributed()).to.equal(ethers.parseEther('4'));
    expect(await pool.status()).to.equal(0); // Status.Funding

    // 2. Lender B contributes 3 ETH (total 7 ETH)
    const txB = await pool.connect(lenderB).contribute({ value: ethers.parseEther('3') });
    await txB.wait();
    expect(await pool.totalContributed()).to.equal(ethers.parseEther('7'));
    expect(await pool.status()).to.equal(0); // Still Status.Funding

    // 3. Lender C contributes remaining 3 ETH (total 10 ETH = target reached)
    const txC = await pool.connect(lenderC).contribute({ value: ethers.parseEther('3') });
    const receiptC = await txC.wait();
    expect(await pool.totalContributed()).to.equal(ethers.parseEther('10'));
    expect(await pool.status()).to.equal(1); // Status.Active!

    // Verify all 3 independent lenders' recorded positions
    expect(await pool.contributed(lenderA.address)).to.equal(ethers.parseEther('4'));
    expect(await pool.contributed(lenderB.address)).to.equal(ethers.parseEther('3'));
    expect(await pool.contributed(lenderC.address)).to.equal(ethers.parseEther('3'));

    // Verify further contributions are closed
    await expectRevert(() => pool.connect(lenderA).contribute({ value: ethers.parseEther('1') }), 'FundingClosed');
  });

  it('enforces merchant restrictions and spend limits on-chain', async function () {
    // 1. Spending before pool is active is rejected
    await expectRevert(() => pool.connect(borrower).spend(merchantA.address, ethers.parseEther('1'), ethers.id('equipment')), 'NotActive');

    // Fund to target (10 ETH) to activate
    await (await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') })).wait();
    await (await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') })).wait();
    expect(await pool.status()).to.equal(1); // Active

    // 2. Spending by non-borrower is rejected
    await expectRevert(() => pool.connect(outsider).spend(merchantA.address, ethers.parseEther('1'), ethers.id('equipment')), 'NotBorrower');
    await expectRevert(() => pool.connect(lenderA).spend(merchantA.address, ethers.parseEther('1'), ethers.id('equipment')), 'NotBorrower');

    // 3. Spending to unapproved merchant is rejected
    await expectRevert(() => pool.connect(borrower).spend(outsider.address, ethers.parseEther('1'), ethers.id('equipment')), 'MerchantNotApproved');

    // 4. Valid supplier payment succeeds (funds delivered directly to merchant, totalSpent updated)
    const merchantBalanceBefore = await ethers.provider.getBalance(merchantA.address);
    const spendTx = await pool.connect(borrower).spend(merchantA.address, ethers.parseEther('2'), ethers.id('equipment'));
    await spendTx.wait();
    expect(await pool.totalSpent()).to.equal(ethers.parseEther('2'));
    const merchantBalanceAfter = await ethers.provider.getBalance(merchantA.address);
    expect(merchantBalanceAfter - merchantBalanceBefore).to.equal(ethers.parseEther('2'));

    // 5. Overspending beyond maxSpend (maxSpend is 8 ETH, 2 spent, 6 remaining)
    // Attempting to spend 7 ETH exceeds the 6 ETH remaining capacity and reverts
    await expectRevert(() => pool.connect(borrower).spend(merchantA.address, ethers.parseEther('7'), ethers.id('materials')), 'SpendLimitExceeded');

    // 6. Valid payment within remaining capacity succeeds
    await (await pool.connect(borrower).spend(merchantA.address, ethers.parseEther('6'), ethers.id('materials'))).wait();
    expect(await pool.totalSpent()).to.equal(ethers.parseEther('8'));

    // 7. Further spending reverts since all 8 ETH of spend limit is utilized
    await expectRevert(() => pool.connect(borrower).spend(merchantA.address, ethers.parseEther('0.1'), ethers.id('materials')), 'SpendLimitExceeded');
  });

  it('tracks repayments and distributes claims pro-rata', async function () {
    // Fund to target (10 ETH)
    await (await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') })).wait();
    await (await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') })).wait();
    expect(await pool.status()).to.equal(1); // Status.Active

    // 1. Non-borrower repayment is rejected
    await expectRevert(() => pool.connect(lenderA).repay({ value: ethers.parseEther('1') }), 'NotBorrower');
    await expectRevert(() => pool.connect(outsider).repay({ value: ethers.parseEther('1') }), 'NotBorrower');

    // Total repayable is 10 ETH + 8% APR = 10.8 ETH
    expect(await pool.totalRepayable()).to.equal(ethers.parseEther('10.8'));

    // 2. Partial repayment: borrower repays 5.4 ETH (50%)
    const partialTx = await pool.connect(borrower).repay({ value: ethers.parseEther('5.4') });
    await partialTx.wait();
    expect(await pool.totalRepaid()).to.equal(ethers.parseEther('5.4'));
    expect(await pool.status()).to.equal(1); // Remains Status.Active

    // Pro-rata claimable checks (Lender A has 60% = 3.24 ETH, Lender B has 40% = 2.16 ETH)
    const [, aClaimable] = await pool.getLenderInfo(lenderA.address);
    const [, bClaimable] = await pool.getLenderInfo(lenderB.address);
    expect(aClaimable).to.equal(ethers.parseEther('3.24'));
    expect(bClaimable).to.equal(ethers.parseEther('2.16'));

    // 3. Over-repayment rejection: remaining debt is 5.4 ETH, attempting 5.5 ETH reverts
    await expectRevert(() => pool.connect(borrower).repay({ value: ethers.parseEther('5.5') }), 'RepaymentTooLarge');
    await expectRevert(() => pool.connect(borrower).repay({ value: 0 }), 'RepaymentTooLarge');

    // Lenders claim their pro-rata shares
    await (await pool.connect(lenderA).claimRepayment()).wait();
    await (await pool.connect(lenderB).claimRepayment()).wait();

    // 4. Complete repayment: borrower repays remaining 5.4 ETH (100%)
    const completeTx = await pool.connect(borrower).repay({ value: ethers.parseEther('5.4') });
    await completeTx.wait();
    expect(await pool.totalRepaid()).to.equal(ethers.parseEther('10.8'));
    expect(await pool.status()).to.equal(2); // Status.Repaid

    // 5. Reputation boost recorded
    const [score, successes, defaults] = await reputation.getScore(borrower.address);
    expect(score).to.equal(58);
    expect(successes).to.equal(1);
    expect(defaults).to.equal(0);

    // 6. Further repayment on repaid agreement reverts
    await expectRevert(() => pool.connect(borrower).repay({ value: ethers.parseEther('1') }), 'NotActive');
  });

  it('guarantees three lenders with different contribution amounts receive correctly proportional claims', async function () {
    // 1. Three lenders fund pool with distinct amounts (5 ETH = 50%, 3 ETH = 30%, 2 ETH = 20%)
    await (await pool.connect(lenderA).contribute({ value: ethers.parseEther('5') })).wait();
    await (await pool.connect(lenderB).contribute({ value: ethers.parseEther('3') })).wait();
    await (await pool.connect(lenderC).contribute({ value: ethers.parseEther('2') })).wait();
    expect(await pool.status()).to.equal(1); // Status.Active
    expect(await pool.totalContributed()).to.equal(ethers.parseEther('10'));

    // Non-contributor outsider cannot claim
    await expectRevert(() => pool.connect(outsider).claimRepayment(), 'NothingToClaim');

    // 2. Borrower makes 50% partial repayment: 5.4 ETH on 10.8 ETH total repayable
    await (await pool.connect(borrower).repay({ value: ethers.parseEther('5.4') })).wait();

    // Verify proportional claimable entitlements on partial repayment:
    // Lender A (50%): 2.70 ETH
    // Lender B (30%): 1.62 ETH
    // Lender C (20%): 1.08 ETH
    const [, aPartClaimable] = await pool.getLenderInfo(lenderA.address);
    const [, bPartClaimable] = await pool.getLenderInfo(lenderB.address);
    const [, cPartClaimable] = await pool.getLenderInfo(lenderC.address);
    expect(aPartClaimable).to.equal(ethers.parseEther('2.7'));
    expect(bPartClaimable).to.equal(ethers.parseEther('1.62'));
    expect(cPartClaimable).to.equal(ethers.parseEther('1.08'));

    // 3. Lender A claims partial repayment
    const aBalBefore = await ethers.provider.getBalance(lenderA.address);
    const aTx = await pool.connect(lenderA).claimRepayment();
    const aReceipt = await aTx.wait();
    const aGasCost = aReceipt.gasUsed * aReceipt.gasPrice;
    const aBalAfter = await ethers.provider.getBalance(lenderA.address);
    expect(aBalAfter + aGasCost - aBalBefore).to.equal(ethers.parseEther('2.7'));
    expect(await pool.claimed(lenderA.address)).to.equal(ethers.parseEther('2.7'));

    // Immediate re-claim by Lender A reverts
    await expectRevert(() => pool.connect(lenderA).claimRepayment(), 'NothingToClaim');

    // 4. Borrower makes remaining repayment (5.4 ETH) -> Status transitions to Repaid
    await (await pool.connect(borrower).repay({ value: ethers.parseEther('5.4') })).wait();
    expect(await pool.status()).to.equal(2); // Status.Repaid
    expect(await pool.totalRepaid()).to.equal(ethers.parseEther('10.8'));

    // Updated claimable amounts:
    // Lender A (50% total 5.40 ETH - 2.70 ETH already claimed): 2.70 ETH
    // Lender B (30% total 3.24 ETH - 0 claimed): 3.24 ETH
    // Lender C (20% total 2.16 ETH - 0 claimed): 2.16 ETH
    const [, aFinalClaimable] = await pool.getLenderInfo(lenderA.address);
    const [, bFinalClaimable] = await pool.getLenderInfo(lenderB.address);
    const [, cFinalClaimable] = await pool.getLenderInfo(lenderC.address);
    expect(aFinalClaimable).to.equal(ethers.parseEther('2.7'));
    expect(bFinalClaimable).to.equal(ethers.parseEther('3.24'));
    expect(cFinalClaimable).to.equal(ethers.parseEther('2.16'));

    // 5. All three lenders pull their remaining claims
    await (await pool.connect(lenderA).claimRepayment()).wait();
    await (await pool.connect(lenderB).claimRepayment()).wait();
    await (await pool.connect(lenderC).claimRepayment()).wait();

    // Verify exact proportional lifetime claims:
    expect(await pool.claimed(lenderA.address)).to.equal(ethers.parseEther('5.4'));  // 50%
    expect(await pool.claimed(lenderB.address)).to.equal(ethers.parseEther('3.24')); // 30%
    expect(await pool.claimed(lenderC.address)).to.equal(ethers.parseEther('2.16')); // 20%

    // Total claims equal total debt repaid
    const totalClaimed = (await pool.claimed(lenderA.address)) +
                         (await pool.claimed(lenderB.address)) +
                         (await pool.claimed(lenderC.address));
    expect(totalClaimed).to.equal(ethers.parseEther('10.8'));

    // All lenders have 0 remaining claimable
    const [, aZero] = await pool.getLenderInfo(lenderA.address);
    const [, bZero] = await pool.getLenderInfo(lenderB.address);
    const [, cZero] = await pool.getLenderInfo(lenderC.address);
    expect(aZero).to.equal(0);
    expect(bZero).to.equal(0);
    expect(cZero).to.equal(0);

    // Any further claim attempts revert
    await expectRevert(() => pool.connect(lenderA).claimRepayment(), 'NothingToClaim');
    await expectRevert(() => pool.connect(lenderB).claimRepayment(), 'NothingToClaim');
    await expectRevert(() => pool.connect(lenderC).claimRepayment(), 'NothingToClaim');
  });

  it('requires a contributed-weighted majority for default', async function () {
    // 1. Fund the pool with 3 lenders (40%, 30%, 30%)
    await (await pool.connect(lenderA).contribute({ value: ethers.parseEther('4') })).wait();
    await (await pool.connect(lenderB).contribute({ value: ethers.parseEther('3') })).wait();
    await (await pool.connect(lenderC).contribute({ value: ethers.parseEther('3') })).wait();
    expect(await pool.status()).to.equal(1); // Status.Active

    // 2. Voting before maturity is rejected
    await expectRevert(() => pool.connect(lenderA).voteDefault(), 'MaturityNotReached');

    // 3. Fast-forward past maturity (duration is 14 days)
    await ethers.provider.send('evm_increaseTime', [15 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);

    // 4. Non-contributor voting is rejected
    await expectRevert(() => pool.connect(outsider).voteDefault(), 'NotVerifiedLender');

    // 5. Check initial voting state: total weight 0, threshold 5.001 ETH
    expect(await pool.defaultVoteWeight()).to.equal(0);
    const [, , , , , , , voteWeight, threshold] = await pool.getSummary();
    expect(voteWeight).to.equal(0);
    expect(threshold).to.equal(ethers.parseEther('5.001')); // 10 ETH * 5001 / 10000

    // 6. Insufficient vote: Lender B votes (3.0 ETH = 30% of pool)
    const txVoteB = await pool.connect(lenderB).voteDefault();
    await txVoteB.wait();
    expect(await pool.defaultVoteWeight()).to.equal(ethers.parseEther('3'));
    expect(await pool.hasDefaultVoted(lenderB.address)).to.equal(true);
    expect(await pool.hasDefaultVoted(lenderA.address)).to.equal(false);
    expect(await pool.hasDefaultVoted(lenderC.address)).to.equal(false);
    const [, , bVoted] = await pool.getLenderInfo(lenderB.address);
    expect(bVoted).to.equal(true);
    // Insufficient weight: status remains ACTIVE (1)
    expect(await pool.status()).to.equal(1);

    // 7. Duplicate vote attempt is rejected
    await expectRevert(() => pool.connect(lenderB).voteDefault(), 'AlreadyVoted');

    // 8. Threshold-crossing vote: Lender A votes (4.0 ETH = 40% of pool)
    // Combined weight: 3.0 + 4.0 = 7.0 ETH > 5.001 ETH threshold
    const txVoteA = await pool.connect(lenderA).voteDefault();
    await txVoteA.wait();
    expect(await pool.defaultVoteWeight()).to.equal(ethers.parseEther('7'));
    expect(await pool.hasDefaultVoted(lenderA.address)).to.equal(true);
    // Threshold reached: status transitions to DEFAULTED (3)
    expect(await pool.status()).to.equal(3);

    // 9. Borrower reputation registry penalty is recorded
    const [score, successful, defaults] = await reputation.getScore(borrower.address);
    expect(score).to.equal(30); // Base 50 - 20 = 30
    expect(successful).to.equal(0);
    expect(defaults).to.equal(1);

    // 10. Further votes on defaulted pool are rejected
    await expectRevert(() => pool.connect(lenderC).voteDefault(), 'NotActive');
  });

  it('expires underfunded pools and returns contributions', async function () {
    await (await pool.connect(lenderA).contribute({ value: ethers.parseEther('4') })).wait();
    const before = await ethers.provider.getBalance(lenderA.address);
    await ethers.provider.send('evm_increaseTime', [15 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);
    await (await pool.connect(lenderC).cancelUnfunded()).wait();
    expect(await pool.status()).to.equal(4);
    const tx = await pool.connect(lenderA).claimFundingRefund();
    await tx.wait();
    const after = await ethers.provider.getBalance(lenderA.address);
    expect(after).to.be.greaterThan(before - ethers.parseEther('0.01'));
  });
});
