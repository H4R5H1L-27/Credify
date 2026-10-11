import { createPublicClient, createWalletClient, http, type Address, type Hash, type PublicClient, type WalletClient } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { foundry, sepolia } from 'viem/chains';
import { readFile } from 'node:fs/promises';
import { config } from '../config.js';
import { factoryAbi, kycAbi, poolAbi, reputationAbi } from './abis.js';

export type Deployment = {
  network: string;
  chainId: number;
  deploymentBlock?: string;
  deployedAt?: string;
  contracts: { kycRegistry: Address; reputationRegistry: Address; loanFactory: Address; sampleLoanPool: Address };
  accounts: { deployer: Address; borrower: Address; lenders: Address[]; merchants: Address[] };
};

export class ChainClient {
  readonly publicClient: PublicClient;
  readonly deployment: Deployment;
  private readonly mnemonic: string;

  constructor(deployment: Deployment) {
    this.deployment = deployment;
    this.mnemonic = config.demoMnemonic;
    const chain = this.deployment.chainId === 11155111 ? sepolia : foundry;
    this.publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
      pollingInterval: this.deployment.chainId === 11155111 ? 4000 : 100
    });
  }

  accountForPrincipalId(id: string) {
    const indexMap: Record<string, number> = { operator: 0, borrower: 1, 'lender-alpha': 2, 'lender-beta': 3, 'lender-gamma': 4, 'merchant-a': 5, 'merchant-b': 6 };
    return mnemonicToAccount(this.mnemonic, { addressIndex: indexMap[id] ?? 0 });
  }

  walletForPrincipalId(id: string): WalletClient {
    const account = this.accountForPrincipalId(id);
    const chain = this.deployment.chainId === 11155111 ? sepolia : foundry;
    return createWalletClient({ account, chain, transport: http(config.rpcUrl) });
  }

  async blockNumber() { return this.publicClient.getBlockNumber({ cacheTime: 0 }); }

  async createLoan(principalId: string, terms: {
    borrower: Address;
    targetWei: bigint;
    durationSeconds: number;
    fundingDurationSeconds: number;
    aprBps: number;
    maxSpendWei: bigint;
    defaultQuorumBps: number;
    gracePeriodSeconds: number;
    agreementHash: `0x${string}`;
    merchants: Address[];
    merchantCapsWei: bigint[];
  }): Promise<{ hash: Hash; receiptBlock: string }> {
    const wallet = this.walletForPrincipalId(principalId);
    const contractTerms = {
      borrower: terms.borrower,
      targetWei: terms.targetWei,
      durationSeconds: BigInt(terms.durationSeconds),
      fundingDurationSeconds: BigInt(terms.fundingDurationSeconds),
      aprBps: BigInt(terms.aprBps),
      maxSpendWei: terms.maxSpendWei,
      defaultQuorumBps: BigInt(terms.defaultQuorumBps),
      gracePeriodSeconds: BigInt(terms.gracePeriodSeconds),
      agreementHash: terms.agreementHash,
      merchants: terms.merchants,
      merchantCapsWei: terms.merchantCapsWei
    };
    const { request } = await this.publicClient.simulateContract({
      address: this.deployment.contracts.loanFactory,
      abi: factoryAbi,
      functionName: 'createLoan',
      args: [contractTerms],
      account: wallet.account!
    });
    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receiptBlock: receipt.blockNumber.toString() };
  }

  async contribute(principalId: string, pool: Address, amountWei: bigint) {
    const wallet = this.walletForPrincipalId(principalId);
    const { request } = await this.publicClient.simulateContract({ address: pool, abi: poolAbi, functionName: 'contribute', args: [], value: amountWei, account: wallet.account! });
    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receiptBlock: receipt.blockNumber.toString() };
  }

  async spend(principalId: string, pool: Address, merchant: Address, amountWei: bigint, category: string) {
    const wallet = this.walletForPrincipalId(principalId);
    const categoryHash = `0x${Buffer.from(category.slice(0, 32)).toString('hex').padEnd(64, '0')}` as `0x${string}`;
    const { request } = await this.publicClient.simulateContract({ address: pool, abi: poolAbi, functionName: 'spend', args: [merchant, amountWei, categoryHash], account: wallet.account! });
    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receiptBlock: receipt.blockNumber.toString() };
  }

  async repay(principalId: string, pool: Address, amountWei: bigint) {
    const wallet = this.walletForPrincipalId(principalId);
    const { request } = await this.publicClient.simulateContract({ address: pool, abi: poolAbi, functionName: 'repay', args: [], value: amountWei, account: wallet.account! });
    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receiptBlock: receipt.blockNumber.toString() };
  }

  async claim(principalId: string, pool: Address) {
    const wallet = this.walletForPrincipalId(principalId);
    const { request } = await this.publicClient.simulateContract({ address: pool, abi: poolAbi, functionName: 'claimRepayment', args: [], account: wallet.account! });
    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receiptBlock: receipt.blockNumber.toString() };
  }

  async cancelUnfunded(principalId: string, pool: Address) {
    const wallet = this.walletForPrincipalId(principalId);
    const { request } = await this.publicClient.simulateContract({ address: pool, abi: poolAbi, functionName: 'cancelUnfunded', args: [], account: wallet.account! });
    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receiptBlock: receipt.blockNumber.toString() };
  }

  async refund(principalId: string, pool: Address) {
    const wallet = this.walletForPrincipalId(principalId);
    const { request } = await this.publicClient.simulateContract({ address: pool, abi: poolAbi, functionName: 'claimFundingRefund', args: [], account: wallet.account! });
    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receiptBlock: receipt.blockNumber.toString() };
  }

  async voteDefault(principalId: string, pool: Address) {
    const wallet = this.walletForPrincipalId(principalId);
    const { request } = await this.publicClient.simulateContract({ address: pool, abi: poolAbi, functionName: 'voteDefault', args: [], account: wallet.account! });
    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receiptBlock: receipt.blockNumber.toString() };
  }

  async increaseTime(seconds: number) {
    await (this.publicClient as any).request({
      method: 'evm_increaseTime',
      params: [seconds]
    });
    await (this.publicClient as any).request({
      method: 'evm_mine',
      params: []
    });
    const block = await this.publicClient.getBlock();
    return { currentTimestamp: Number(block.timestamp) };
  }

  async getPools(): Promise<Address[]> {
    const pools = await this.publicClient.readContract({ address: this.deployment.contracts.loanFactory, abi: factoryAbi, functionName: 'getPools' });
    return [...pools];
  }

  async readLoan(pool: Address) {
    const [summary, borrower, merchants] = await Promise.all([
      this.publicClient.readContract({ address: pool, abi: poolAbi, functionName: 'getSummary' }),
      this.publicClient.readContract({ address: pool, abi: poolAbi, functionName: 'borrower' }),
      this.publicClient.readContract({ address: pool, abi: poolAbi, functionName: 'getApprovedMerchants' })
    ]);
    return { pool, summary, borrower, merchants };
  }

  async readLenderInfo(pool: Address, lender: Address) {
    return this.publicClient.readContract({ address: pool, abi: poolAbi, functionName: 'getLenderInfo', args: [lender] });
  }

  async readLenderClaimed(pool: Address, lender: Address): Promise<bigint> {
    return this.publicClient.readContract({ address: pool, abi: poolAbi, functionName: 'claimed', args: [lender] });
  }

  async reputation(address: Address) {
    return this.publicClient.readContract({ address: this.deployment.contracts.reputationRegistry, abi: reputationAbi, functionName: 'getScore', args: [address] });
  }

  async verified(address: Address, roleType?: number) {
    if (roleType !== undefined) {
      return this.publicClient.readContract({
        address: this.deployment.contracts.kycRegistry,
        abi: kycAbi,
        functionName: 'isVerified',
        args: [address, roleType]
      });
    }
    return this.publicClient.readContract({
      address: this.deployment.contracts.kycRegistry,
      abi: kycAbi,
      functionName: 'isVerified',
      args: [address]
    });
  }

  async getKycRecord(address: Address) {
    return this.publicClient.readContract({
      address: this.deployment.contracts.kycRegistry,
      abi: kycAbi,
      functionName: 'getRecord',
      args: [address]
    });
  }

  async setVerified(
    operatorPrincipalId: string,
    address: Address,
    isVerified: boolean,
    ref: `0x${string}`,
    roleType = 1,
    expiresAt = BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60)
  ) {
    const wallet = this.walletForPrincipalId(operatorPrincipalId);
    const { request } = await this.publicClient.simulateContract({
      address: this.deployment.contracts.kycRegistry,
      abi: kycAbi,
      functionName: 'setVerified',
      args: [address, roleType, isVerified, expiresAt, ref],
      account: wallet.account!
    });
    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receiptBlock: receipt.blockNumber.toString() };
  }

  async revokeVerification(operatorPrincipalId: string, address: Address) {
    const wallet = this.walletForPrincipalId(operatorPrincipalId);
    const { request } = await this.publicClient.simulateContract({
      address: this.deployment.contracts.kycRegistry,
      abi: kycAbi,
      functionName: 'revokeVerification',
      args: [address],
      account: wallet.account!
    });
    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receiptBlock: receipt.blockNumber.toString() };
  }
}

export async function loadDeployment(): Promise<Deployment> {
  const raw = await readFile(config.deploymentFile, 'utf8');
  return JSON.parse(raw) as Deployment;
}

