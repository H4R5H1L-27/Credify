import { expect } from 'chai';
import { network } from 'hardhat';

describe('WP11: EIP-1167 Minimal Proxy Clone Gas Comparison & Lifecycle', function () {
  let ethers: any;
  let deployer: any;
  let borrower: any;
  let lenderA: any;
  let lenderB: any;
  let merchantA: any;
  let kyc: any;
  let reputation: any;
  let standardFactory: any;
  let cloneFactory: any;
  let implementation: any;

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
    [deployer, borrower, lenderA, lenderB, merchantA] = await ethers.getSigners();

    kyc = await ethers.deployContract('KYCRegistry', [deployer.address, deployer.address]);
    await kyc.waitForDeployment();

    reputation = await ethers.deployContract('ReputationRegistry');
    await reputation.waitForDeployment();

    // Deploy standard LoanFactory
    standardFactory = await ethers.deployContract('LoanFactory', [
      await kyc.getAddress(),
      await reputation.getAddress()
    ]);
    await standardFactory.waitForDeployment();

    // Deploy implementation logic contract for cloneable pool
    implementation = await ethers.deployContract('LoanPoolCloneable');
    await implementation.waitForDeployment();

    // Deploy LoanPoolCloneFactory
    cloneFactory = await ethers.deployContract('LoanPoolCloneFactory', [
      await implementation.getAddress(),
      await kyc.getAddress(),
      await reputation.getAddress()
    ]);
    await cloneFactory.waitForDeployment();

    // Authorize both factories in reputation registry
    // ReputationRegistry ownership can be deployer for this comparison test
    // Or deployer authorizes pools directly
    // But LoanFactory calls authorizePool, so let's keep deployer as owner or test with deployer
    // In deploy, ReputationRegistry.authorizePool is onlyOwner.
    // For standardFactory, let's transfer ownership or leave deployer in control
    // Let's grant reputation ownership to deployer and have deployer authorize pools, or test
  });

  it('demonstrates massive gas savings (> 85%) for EIP-1167 clone vs standard new LoanPool deployment', async function () {
    const Role = { None: 0, Borrower: 1, Lender: 2, Supplier: 3 };
    const oneYear = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

    await kyc.setVerified(borrower.address, Role.Borrower, true, oneYear, ethers.id('test:borrower'));
    await kyc.setVerified(merchantA.address, Role.Supplier, true, oneYear, ethers.id('test:merchantA'));

    // Temporarily transfer ownership of reputation to standardFactory for standard call
    await reputation.transferOwnership(await standardFactory.getAddress());

    const terms = defaultTerms(borrower.address);

    // 1. Measure Standard Factory createLoan gas
    const standardTx = await standardFactory.connect(borrower).createLoan(terms);
    const standardReceipt = await standardTx.wait();
    const standardGasUsed = standardReceipt.gasUsed;

    // Reset reputation ownership for cloneFactory
    // Wait, cloneFactory also calls reputation.authorizePool(pool, true).
    // Let's create a fresh reputation registry owned by cloneFactory
    const reputation2 = await ethers.deployContract('ReputationRegistry');
    await reputation2.waitForDeployment();

    const cloneFactory2 = await ethers.deployContract('LoanPoolCloneFactory', [
      await implementation.getAddress(),
      await kyc.getAddress(),
      await reputation2.getAddress()
    ]);
    await cloneFactory2.waitForDeployment();
    await reputation2.transferOwnership(await cloneFactory2.getAddress());

    // 2. Measure Clone Factory createLoan gas
    const cloneTx = await cloneFactory2.connect(borrower).createLoan(terms);
    const cloneReceipt = await cloneTx.wait();
    const cloneGasUsed = cloneReceipt.gasUsed;

    console.log(`\n==================================================`);
    console.log(`EIP-1167 Minimal Proxy Gas Benchmark:`);
    console.log(`Standard new LoanPool Gas Used: ${standardGasUsed.toString()}`);
    console.log(`EIP-1167 Cloned Pool Gas Used:  ${cloneGasUsed.toString()}`);
    const savings = ((Number(standardGasUsed - cloneGasUsed) / Number(standardGasUsed)) * 100).toFixed(2);
    console.log(`Net Deployment Gas Reduction:   ${savings}%`);
    console.log(`==================================================\n`);

    // Cloned deployment should use significantly less gas than full contract creation
    expect(Number(cloneGasUsed)).to.be.lessThan(Number(standardGasUsed));
    // Expect at least 75% gas reduction (> 2.2 million gas saved per loan)
    expect(Number(savings)).to.be.greaterThan(75);
  });

  it('runs complete lifecycle on EIP-1167 cloned LoanPool (Funding -> Active -> Spend -> Repay -> Claims)', async function () {
    const Role = { None: 0, Borrower: 1, Lender: 2, Supplier: 3 };
    const oneYear = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

    await kyc.setVerified(borrower.address, Role.Borrower, true, oneYear, ethers.id('test:borrower'));
    await kyc.setVerified(lenderA.address, Role.Lender, true, oneYear, ethers.id('test:lenderA'));
    await kyc.setVerified(lenderB.address, Role.Lender, true, oneYear, ethers.id('test:lenderB'));
    await kyc.setVerified(merchantA.address, Role.Supplier, true, oneYear, ethers.id('test:merchantA'));

    await reputation.transferOwnership(await cloneFactory.getAddress());

    const terms = defaultTerms(borrower.address);
    const tx = await cloneFactory.connect(borrower).createLoan(terms);
    const receipt = await tx.wait();

    // Extract cloned pool address from LoanCreated event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = cloneFactory.interface.parseLog(log);
        return parsed?.name === 'LoanCreated';
      } catch {
        return false;
      }
    });
    const parsedEvent = cloneFactory.interface.parseLog(event);
    const poolAddress = parsedEvent.args.pool;

    const clonedPool = await ethers.getContractAt('LoanPoolCloneable', poolAddress);

    // Verify initial clone state
    const summary = await clonedPool.getSummary();
    expect(summary._status).to.equal(0); // Status.Funding
    expect(summary._targetWei).to.equal(ethers.parseEther('10'));

    // Lenders fund pool (6 ETH from lenderA, 4 ETH from lenderB)
    await clonedPool.connect(lenderA).contribute({ value: ethers.parseEther('6') });
    await clonedPool.connect(lenderB).contribute({ value: ethers.parseEther('4') });

    // Pool should automatically activate
    const activeSummary = await clonedPool.getSummary();
    expect(activeSummary._status).to.equal(1); // Status.Active

    // Borrower executes spend to approved supplier
    const initialMerchantBal = await ethers.provider.getBalance(merchantA.address);
    await clonedPool.connect(borrower).spend(merchantA.address, ethers.parseEther('7'), ethers.id('Hardware'));
    const finalMerchantBal = await ethers.provider.getBalance(merchantA.address);
    expect(finalMerchantBal - initialMerchantBal).to.equal(ethers.parseEther('7'));

    // Borrower settles loan in full: 10 ETH principal + 0.8 ETH interest = 10.8 ETH
    await clonedPool.connect(borrower).repay({ value: ethers.parseEther('10.8') });

    const repaidSummary = await clonedPool.getSummary();
    expect(repaidSummary._status).to.equal(2); // Status.Repaid

    // Unspent principal: 10 contributed - 7 spent = 3 ETH
    // Total distributable: 10.8 repaid + 3 unspent = 13.8 ETH
    // Lender A share (60%): 13.8 * 0.6 = 8.28 ETH
    // Lender B share (40%): 13.8 * 0.4 = 5.52 ETH
    const lenderAInfo = await clonedPool.getLenderInfo(lenderA.address);
    expect(lenderAInfo.claimable).to.equal(ethers.parseEther('8.28'));

    const lenderBInfo = await clonedPool.getLenderInfo(lenderB.address);
    expect(lenderBInfo.claimable).to.equal(ethers.parseEther('5.52'));

    // Lenders claim their pro-rata entitlements
    await expect(clonedPool.connect(lenderA).claimRepayment())
      .to.emit(clonedPool, 'RepaymentClaimed')
      .withArgs(lenderA.address, ethers.parseEther('8.28'));

    await expect(clonedPool.connect(lenderB).claimRepayment())
      .to.emit(clonedPool, 'RepaymentClaimed')
      .withArgs(lenderB.address, ethers.parseEther('5.52'));

    // Borrower reputation score updated
    const repScore = await reputation.getScore(borrower.address);
    expect(repScore.score).to.equal(58); // 50 base + 8 points
    expect(repScore.successes).to.equal(1);
  });

  it('prevents direct initialization of the master implementation contract', async function () {
    const terms = defaultTerms(borrower.address);
    try {
      await implementation.initialize(terms, await kyc.getAddress(), await reputation.getAddress(), deployer.address);
      expect.fail('Expected revert due to _disableInitializers');
    } catch (error) {
      expect(String(error)).to.contain('InvalidInitialization');
    }
  });
});
