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
  let deployer: any;
  let kyc: any;
  let reputation: any;
  let factory: any;
  let pool: any;
  let borrower: any;
  let lenderA: any;
  let lenderB: any;
  let lenderC: any;
  let merchantA: any;
  let merchantB: any;
  let outsider: any;

  function defaultTerms(borrowerAddr: string, overrides: Partial<any> = {}) {
    return {
      borrower: borrowerAddr,
      targetWei: ethers.parseEther('10'),
      durationSeconds: 14 * 24 * 60 * 60,
      fundingDurationSeconds: 7 * 24 * 60 * 60,
      aprBps: 800,
      maxSpendWei: ethers.parseEther('8'),
      defaultQuorumBps: 5001,
      gracePeriodSeconds: 3 * 24 * 60 * 60,
      agreementHash: ethers.id('Credify Demo Agreement: 10 ETH, 14 days, 8% APR'),
      merchants: [merchantA.address],
      merchantCapsWei: [ethers.parseEther('8')],
      ...overrides
    };
  }

  beforeEach(async function () {
    ({ ethers } = await network.create());
    [deployer, borrower, lenderA, lenderB, lenderC, merchantA, merchantB, outsider] = await ethers.getSigners();

    kyc = await ethers.deployContract('KYCRegistry', [deployer.address, deployer.address]);
    await kyc.waitForDeployment();
    reputation = await ethers.deployContract('ReputationRegistry');
    await reputation.waitForDeployment();
    factory = await ethers.deployContract('LoanFactory', [await kyc.getAddress(), await reputation.getAddress()]);
    await factory.waitForDeployment();
    await reputation.transferOwnership(await factory.getAddress());

    const Role = { None: 0, Borrower: 1, Lender: 2, Supplier: 3 };
    const oneYear = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

    await kyc.setVerified(borrower.address, Role.Borrower, true, oneYear, ethers.id('test:borrower'));
    for (const [i, s] of [lenderA, lenderB, lenderC].entries()) {
      await kyc.setVerified(s.address, Role.Lender, true, oneYear, ethers.id(`test:lender:${i}`));
    }
    for (const [i, s] of [merchantA, merchantB].entries()) {
      await kyc.setVerified(s.address, Role.Supplier, true, oneYear, ethers.id(`test:merchant:${i}`));
    }

    const terms = defaultTerms(borrower.address);
    const tx = await factory.connect(borrower).createLoan(terms);
    await tx.wait();

    const pools = await factory.getPools();
    pool = await ethers.getContractAt('LoanPool', pools[0]);
  });

  it('instantiates a parameterized pool and authorizes it in reputation', async function () {
    expect(await pool.borrower()).to.equal(borrower.address);
    expect(await pool.targetWei()).to.equal(ethers.parseEther('10'));
    expect(await pool.fundingDeadline()).to.be.gt(0);
    expect(await pool.maturity()).to.equal(0); // Maturity is set only on activation
    expect(await pool.agreementHash()).to.equal(ethers.id('Credify Demo Agreement: 10 ETH, 14 days, 8% APR'));
    expect(await reputation.authorizedPools(await pool.getAddress())).to.equal(true);
  });

  it('rejects unverified lender and activates exactly at target', async function () {
    await expectRevert(() => pool.connect(outsider).contribute({ value: ethers.parseEther('1') }), 'NotVerifiedLender');
    await (await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') })).wait();
    expect(await pool.status()).to.equal(0);
    expect(await pool.maturity()).to.equal(0);

    const activateTx = await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') });
    await activateTx.wait();
    expect(await pool.status()).to.equal(1);
    expect(await pool.maturity()).to.be.gt(0);
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
    await txC.wait();
    expect(await pool.totalContributed()).to.equal(ethers.parseEther('10'));
    expect(await pool.status()).to.equal(1); // Status.Active!

    // Verify all 3 independent lenders recorded positions
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

    // 4. Valid supplier payment succeeds
    const merchantBalanceBefore = await ethers.provider.getBalance(merchantA.address);
    const spendTx = await pool.connect(borrower).spend(merchantA.address, ethers.parseEther('2'), ethers.id('equipment'));
    await spendTx.wait();
    expect(await pool.totalSpent()).to.equal(ethers.parseEther('2'));
    const merchantBalanceAfter = await ethers.provider.getBalance(merchantA.address);
    expect(merchantBalanceAfter - merchantBalanceBefore).to.equal(ethers.parseEther('2'));

    // 5. Overspending beyond maxSpend (maxSpend is 8 ETH, 2 spent, 6 remaining)
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
    // Note: since 0 ETH was spent, unspent principal is 10 ETH. Distributable = 10.8 + 10 = 20.8 ETH.
    await (await pool.connect(borrower).repay({ value: ethers.parseEther('5.4') })).wait();
    expect(await pool.status()).to.equal(2); // Status.Repaid
    expect(await pool.totalRepaid()).to.equal(ethers.parseEther('10.8'));

    // Updated claimable amounts including unspent principal (20.8 total):
    // Lender A (50% of 20.8 = 10.4 - 2.7 claimed): 7.7 ETH
    // Lender B (30% of 20.8 = 6.24 - 0 claimed): 6.24 ETH
    // Lender C (20% of 20.8 = 4.16 - 0 claimed): 4.16 ETH
    const [, aFinalClaimable] = await pool.getLenderInfo(lenderA.address);
    const [, bFinalClaimable] = await pool.getLenderInfo(lenderB.address);
    const [, cFinalClaimable] = await pool.getLenderInfo(lenderC.address);
    expect(aFinalClaimable).to.equal(ethers.parseEther('7.7'));
    expect(bFinalClaimable).to.equal(ethers.parseEther('6.24'));
    expect(cFinalClaimable).to.equal(ethers.parseEther('4.16'));

    // 5. All three lenders pull their remaining claims
    await (await pool.connect(lenderA).claimRepayment()).wait();
    await (await pool.connect(lenderB).claimRepayment()).wait();
    await (await pool.connect(lenderC).claimRepayment()).wait();

    // Verify exact lifetime claims (total 20.8 ETH):
    expect(await pool.claimed(lenderA.address)).to.equal(ethers.parseEther('10.4')); // 50%
    expect(await pool.claimed(lenderB.address)).to.equal(ethers.parseEther('6.24')); // 30%
    expect(await pool.claimed(lenderC.address)).to.equal(ethers.parseEther('4.16')); // 20%

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

  it('requires a contributed-weighted majority for default after grace period', async function () {
    // 1. Fund the pool with 3 lenders (40%, 30%, 30%)
    await (await pool.connect(lenderA).contribute({ value: ethers.parseEther('4') })).wait();
    await (await pool.connect(lenderB).contribute({ value: ethers.parseEther('3') })).wait();
    await (await pool.connect(lenderC).contribute({ value: ethers.parseEther('3') })).wait();
    expect(await pool.status()).to.equal(1); // Status.Active

    // 2. Voting before maturity is rejected
    await expectRevert(() => pool.connect(lenderA).voteDefault(), 'MaturityNotReached');

    // 3. Fast-forward past maturity (14 days) but before grace period (3 days) -> still rejected
    await ethers.provider.send('evm_increaseTime', [15 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);
    await expectRevert(() => pool.connect(lenderA).voteDefault(), 'MaturityNotReached');

    // 4. Fast-forward past maturity + grace period (total > 17 days)
    await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);

    // 5. Non-contributor voting is rejected with NotLender
    await expectRevert(() => pool.connect(outsider).voteDefault(), 'NotLender');

    // 6. Check initial voting state: total weight 0, threshold 5.001 ETH
    expect(await pool.defaultVoteWeight()).to.equal(0);
    const summary = await pool.getSummary();
    expect(summary._defaultVoteWeight).to.equal(0);
    expect(summary._defaultThreshold).to.equal(ethers.parseEther('5.001'));

    // 7. Insufficient vote: Lender B votes (3.0 ETH = 30% of pool)
    const txVoteB = await pool.connect(lenderB).voteDefault();
    await txVoteB.wait();
    expect(await pool.defaultVoteWeight()).to.equal(ethers.parseEther('3'));
    expect(await pool.hasDefaultVoted(lenderB.address)).to.equal(true);
    expect(await pool.status()).to.equal(1); // Remains Active

    // 8. Duplicate vote attempt is rejected
    await expectRevert(() => pool.connect(lenderB).voteDefault(), 'AlreadyVoted');

    // 9. Threshold-crossing vote: Lender A votes (4.0 ETH = 40% of pool -> combined 7.0 ETH > 5.001 ETH)
    const txVoteA = await pool.connect(lenderA).voteDefault();
    await txVoteA.wait();
    expect(await pool.defaultVoteWeight()).to.equal(ethers.parseEther('7'));
    expect(await pool.status()).to.equal(3); // Status.Defaulted

    // 10. Borrower reputation registry penalty is recorded
    const [score, successful, defaults] = await reputation.getScore(borrower.address);
    expect(score).to.equal(30);
    expect(successful).to.equal(0);
    expect(defaults).to.equal(1);

    // 11. Further votes on defaulted pool are rejected
    await expectRevert(() => pool.connect(lenderC).voteDefault(), 'NotActive');
  });

  it('expires underfunded pools and returns contributions', async function () {
    await (await pool.connect(lenderA).contribute({ value: ethers.parseEther('4') })).wait();
    const before = await ethers.provider.getBalance(lenderA.address);
    // Fast forward past fundingDeadline (7 days)
    await ethers.provider.send('evm_increaseTime', [8 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);
    await (await pool.connect(lenderC).cancelUnfunded()).wait();
    expect(await pool.status()).to.equal(4); // Cancelled
    const tx = await pool.connect(lenderA).claimFundingRefund();
    await tx.wait();
    const after = await ethers.provider.getBalance(lenderA.address);
    expect(after).to.be.greaterThan(before - ethers.parseEther('0.01'));
  });

  it('enforces cancelUnfunded timing, refund path, double refund, and event emission', async function () {
    await pool.connect(lenderA).contribute({ value: ethers.parseEther('4') });

    // 1. cancelUnfunded before fundingDeadline reverts with FundingNotExpired
    await expectRevert(() => pool.cancelUnfunded(), 'FundingNotExpired');

    // 2. Fast-forward past fundingDeadline (7 days)
    await ethers.provider.send('evm_increaseTime', [8 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);

    // 3. cancelUnfunded succeeds, transitions to Cancelled (4), and emits FundingCancelled
    const cancelTx = await pool.connect(lenderA).cancelUnfunded();
    await expect(cancelTx).to.emit(pool, 'FundingCancelled');
    expect(await pool.status()).to.equal(4);

    // 4. Calling cancelUnfunded when already Cancelled reverts with FundingClosed
    await expectRevert(() => pool.cancelUnfunded(), 'FundingClosed');

    // 5. Non-contributor claiming refund reverts with NothingToClaim
    await expectRevert(() => pool.connect(outsider).claimFundingRefund(), 'NothingToClaim');

    // 6. Valid refund claim transfers ETH and emits FundingRefunded
    const balBefore = await ethers.provider.getBalance(lenderA.address);
    const refundTx = await pool.connect(lenderA).claimFundingRefund();
    await expect(refundTx).to.emit(pool, 'FundingRefunded').withArgs(lenderA.address, ethers.parseEther('4'));
    const receipt = await refundTx.wait();
    const gas = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(lenderA.address);
    expect(balAfter + gas - balBefore).to.equal(ethers.parseEther('4'));
    expect(await pool.refunded(lenderA.address)).to.equal(true);

    // 7. Double refund attempt reverts with AlreadyRefunded
    await expectRevert(() => pool.connect(lenderA).claimFundingRefund(), 'AlreadyRefunded');
  });

  it('rejects double claim of repayment', async function () {
    // Fund pool to activate
    await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') });

    // Partial repayment of 5.4 ETH
    await pool.connect(borrower).repay({ value: ethers.parseEther('5.4') });

    // Lender A claims 3.24 ETH (60%)
    const claimTx = await pool.connect(lenderA).claimRepayment();
    await expect(claimTx).to.emit(pool, 'RepaymentClaimed').withArgs(lenderA.address, ethers.parseEther('3.24'));
    expect(await pool.claimed(lenderA.address)).to.equal(ethers.parseEther('3.24'));

    // Immediate second claim reverts with NothingToClaim
    await expectRevert(() => pool.connect(lenderA).claimRepayment(), 'NothingToClaim');
  });

  it('allows claiming pro-rata repayment share after loan defaults, and rejects zero/duplicate claim', async function () {
    // Fund pool: lender A (6 ETH = 60%), lender B (4 ETH = 40%)
    await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') });

    // Borrower spends 8 ETH (full maxSpend)
    await pool.connect(borrower).spend(merchantA.address, ethers.parseEther('8'), ethers.id('spend'));

    // Borrower repays 2 ETH partially before default
    await pool.connect(borrower).repay({ value: ethers.parseEther('2') });

    // Fast forward past maturity + grace period (14 + 3 = 17 days -> 18 days)
    await ethers.provider.send('evm_increaseTime', [18 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);

    // Lender A votes default (6 ETH > 5.001 ETH threshold -> triggers default)
    const defaultTx = await pool.connect(lenderA).voteDefault();
    await expect(defaultTx).to.emit(pool, 'LoanDefaulted');
    expect(await pool.status()).to.equal(3); // Status.Defaulted

    // In defaulted status, distributable = totalRepaid (2 ETH) + unspent principal (10 - 8 = 2 ETH) = 4 ETH
    // Lender A entitled = 4 * 60% = 2.4 ETH
    const claimTxA = await pool.connect(lenderA).claimRepayment();
    await expect(claimTxA).to.emit(pool, 'RepaymentClaimed').withArgs(lenderA.address, ethers.parseEther('2.4'));

    // Duplicate claim by Lender A reverts with NothingToClaim
    await expectRevert(() => pool.connect(lenderA).claimRepayment(), 'NothingToClaim');

    // Lender B claims pro-rata share (4 * 40% = 1.6 ETH)
    const claimTxB = await pool.connect(lenderB).claimRepayment();
    await expect(claimTxB).to.emit(pool, 'RepaymentClaimed').withArgs(lenderB.address, ethers.parseEther('1.6'));

    // Duplicate claim by Lender B reverts with NothingToClaim
    await expectRevert(() => pool.connect(lenderB).claimRepayment(), 'NothingToClaim');
  });

  it('reverts on each LoanFactory validation check with the expected custom error', async function () {
    // 1. Borrower not verified
    await expectRevert(
      () => factory.connect(outsider).createLoan(defaultTerms(outsider.address)),
      'BorrowerNotVerified'
    );

    // 2. Not borrower calling
    await expectRevert(
      () => factory.connect(outsider).createLoan(defaultTerms(borrower.address)),
      'NotBorrower'
    );

    // 3. targetWei == 0
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { targetWei: 0 })),
      'InvalidTarget'
    );

    // 4. durationSeconds < 300
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { durationSeconds: 299 })),
      'InvalidDuration'
    );

    // 5. durationSeconds > 365 days
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { durationSeconds: 366 * 24 * 60 * 60 })),
      'InvalidDuration'
    );

    // 6. fundingDurationSeconds < 300
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { fundingDurationSeconds: 200 })),
      'InvalidFundingWindow'
    );

    // 7. fundingDurationSeconds > 90 days
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { fundingDurationSeconds: 91 * 24 * 60 * 60 })),
      'InvalidFundingWindow'
    );

    // 8. aprBps > 5000
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { aprBps: 5001 })),
      'InvalidAPR'
    );

    // 9. maxSpendWei == 0
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { maxSpendWei: 0 })),
      'InvalidSpendLimit'
    );

    // 10. maxSpendWei > targetWei
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { maxSpendWei: ethers.parseEther('11') })),
      'InvalidSpendLimit'
    );

    // 11. defaultQuorumBps <= 5000
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { defaultQuorumBps: 5000 })),
      'InvalidQuorum'
    );

    // 12. defaultQuorumBps > 10000
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { defaultQuorumBps: 10001 })),
      'InvalidQuorum'
    );

    // 13. gracePeriodSeconds > 30 days
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { gracePeriodSeconds: 31 * 24 * 60 * 60 })),
      'InvalidGracePeriod'
    );

    // 14. merchants.length == 0
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { merchants: [], merchantCapsWei: [] })),
      'NoMerchants'
    );

    // 15. merchants.length > 10
    const manyMerchants = new Array(11).fill(merchantA.address);
    const manyCaps = new Array(11).fill(ethers.parseEther('0.5'));
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { merchants: manyMerchants, merchantCapsWei: manyCaps })),
      'TooManyMerchants'
    );

    // 16. MismatchedMerchants length
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { merchants: [merchantA.address], merchantCapsWei: [] })),
      'MismatchedMerchants'
    );

    // 17. ZeroMerchantAddress
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { merchants: [ethers.ZeroAddress], merchantCapsWei: [ethers.parseEther('8')] })),
      'ZeroMerchantAddress'
    );

    // 18. DuplicateMerchantAddress
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { merchants: [merchantA.address, merchantA.address], merchantCapsWei: [ethers.parseEther('4'), ethers.parseEther('4')] })),
      'DuplicateMerchantAddress'
    );

    // 19. InvalidMerchantCap (cap == 0)
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { merchants: [merchantA.address], merchantCapsWei: [0] })),
      'InvalidMerchantCap'
    );

    // 20. InvalidMerchantCap (cap > maxSpendWei)
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { merchants: [merchantA.address], merchantCapsWei: [ethers.parseEther('9')] })),
      'InvalidMerchantCap'
    );

    // 21. SupplierNotVerified (unverified merchant)
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { merchants: [outsider.address], merchantCapsWei: [ethers.parseEther('8')] })),
      'SupplierNotVerified'
    );

    // 22. SupplierNotVerified (merchant holding Lender role instead of Supplier role)
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address, { merchants: [lenderA.address], merchantCapsWei: [ethers.parseEther('8')] })),
      'SupplierNotVerified'
    );

    // 23. BorrowerNotVerified (borrower holding Lender role instead of Borrower role)
    await expectRevert(
      () => factory.connect(lenderA).createLoan(defaultTerms(lenderA.address, { merchants: [merchantA.address], merchantCapsWei: [ethers.parseEther('8')] })),
      'BorrowerNotVerified'
    );
  });

  it('rejects unauthorized caller in ReputationRegistry and accepts authorized pool with events', async function () {
    const freshReputation = await ethers.deployContract('ReputationRegistry');
    await freshReputation.waitForDeployment();

    // 1. Non-owner calling authorizePool reverts
    await expectRevert(
      () => freshReputation.connect(outsider).authorizePool(lenderA.address, true),
      'OwnableUnauthorizedAccount'
    );

    // 2. Caller not authorized in authorizedPools reverts with NotAuthorizedPool
    await expectRevert(
      () => freshReputation.connect(outsider).recordOutcome(borrower.address, true),
      'NotAuthorizedPool'
    );

    // 3. Owner authorizes an address and emits PoolAuthorized
    const authTx = await freshReputation.authorizePool(lenderA.address, true);
    await expect(authTx).to.emit(freshReputation, 'PoolAuthorized').withArgs(lenderA.address, true);
    expect(await freshReputation.authorizedPools(lenderA.address)).to.equal(true);

    // 4. Authorized caller records successful outcome, emits ReputationUpdated
    const recTx1 = await freshReputation.connect(lenderA).recordOutcome(borrower.address, true);
    await expect(recTx1).to.emit(freshReputation, 'ReputationUpdated').withArgs(borrower.address, true, 58, 1, 0);

    // 5. Authorized caller records default outcome
    const recTx2 = await freshReputation.connect(lenderA).recordOutcome(borrower.address, false);
    await expect(recTx2).to.emit(freshReputation, 'ReputationUpdated').withArgs(borrower.address, false, 38, 1, 1);
  });

  it('enforces AccessControl and role separation on KYCRegistry', async function () {
    const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('VERIFIER_ROLE'));
    const ref1 = ethers.id('credential-v1');
    const ref2 = ethers.id('credential-v2');
    const exp = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

    // 1. Non-verifier cannot call setVerified or revokeVerification
    await expectRevert(
      () => kyc.connect(outsider).setVerified(outsider.address, 2, true, exp, ref1),
      'AccessControlUnauthorizedAccount'
    );
    await expectRevert(
      () => kyc.connect(outsider).revokeVerification(borrower.address),
      'AccessControlUnauthorizedAccount'
    );

    // 2. DEFAULT_ADMIN_ROLE can grant VERIFIER_ROLE to outsider
    await kyc.grantRole(VERIFIER_ROLE, outsider.address);
    expect(await kyc.hasRole(VERIFIER_ROLE, outsider.address)).to.equal(true);

    // 3. Outsider can now verify accounts
    await kyc.connect(outsider).setVerified(outsider.address, 2, true, exp, ref1);
    expect(await kyc['isVerified(address,uint8)'](outsider.address, 2)).to.equal(true);

    // 4. Admin revokes VERIFIER_ROLE from outsider
    await kyc.revokeRole(VERIFIER_ROLE, outsider.address);
    await expectRevert(
      () => kyc.connect(outsider).setVerified(outsider.address, 2, true, exp, ref2),
      'AccessControlUnauthorizedAccount'
    );

    // 5. Role separation: verified as Lender (2), not Borrower (1) or Supplier (3)
    expect(await kyc['isVerified(address,uint8)'](outsider.address, 2)).to.equal(true);
    expect(await kyc['isVerified(address,uint8)'](outsider.address, 1)).to.equal(false);
    expect(await kyc['isVerified(address,uint8)'](outsider.address, 3)).to.equal(false);
    expect(await kyc['isVerified(address)'](outsider.address)).to.equal(true);

    // 6. Re-setting identical verification state and ref reverts with AddressAlreadyInState
    await expectRevert(
      () => kyc.setVerified(outsider.address, 2, true, exp, ref1),
      'AddressAlreadyInState'
    );

    // 7. Setting invalid role (Role.None = 0) reverts with InvalidRole
    await expectRevert(
      () => kyc.setVerified(outsider.address, 0, true, exp, ref2),
      'InvalidRole'
    );

    // 8. Setting invalid account (address(0)) reverts with InvalidAccount
    await expectRevert(
      () => kyc.setVerified(ethers.ZeroAddress, 2, true, exp, ref2),
      'InvalidAccount'
    );

    // 9. getRecord returns complete verification tuple
    const [rRole, rVerified, rExp, rHash] = await kyc.getRecord(outsider.address);
    expect(rRole).to.equal(2);
    expect(rVerified).to.equal(true);
    expect(rExp).to.equal(exp);
    expect(rHash).to.equal(ref1);

    // 10. setVerification convenience helper
    const ref3 = ethers.id('credential-v3');
    await kyc.setVerification(outsider.address, 3, exp + 100, ref3);
    expect(await kyc['isVerified(address,uint8)'](outsider.address, 3)).to.equal(true);

    // 11. setVerified with verified=false emits VerificationRevoked
    const setFalseTx = await kyc.setVerified(outsider.address, 3, false, exp + 100, ref3);
    await expect(setFalseTx).to.emit(kyc, 'VerificationRevoked');

    // 12. revokeVerification on address(0) reverts with InvalidAccount
    await expectRevert(() => kyc.revokeVerification(ethers.ZeroAddress), 'InvalidAccount');

    // 13. Constructor default deploy with (ZeroAddress, ZeroAddress) assigns deployer VERIFIER_ROLE
    const defaultKyc = await ethers.deployContract('KYCRegistry', [ethers.ZeroAddress, ethers.ZeroAddress]);
    await defaultKyc.waitForDeployment();
    expect(await defaultKyc.hasRole(VERIFIER_ROLE, deployer.address)).to.equal(true);
    expect(await defaultKyc.hasRole(ethers.ZeroHash, deployer.address)).to.equal(true);
  });

  it('enforces verification expiry: expired accounts lose verification status', async function () {
    const blk = await ethers.provider.getBlock('latest');
    const pastTime = blk.timestamp - 100;
    const futureExpiry = blk.timestamp + 300; // 300 seconds from now

    // 1. Setting past expiry reverts with InvalidExpiry
    await expectRevert(
      () => kyc.setVerified(outsider.address, 2, true, pastTime, ethers.id('expired-test')),
      'InvalidExpiry'
    );

    // 2. Set with short future expiry
    await kyc.setVerified(outsider.address, 2, true, futureExpiry, ethers.id('future-test'));
    expect(await kyc['isVerified(address,uint8)'](outsider.address, 2)).to.equal(true);
    expect(await kyc['isVerified(address)'](outsider.address)).to.equal(true);

    // 3. Fast-forward past expiry
    await ethers.provider.send('evm_increaseTime', [400]);
    await ethers.provider.send('evm_mine', []);

    // 4. Verification views return false
    expect(await kyc['isVerified(address,uint8)'](outsider.address, 2)).to.equal(false);
    expect(await kyc['isVerified(address)'](outsider.address)).to.equal(false);
  });

  it('enforces complete revocation policy across borrower, lender, and supplier lifecycles', async function () {
    const oneYear = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

    // --- Part 1: Revoked Lender ---
    // Revoke Lender A
    await kyc.revokeVerification(lenderA.address);
    expect(await kyc['isVerified(address,uint8)'](lenderA.address, 2)).to.equal(false);

    // Double revocation reverts with AddressAlreadyInState
    await expectRevert(() => kyc.revokeVerification(lenderA.address), 'AddressAlreadyInState');

    // Revoked lender cannot contribute
    await expectRevert(() => pool.connect(lenderA).contribute({ value: ethers.parseEther('1') }), 'NotVerifiedLender');

    // Temporarily re-verify Lender A to fund and activate pool
    await kyc.setVerified(lenderA.address, 2, true, oneYear, ethers.id('lender-a-reverified'));
    await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') });
    expect(await pool.status()).to.equal(1); // Active

    // Revoke Lender A again while pool is active
    await kyc.revokeVerification(lenderA.address);
    expect(await kyc['isVerified(address,uint8)'](lenderA.address, 2)).to.equal(false);

    // Borrower repays full loan (10.8 ETH) -> status transitions to Repaid
    await pool.connect(borrower).repay({ value: ethers.parseEther('10.8') });
    expect(await pool.status()).to.equal(2); // Repaid

    // REVOCATION POLICY: Revoked lender CAN still claim repayments
    const aBalBefore = await ethers.provider.getBalance(lenderA.address);
    const claimTx = await pool.connect(lenderA).claimRepayment();
    const receipt = await claimTx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const aBalAfter = await ethers.provider.getBalance(lenderA.address);
    // Lender A funded 60% of 10 ETH pool with 10 ETH unspent + 10.8 repaid = 20.8 total distributable -> 12.48 ETH
    expect(aBalAfter + gasCost - aBalBefore).to.equal(ethers.parseEther('12.48'));

    // --- Part 2: Revoked Lender refund path & default vote ---
    // Create new loan pool to test cancellation and refund
    const cancelTerms = defaultTerms(borrower.address, { fundingDurationSeconds: 300 });
    const cTx = await factory.connect(borrower).createLoan(cancelTerms);
    await cTx.wait();
    const pools = await factory.getPools();
    const cancelPool = await ethers.getContractAt('LoanPool', pools[pools.length - 1]);

    // Re-verify Lender A, contribute 2 ETH
    await kyc.setVerified(lenderA.address, 2, true, oneYear, ethers.id('lender-a-cancel-test'));
    await cancelPool.connect(lenderA).contribute({ value: ethers.parseEther('2') });

    // Expire funding window and cancel pool
    await ethers.provider.send('evm_increaseTime', [400]);
    await ethers.provider.send('evm_mine', []);
    await cancelPool.cancelUnfunded();

    // Revoke Lender A
    await kyc.revokeVerification(lenderA.address);

    // REVOCATION POLICY: Revoked lender CAN still claim refund
    const refundTx = await cancelPool.connect(lenderA).claimFundingRefund();
    await expect(refundTx).to.emit(cancelPool, 'FundingRefunded').withArgs(lenderA.address, ethers.parseEther('2'));

    // --- Part 3: Revoked Borrower cannot create loans or spend, but CAN repay ---
    // 1. Revoked borrower cannot create loan via factory
    await kyc.revokeVerification(borrower.address);
    await expectRevert(
      () => factory.connect(borrower).createLoan(defaultTerms(borrower.address)),
      'BorrowerNotVerified'
    );

    // 2. Create an active pool with re-verified borrower
    await kyc.setVerified(borrower.address, 1, true, oneYear, ethers.id('borrower-spend-test'));
    const spendTerms = defaultTerms(borrower.address);
    const sTx = await factory.connect(borrower).createLoan(spendTerms);
    await sTx.wait();
    const pools2 = await factory.getPools();
    const spendPool = await ethers.getContractAt('LoanPool', pools2[pools2.length - 1]);
    await spendPool.connect(lenderB).contribute({ value: ethers.parseEther('10') });
    expect(await spendPool.status()).to.equal(1); // Active

    // Revoke borrower now
    await kyc.revokeVerification(borrower.address);

    // REVOCATION POLICY: Revoked borrower cannot spend
    await expectRevert(
      () => spendPool.connect(borrower).spend(merchantA.address, ethers.parseEther('1'), ethers.id('inventory')),
      'BorrowerNotVerified'
    );

    // REVOCATION POLICY: Revoked borrower CAN still repay
    const repayTx = await spendPool.connect(borrower).repay({ value: ethers.parseEther('10.8') });
    await expect(repayTx).to.emit(spendPool, 'RepaymentReceived');
    expect(await spendPool.status()).to.equal(2); // Repaid
  });

  it('prevents reentrancy attack on spend via malicious merchant and on claimRepayment via malicious lender', async function () {
    // Deploy malicious merchant
    const malMerchant = await ethers.deployContract('MaliciousMerchant');
    await malMerchant.waitForDeployment();
    const malMerchantAddress = await malMerchant.getAddress();
    const exp = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

    // Verify malicious merchant as Supplier in KYC
    await kyc.setVerified(malMerchantAddress, 3, true, exp, ethers.id('malicious-merchant'));

    // Create a pool approving the malicious merchant
    const malTx = await factory.connect(borrower).createLoan(
      defaultTerms(borrower.address, { merchants: [malMerchantAddress], merchantCapsWei: [ethers.parseEther('8')] })
    );
    await malTx.wait();
    const pools = await factory.getPools();
    const malPool = await ethers.getContractAt('LoanPool', pools[pools.length - 1]);

    // Fund the pool to activate
    await malPool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await malPool.connect(lenderB).contribute({ value: ethers.parseEther('4') });
    expect(await malPool.status()).to.equal(1); // Active

    // 1. Borrower spends to MaliciousMerchant -> MaliciousMerchant tries to re-enter spend -> reverts
    await expectRevert(
      () => malPool.connect(borrower).spend(malMerchantAddress, ethers.parseEther('1'), ethers.id('test')),
      'merchant transfer failed'
    );

    // Deploy malicious lender
    const malLender = await ethers.deployContract('MaliciousLender');
    await malLender.waitForDeployment();
    const malLenderAddress = await malLender.getAddress();

    // Verify the malicious lender as Lender in KYC so it can contribute
    await kyc.setVerified(malLenderAddress, 2, true, exp, ethers.id('malicious-lender'));

    // Create another pool for lender reentrancy test
    const loanTx2 = await factory.connect(borrower).createLoan(defaultTerms(borrower.address));
    await loanTx2.wait();
    const pools2 = await factory.getPools();
    const malPool2 = await ethers.getContractAt('LoanPool', pools2[pools2.length - 1]);

    // Malicious lender funds 6 ETH, Lender B funds 4 ETH -> pool activates
    await malLender.fund(await malPool2.getAddress(), { value: ethers.parseEther('6') });
    await malPool2.connect(lenderB).contribute({ value: ethers.parseEther('4') });
    expect(await malPool2.status()).to.equal(1); // Active

    // Borrower repays 5.4 ETH (50%)
    await malPool2.connect(borrower).repay({ value: ethers.parseEther('5.4') });

    // 2. Malicious lender claims repayment -> receives ETH -> tries to reenter claimRepayment -> reverts
    await expectRevert(
      () => malLender.claim(),
      'lender transfer failed'
    );
  });

  it('asserts events for all contract lifecycle and state transitions', async function () {
    // 1. KYCRegistry VerificationUpdated
    const kycRef = ethers.id('audit-ref');
    const expTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
    const kycTx = await kyc.setVerified(outsider.address, 2, true, expTime, kycRef);
    await expect(kycTx)
      .to.emit(kyc, 'VerificationUpdated')
      .withArgs(outsider.address, 2, true, expTime, kycRef, deployer.address);

    // 2. LoanFactory LoanCreated & LoanPool LoanPoolCreated
    const customHash = ethers.id('test agreement hash v2');
    const createTx = await factory.connect(borrower).createLoan(defaultTerms(borrower.address, { agreementHash: customHash }));
    const pools = await factory.getPools();
    const testPoolAddress = pools[pools.length - 1];
    const testPool = await ethers.getContractAt('LoanPool', testPoolAddress);

    await expect(createTx)
      .to.emit(factory, 'LoanCreated')
      .withArgs(testPoolAddress, borrower.address, ethers.parseEther('10'), 800, customHash);
    await expect(createTx)
      .to.emit(testPool, 'LoanPoolCreated')
      .withArgs(borrower.address, ethers.parseEther('10'), 800, customHash);

    // 3. ReputationRegistry PoolAuthorized
    expect(await reputation.authorizedPools(testPoolAddress)).to.equal(true);

    // 4. LoanPool Funded & LoanActivated (emits timestamp and maturity)
    const fundTx1 = await testPool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await expect(fundTx1)
      .to.emit(testPool, 'Funded')
      .withArgs(lenderA.address, ethers.parseEther('6'), ethers.parseEther('6'));

    const fundTx2 = await testPool.connect(lenderB).contribute({ value: ethers.parseEther('4') });
    await expect(fundTx2)
      .to.emit(testPool, 'Funded')
      .withArgs(lenderB.address, ethers.parseEther('4'), ethers.parseEther('10'));
    const testMaturity = await testPool.maturity();
    await expect(fundTx2).to.emit(testPool, 'LoanActivated');
    expect(testMaturity).to.be.gt(0);

    // 5. LoanPool SpendExecuted
    const spendCat = ethers.id('inventory');
    const spendTx = await testPool.connect(borrower).spend(merchantA.address, ethers.parseEther('2'), spendCat);
    await expect(spendTx)
      .to.emit(testPool, 'SpendExecuted')
      .withArgs(merchantA.address, ethers.parseEther('2'), spendCat);

    // 6. LoanPool RepaymentReceived
    const repayTx1 = await testPool.connect(borrower).repay({ value: ethers.parseEther('5.4') });
    await expect(repayTx1)
      .to.emit(testPool, 'RepaymentReceived')
      .withArgs(borrower.address, ethers.parseEther('5.4'), ethers.parseEther('5.4'));

    // 7. LoanPool RepaymentClaimed
    const claimTx = await testPool.connect(lenderA).claimRepayment();
    await expect(claimTx)
      .to.emit(testPool, 'RepaymentClaimed')
      .withArgs(lenderA.address, ethers.parseEther('3.24'));

    // 8. LoanPool LoanRepaid & ReputationRegistry ReputationUpdated
    const repayTx2 = await testPool.connect(borrower).repay({ value: ethers.parseEther('5.4') });
    await expect(repayTx2)
      .to.emit(testPool, 'RepaymentReceived')
      .withArgs(borrower.address, ethers.parseEther('5.4'), ethers.parseEther('10.8'));
    await expect(repayTx2)
      .to.emit(testPool, 'LoanRepaid')
      .withArgs(ethers.parseEther('10.8'));
    await expect(repayTx2).to.emit(reputation, 'ReputationUpdated');
  });

  // --- WP1 SPECIFIC TESTS ---

  it('distributes unspent principal on full repayment (10 funded, 8 spent, 10.8 repaid -> lenders claim 12.8 in total)', async function () {
    // 1. Lender A (60%) and Lender B (40%) fund 10 ETH pool
    await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') });
    expect(await pool.status()).to.equal(1); // Active

    // 2. Borrower spends 8 ETH to Merchant A -> unspent principal in pool is 2 ETH
    await pool.connect(borrower).spend(merchantA.address, ethers.parseEther('8'), ethers.id('supplies'));
    expect(await pool.totalSpent()).to.equal(ethers.parseEther('8'));

    // Pool balance before repayment is 2 ETH
    expect(await ethers.provider.getBalance(await pool.getAddress())).to.equal(ethers.parseEther('2'));

    // 3. Borrower repays full debt: 10.8 ETH
    await pool.connect(borrower).repay({ value: ethers.parseEther('10.8') });
    expect(await pool.status()).to.equal(2); // Repaid

    // Distributable is 10.8 (repaid) + (10 - 8 unspent principal) = 12.8 ETH
    expect(await pool.distributable()).to.equal(ethers.parseEther('12.8'));

    // Pool balance is exactly 12.8 ETH
    expect(await ethers.provider.getBalance(await pool.getAddress())).to.equal(ethers.parseEther('12.8'));

    // 4. Lender entitlements:
    // Lender A (60%): 12.8 * 0.6 = 7.68 ETH
    // Lender B (40%): 12.8 * 0.4 = 5.12 ETH
    const [, aClaimable] = await pool.getLenderInfo(lenderA.address);
    const [, bClaimable] = await pool.getLenderInfo(lenderB.address);
    expect(aClaimable).to.equal(ethers.parseEther('7.68'));
    expect(bClaimable).to.equal(ethers.parseEther('5.12'));

    // 5. Lenders claim full allocations
    const aBalBefore = await ethers.provider.getBalance(lenderA.address);
    const aTx = await pool.connect(lenderA).claimRepayment();
    const aReceipt = await aTx.wait();
    const aGas = aReceipt.gasUsed * aReceipt.gasPrice;
    const aBalAfter = await ethers.provider.getBalance(lenderA.address);
    expect(aBalAfter + aGas - aBalBefore).to.equal(ethers.parseEther('7.68'));

    const bBalBefore = await ethers.provider.getBalance(lenderB.address);
    const bTx = await pool.connect(lenderB).claimRepayment();
    const bReceipt = await bTx.wait();
    const bGas = bReceipt.gasUsed * bReceipt.gasPrice;
    const bBalAfter = await ethers.provider.getBalance(lenderB.address);
    expect(bBalAfter + bGas - bBalBefore).to.equal(ethers.parseEther('5.12'));

    // Total claims equal 12.8 ETH and pool balance is 0 (no stuck funds!)
    expect((await pool.claimed(lenderA.address)) + (await pool.claimed(lenderB.address))).to.equal(ethers.parseEther('12.8'));
    expect(await ethers.provider.getBalance(await pool.getAddress())).to.equal(0);
  });

  it('distributes unspent principal after default (10 funded, 8 spent, 0 repaid, default -> lenders claim 2.0 in total)', async function () {
    // 1. Fund 10 ETH pool
    await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') });

    // 2. Spend 8 ETH -> unspent principal 2 ETH
    await pool.connect(borrower).spend(merchantA.address, ethers.parseEther('8'), ethers.id('supplies'));

    // 3. Fast forward past maturity + grace period
    await ethers.provider.send('evm_increaseTime', [18 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);

    // 4. Lender A votes default -> Defaulted
    await pool.connect(lenderA).voteDefault();
    expect(await pool.status()).to.equal(3); // Defaulted

    // Distributable in Defaulted status is 0 repaid + 2 unspent = 2 ETH
    expect(await pool.distributable()).to.equal(ethers.parseEther('2'));

    // Lender A claims 60% of 2 ETH = 1.2 ETH
    await pool.connect(lenderA).claimRepayment();
    expect(await pool.claimed(lenderA.address)).to.equal(ethers.parseEther('1.2'));

    // Lender B claims 40% of 2 ETH = 0.8 ETH
    await pool.connect(lenderB).claimRepayment();
    expect(await pool.claimed(lenderB.address)).to.equal(ethers.parseEther('0.8'));

    // Pool balance is 0
    expect(await ethers.provider.getBalance(await pool.getAddress())).to.equal(0);
  });

  it('reverts spend attempts when pool is already Repaid or Defaulted', async function () {
    // 1. Repaid pool rejection
    await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') });
    await pool.connect(borrower).spend(merchantA.address, ethers.parseEther('2'), ethers.id('supplies'));
    await pool.connect(borrower).repay({ value: ethers.parseEther('10.8') });
    expect(await pool.status()).to.equal(2); // Repaid
    await expectRevert(
      () => pool.connect(borrower).spend(merchantA.address, ethers.parseEther('1'), ethers.id('extra')),
      'NotActive'
    );

    // 2. Defaulted pool rejection
    const terms2 = defaultTerms(borrower.address, {
      agreementHash: ethers.id('Defaulted spend rejection test')
    });
    const tx2 = await factory.connect(borrower).createLoan(terms2);
    const receipt2 = await tx2.wait();
    const event2 = receipt2.logs.find((log: any) => log.fragment && log.fragment.name === 'LoanCreated');
    const pool2Addr = event2.args[0];
    const pool2 = await ethers.getContractAt('LoanPool', pool2Addr);

    await pool2.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await pool2.connect(lenderB).contribute({ value: ethers.parseEther('4') });
    await ethers.provider.send('evm_increaseTime', [18 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);
    await pool2.connect(lenderA).voteDefault();
    expect(await pool2.status()).to.equal(3); // Defaulted

    await expectRevert(
      () => pool2.connect(borrower).spend(merchantA.address, ethers.parseEther('1'), ethers.id('extra')),
      'NotActive'
    );
  });

  it('allows repayment after maturity but before default declaration, successfully transitioning to Repaid and updating reputation', async function () {
    await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') });
    await pool.connect(borrower).spend(merchantA.address, ethers.parseEther('3'), ethers.id('gear'));

    // Fast-forward 20 days (past 14d tenure + 3d grace period)
    await ethers.provider.send('evm_increaseTime', [20 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);

    // Pool is past maturity and grace period, but no default vote has occurred -> remains Active
    expect(await pool.status()).to.equal(1); // Active

    // Borrower successfully satisfies full debt obligations (10.8 ETH)
    const repayTx = await pool.connect(borrower).repay({ value: ethers.parseEther('10.8') });
    await repayTx.wait();

    // Successfully transitioned to Repaid
    expect(await pool.status()).to.equal(2); // Repaid
    expect(await pool.totalRepaid()).to.equal(ethers.parseEther('10.8'));

    // Reputation score increased by +8 points (from 50 to 58)
    const [score, successful, defaults] = await reputation.getScore(borrower.address);
    expect(score).to.equal(58);
    expect(successful).to.equal(1);
    expect(defaults).to.equal(0);
  });

  it('separates funding deadline from activation maturity and emits maturity in LoanActivated', async function () {
    // At creation: maturity is 0, fundingDeadline is block.timestamp + 7 days
    expect(await pool.maturity()).to.equal(0);
    const deadline = await pool.fundingDeadline();
    expect(deadline).to.be.gt(0);

    // Cancel before deadline reverts
    await expectRevert(() => pool.cancelUnfunded(), 'FundingNotExpired');

    // Fund to target and verify LoanActivated emits non-zero maturity
    await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    const activateTx = await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') });
    const maturity = await pool.maturity();
    expect(maturity).to.be.gt(0);
    await expect(activateTx).to.emit(pool, 'LoanActivated');
  });

  it('enforces that createLoan requires msg.sender == borrower', async function () {
    const terms = defaultTerms(borrower.address);
    // Outsider attempting to create loan for borrower reverts
    await expectRevert(() => factory.connect(outsider).createLoan(terms), 'NotBorrower');

    // Borrower creating loan succeeds
    const tx = await factory.connect(borrower).createLoan(terms);
    await expect(tx).to.emit(factory, 'LoanCreated');
  });

  it('enforces per-merchant spend caps and global maxSpendWei simultaneously', async function () {
    // Create pool with 2 merchants: Merchant A cap 5 ETH, Merchant B cap 3 ETH. Global maxSpend = 8 ETH.
    const terms = defaultTerms(borrower.address, {
      merchants: [merchantA.address, merchantB.address],
      merchantCapsWei: [ethers.parseEther('5'), ethers.parseEther('3')],
      maxSpendWei: ethers.parseEther('8')
    });
    const tx = await factory.connect(borrower).createLoan(terms);
    await tx.wait();
    const pools = await factory.getPools();
    const multiPool = await ethers.getContractAt('LoanPool', pools[pools.length - 1]);

    // Fund to activate
    await multiPool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await multiPool.connect(lenderB).contribute({ value: ethers.parseEther('4') });

    // Verify merchant info view
    const [aApproved, aCap, aSpent] = await multiPool.getMerchantInfo(merchantA.address);
    expect(aApproved).to.equal(true);
    expect(aCap).to.equal(ethers.parseEther('5'));
    expect(aSpent).to.equal(0);

    // 1. Borrower spends 4 ETH to Merchant A -> succeeds
    await multiPool.connect(borrower).spend(merchantA.address, ethers.parseEther('4'), ethers.id('cat1'));
    expect(await multiPool.merchantSpentWei(merchantA.address)).to.equal(ethers.parseEther('4'));

    // 2. Borrower attempts to spend 2 ETH more to Merchant A (4 + 2 = 6 > 5 cap) -> reverts MerchantCapExceeded
    await expectRevert(
      () => multiPool.connect(borrower).spend(merchantA.address, ethers.parseEther('2'), ethers.id('cat2')),
      'MerchantCapExceeded'
    );

    // 3. Borrower spends 1 ETH remaining capacity to Merchant A (total 5 ETH) -> succeeds
    await multiPool.connect(borrower).spend(merchantA.address, ethers.parseEther('1'), ethers.id('cat2'));
    expect(await multiPool.merchantSpentWei(merchantA.address)).to.equal(ethers.parseEther('5'));

    // 4. Any further spend to Merchant A reverts
    await expectRevert(
      () => multiPool.connect(borrower).spend(merchantA.address, ethers.parseEther('0.1'), ethers.id('cat2')),
      'MerchantCapExceeded'
    );

    // 5. Spend to Merchant B within its 3 ETH cap -> succeeds
    await multiPool.connect(borrower).spend(merchantB.address, ethers.parseEther('3'), ethers.id('cat3'));
    expect(await multiPool.merchantSpentWei(merchantB.address)).to.equal(ethers.parseEther('3'));
    expect(await multiPool.totalSpent()).to.equal(ethers.parseEther('8'));

    // 6. Global spend cap (8 ETH) is now reached -> further spend to any merchant reverts SpendLimitExceeded
    await expectRevert(
      () => multiPool.connect(borrower).spend(merchantB.address, ethers.parseEther('0.1'), ethers.id('cat4')),
      'SpendLimitExceeded'
    );
  });

  it('enforces grace period before default votes can be cast', async function () {
    // Fund pool
    await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') });

    // Duration is 14 days, grace period is 3 days
    // Fast forward 15 days (past 14 days maturity, but BEFORE 14 + 3 = 17 days grace)
    await ethers.provider.send('evm_increaseTime', [15 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);

    // Voting reverts because grace period has not elapsed
    await expectRevert(() => pool.connect(lenderA).voteDefault(), 'MaturityNotReached');

    // Fast forward additional 2.5 days (total 17.5 days > maturity + grace)
    await ethers.provider.send('evm_increaseTime', [2.5 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);

    // Voting now succeeds
    const voteTx = await pool.connect(lenderA).voteDefault();
    await expect(voteTx).to.emit(pool, 'DefaultVoteCast');
  });

  it('enforces LoanFactory Pausable and Ownable2Step mechanisms', async function () {
    // Non-owner cannot pause
    await expectRevert(() => factory.connect(outsider).pause(), 'OwnableUnauthorizedAccount');

    // Owner pauses factory
    await factory.connect(deployer).pause();

    // createLoan reverts when paused
    await expectRevert(() => factory.connect(borrower).createLoan(defaultTerms(borrower.address)), 'EnforcedPause');

    // Owner unpauses
    await factory.connect(deployer).unpause();
    const tx = await factory.connect(borrower).createLoan(defaultTerms(borrower.address));
    await expect(tx).to.emit(factory, 'LoanCreated');

    // Ownable2Step transfer
    await factory.connect(deployer).transferOwnership(lenderA.address);
    expect(await factory.owner()).to.equal(deployer.address);
    expect(await factory.pendingOwner()).to.equal(lenderA.address);

    // Pending owner accepts
    await factory.connect(lenderA).acceptOwnership();
    expect(await factory.owner()).to.equal(lenderA.address);
  });

  // --- INVARIANT AND PROPERTY TESTS ---

  it('invariant: sum of all claims never exceeds funds in plus interest repaid', async function () {
    // Fund with 3 lenders (5 ETH, 3 ETH, 2 ETH)
    await pool.connect(lenderA).contribute({ value: ethers.parseEther('5') });
    await pool.connect(lenderB).contribute({ value: ethers.parseEther('3') });
    await pool.connect(lenderC).contribute({ value: ethers.parseEther('2') });

    // Spend 5 ETH
    await pool.connect(borrower).spend(merchantA.address, ethers.parseEther('5'), ethers.id('inv'));

    // Partial repayment of 4 ETH
    await pool.connect(borrower).repay({ value: ethers.parseEther('4') });

    // Lenders claim partial
    await pool.connect(lenderA).claimRepayment();
    await pool.connect(lenderB).claimRepayment();

    // Complete repayment: 10.8 - 4 = 6.8 ETH
    await pool.connect(borrower).repay({ value: ethers.parseEther('6.8') });

    // Lenders claim remaining
    await pool.connect(lenderA).claimRepayment();
    await pool.connect(lenderB).claimRepayment();
    await pool.connect(lenderC).claimRepayment();

    const claimedA = await pool.claimed(lenderA.address);
    const claimedB = await pool.claimed(lenderB.address);
    const claimedC = await pool.claimed(lenderC.address);
    const totalClaimed = claimedA + claimedB + claimedC;

    const totalContributed = await pool.totalContributed();
    const totalRepaid = await pool.totalRepaid();
    const totalSpent = await pool.totalSpent();

    // Invariant 1: totalClaimed == totalRepaid + (totalContributed - totalSpent)
    expect(totalClaimed).to.equal(totalRepaid + (totalContributed - totalSpent));
    // Invariant 2: totalClaimed <= fundsIn (10 ETH) + interest repaid (0.8 ETH)
    expect(totalClaimed).to.be.lte(totalContributed + totalRepaid);
  });

  it('invariant: pool never pays a non-allowlisted address', async function () {
    await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') });

    // Spending to non-allowlisted address always reverts
    await expectRevert(
      () => pool.connect(borrower).spend(outsider.address, ethers.parseEther('1'), ethers.id('unauth')),
      'MerchantNotApproved'
    );
  });

  it('invariant: no merchant ever receives more than its cap', async function () {
    const terms = defaultTerms(borrower.address, {
      merchants: [merchantA.address, merchantB.address],
      merchantCapsWei: [ethers.parseEther('4'), ethers.parseEther('2')],
      maxSpendWei: ethers.parseEther('6')
    });
    const tx = await factory.connect(borrower).createLoan(terms);
    await tx.wait();
    const pools = await factory.getPools();
    const p = await ethers.getContractAt('LoanPool', pools[pools.length - 1]);

    await p.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await p.connect(lenderB).contribute({ value: ethers.parseEther('4') });

    // Merchant A cap is 4 ETH. Attempting 4.0001 ETH reverts
    await expectRevert(
      () => p.connect(borrower).spend(merchantA.address, ethers.parseEther('4.0001'), ethers.id('cat')),
      'MerchantCapExceeded'
    );
    await p.connect(borrower).spend(merchantA.address, ethers.parseEther('4'), ethers.id('cat'));
    expect(await p.merchantSpentWei(merchantA.address)).to.equal(ethers.parseEther('4'));

    // Further spend to Merchant A reverts
    await expectRevert(
      () => p.connect(borrower).spend(merchantA.address, 1n, ethers.id('cat')),
      'MerchantCapExceeded'
    );
  });

  it('invariant: after terminal state no ETH remains unclaimable except rounding dust', async function () {
    // 3 lenders with uneven contributions (3.333 ETH, 3.333 ETH, 3.334 ETH)
    const c1 = ethers.parseEther('3.333');
    const c2 = ethers.parseEther('3.333');
    const c3 = ethers.parseEther('3.334');
    await pool.connect(lenderA).contribute({ value: c1 });
    await pool.connect(lenderB).contribute({ value: c2 });
    await pool.connect(lenderC).contribute({ value: c3 });

    // Spend 7.777 ETH
    await pool.connect(borrower).spend(merchantA.address, ethers.parseEther('7.777'), ethers.id('spend'));

    // Repay full 10.8 ETH
    await pool.connect(borrower).repay({ value: ethers.parseEther('10.8') });

    // All lenders claim
    await pool.connect(lenderA).claimRepayment();
    await pool.connect(lenderB).claimRepayment();
    await pool.connect(lenderC).claimRepayment();

    // Check remaining balance in pool
    const remainingBalance = await ethers.provider.getBalance(await pool.getAddress());
    // Invariant: remaining dust must be bounded by number of lenders (3 wei)
    expect(remainingBalance).to.be.lte(3n);
  });

  it('invariant: contributions never exceed target', async function () {
    await pool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    // Attempting 4.000000000000000001 ETH when 4 ETH is remaining reverts
    await expectRevert(
      () => pool.connect(lenderB).contribute({ value: ethers.parseEther('4.000000000000000001') }),
      'TargetExceeded'
    );
    await pool.connect(lenderB).contribute({ value: ethers.parseEther('4') });
    expect(await pool.totalContributed()).to.equal(ethers.parseEther('10'));
    // Further contribution reverts FundingClosed
    await expectRevert(
      () => pool.connect(lenderC).contribute({ value: ethers.parseEther('1') }),
      'FundingClosed'
    );
  });
});
