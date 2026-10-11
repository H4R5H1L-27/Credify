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
  const net = await ethers.provider.getNetwork();
  const chainId = Number(net.chainId);
  const isSepolia = chainId === 11155111;
  const networkName = isSepolia ? 'sepolia' : 'localhost';

  let deployer = signers[0];
  let borrower: any;
  let lenderA: any;
  let lenderB: any;
  let lenderC: any;
  let merchantA: any;
  let merchantB: any;

  if (signers.length >= 7) {
    [deployer, borrower, lenderA, lenderB, lenderC, merchantA, merchantB] = signers;
  } else {
    // Derive deterministic demo accounts from standard mnemonic for non-local networks
    const demoMnemonic = process.env.DEMO_MNEMONIC ?? 'test test test test test test test test test test test junk';
    const hd = ethers.HDNodeWallet.fromPhrase(demoMnemonic);
    borrower = hd.deriveChild(1).connect(ethers.provider);
    lenderA = hd.deriveChild(2).connect(ethers.provider);
    lenderB = hd.deriveChild(3).connect(ethers.provider);
    lenderC = hd.deriveChild(4).connect(ethers.provider);
    merchantA = hd.deriveChild(5).connect(ethers.provider);
    merchantB = hd.deriveChild(6).connect(ethers.provider);

    // Ensure borrower has enough ETH for createLoan transaction gas
    const borrowerBalance = await ethers.provider.getBalance(borrower.address);
    if (borrowerBalance < ethers.parseEther('0.005')) {
      const fundTx = await deployer.sendTransaction({
        to: borrower.address,
        value: ethers.parseEther('0.005')
      });
      await fundTx.wait();
    }
  }

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

  // Grant VERIFIER_ROLE to dedicated verifier wallet if provided
  const verifierWallet = process.env.VERIFIER_ADDRESS || deployer.address;
  if (verifierWallet.toLowerCase() !== deployer.address.toLowerCase()) {
    const verifierRole = await kyc.VERIFIER_ROLE();
    await (await kyc.grantRole(verifierRole, verifierWallet)).wait();
    console.log(`Granted VERIFIER_ROLE to ${verifierWallet}`);
  }

  // Move admin and factory ownership to intended admin wallet if specified
  const adminWallet = process.env.ADMIN_ADDRESS;
  if (adminWallet && adminWallet.toLowerCase() !== deployer.address.toLowerCase()) {
    const adminRole = await kyc.DEFAULT_ADMIN_ROLE();
    await (await kyc.grantRole(adminRole, adminWallet)).wait();
    await (await factory.transferOwnership(adminWallet)).wait();
    console.log(`Transferred Admin & Factory Ownership to ${adminWallet}`);
  }

  const ROLE = { NONE: 0, BORROWER: 1, LENDER: 2, SUPPLIER: 3 };
  const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

  await (await kyc.setVerified(borrower.address, ROLE.BORROWER, true, expiresAt, ethers.id('credify-demo:borrower'))).wait();
  for (const [i, s] of [lenderA, lenderB, lenderC].entries()) {
    await (await kyc.setVerified(s.address, ROLE.LENDER, true, expiresAt, ethers.id(`credify-demo:lender-${i + 1}`))).wait();
  }
  for (const [i, s] of [merchantA, merchantB].entries()) {
    await (await kyc.setVerified(s.address, ROLE.SUPPLIER, true, expiresAt, ethers.id(`credify-demo:supplier-${i + 1}`))).wait();
  }

  // Target amounts & durations: on Sepolia use presentation-friendly 10-minute duration and 5-minute funding window
  const target = isSepolia ? ethers.parseEther('0.1') : ethers.parseEther('10');
  const duration = isSepolia ? 600 : 60 * 60 * 24 * 14; // 10 min on Sepolia
  const fundingDuration = isSepolia ? 300 : 60 * 60 * 24 * 7; // 5 min on Sepolia
  const aprBps = 800;
  const maxSpend = isSepolia ? ethers.parseEther('0.08') : ethers.parseEther('8');
  const quorum = 5001;
  const gracePeriod = isSepolia ? 300 : 60 * 60 * 24 * 3; // 5 min grace on Sepolia
  const agreementHash = ethers.id(`Credify Demo Agreement: ${isSepolia ? '0.1' : '10'} ETH, ${isSepolia ? '10 min' : '14 days'}, 8% APR`);
  const merchantCaps = isSepolia
    ? [ethers.parseEther('0.05'), ethers.parseEther('0.03')]
    : [ethers.parseEther('5'), ethers.parseEther('3')];

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
  const currentBlock = await ethers.provider.getBlockNumber();

  const deployment = {
    network: networkName,
    chainId,
    deploymentBlock: currentBlock.toString(),
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

  const fileName = isSepolia ? 'sepolia.json' : 'local.json';
  const path = resolve(process.cwd(), `deployments/${fileName}`);
  await mkdir(resolve(process.cwd(), 'deployments'), { recursive: true });
  await writeFile(path, JSON.stringify(deployment, null, 2));
  console.log(`Saved deployment to ${path}`);
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
