import { expect } from 'chai';
import { network } from 'hardhat';

describe('WP11: Mock ERC-20 Stablecoin (MockUSDC)', function () {
  let ethers: any;
  let deployer: any;
  let borrower: any;
  let lender: any;
  let usdc: any;

  beforeEach(async function () {
    ({ ethers } = await network.create());
    [deployer, borrower, lender] = await ethers.getSigners();

    usdc = await ethers.deployContract('MockUSDC');
    await usdc.waitForDeployment();
  });

  it('initializes with correct name, symbol, and 6 decimals', async function () {
    expect(await usdc.name()).to.equal('USD Coin (Mock)');
    expect(await usdc.symbol()).to.equal('USDC');
    expect(await usdc.decimals()).to.equal(6);
    expect(await usdc.balanceOf(deployer.address)).to.equal(1_000_000n * 10n ** 6n);
  });

  it('allows arbitrary accounts to mint testnet tokens from faucet', async function () {
    const mintAmount = 50_000n * 10n ** 6n; // 50,000 USDC
    await usdc.connect(borrower).mint(borrower.address, mintAmount);
    expect(await usdc.balanceOf(borrower.address)).to.equal(mintAmount);

    await usdc.connect(lender).mint(lender.address, mintAmount);
    expect(await usdc.balanceOf(lender.address)).to.equal(mintAmount);
  });

  it('supports transfers and token burns', async function () {
    const transferAmount = 10_000n * 10n ** 6n;
    await usdc.transfer(borrower.address, transferAmount);
    expect(await usdc.balanceOf(borrower.address)).to.equal(transferAmount);

    // Borrower burns part of balance
    await usdc.connect(borrower).burn(2_000n * 10n ** 6n);
    expect(await usdc.balanceOf(borrower.address)).to.equal(8_000n * 10n ** 6n);
  });
});
