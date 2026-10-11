import { network } from 'hardhat';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEMO = {
  borrower: 'Demo Borrower',
  lenders: ['Lender Alpha', 'Lender Beta', 'Lender Gamma'],
  merchants: ['Merchant A', 'Merchant B']
};

async function main() {
  const { ethers } = await network.create();
  const signers = await ethers.getSigners();
  if (signers.length < 7) throw new Error('Expected Hardhat local accounts');

  const [deployer, borrower, lenderA, lenderB, lenderC, merchantA, merchantB] = signers;

  const KYC = await ethers.getContractFactory('KYCRegistry');
  const kyc = await KYC.deploy(deployer.address, deployer.address);
  await kyc.waitForDeployment();

  const Reputation = await ethers.getContractFactory('ReputationRegistry');
  const reputation = await Reputation.deploy();
  await reputation.waitForDeployment();

  const Factory = await ethers.getContractFactory('LoanFactory');
  const factory = await Factory.deploy(await kyc.getAddress(), await reputation.getAddress());
  await factory.waitForDeployment();
  await (await reputation.transferOwnership(await factory.getAddress())).wait();

  const ROLE = { NONE: 0, BORROWER: 1, LENDER: 2, SUPPLIER: 3 };
  const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

  await (await kyc.setVerified(borrower.address, ROLE.BORROWER, true, expiresAt, ethers.id('credify-demo:borrower'))).wait();
  for (const [i, s] of [lenderA, lenderB, lenderC].entries()) {
    await (await kyc.setVerified(s.address, ROLE.LENDER, true, expiresAt, ethers.id(`credify-demo:lender-${i + 1}`))).wait();
  }
  for (const [i, s] of [merchantA, merchantB].entries()) {
    await (await kyc.setVerified(s.address, ROLE.SUPPLIER, true, expiresAt, ethers.id(`credify-demo:supplier-${i + 1}`))).wait();
  }

  const target = ethers.parseEther('10');
  const duration = 60 * 60 * 24 * 14;
  const fundingDuration = 60 * 60 * 24 * 7;
  const aprBps = 800;
  const maxSpend = ethers.parseEther('8');
  const quorum = 5001;
  const gracePeriod = 60 * 60 * 24 * 3;
  const agreementHash = ethers.id('Credify Demo Agreement: 10 ETH, 14 days, 8% APR');
  const merchantCaps = [ethers.parseEther('5'), ethers.parseEther('3')];

  const terms = {
    borrower: borrower.address,
    targetWei: target,
    durationSeconds: duration,
    fundingDurationSeconds: fundingDuration,
    aprBps,
    maxSpendWei: maxSpend,
    defaultQuorumBps: quorum,
    gracePeriodSeconds: gracePeriod,
    agreementHash,
    merchants: [merchantA.address, merchantB.address],
    merchantCapsWei: merchantCaps
  };

  const tx = await (factory.connect(borrower) as any).createLoan(terms);
  await tx.wait();

  const pools = await factory.getPools();
  const pool = pools[0];

  const deployment = {
    network: 'localhost',
    chainId: 31337,
    deployedAt: new Date().toISOString(),
    contracts: {
      kycRegistry: await kyc.getAddress(),
      reputationRegistry: await reputation.getAddress(),
      loanFactory: await factory.getAddress(),
      sampleLoanPool: pool
    },
    accounts: {
      deployer: deployer.address,
      borrower: borrower.address,
      lenders: [lenderA.address, lenderB.address, lenderC.address],
      merchants: [merchantA.address, merchantB.address]
    },
    demo: DEMO
  };

  const path = resolve(process.cwd(), 'deployments/local.json');
  await mkdir(resolve(process.cwd(), 'deployments'), { recursive: true });
  await writeFile(path, JSON.stringify(deployment, null, 2));
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
