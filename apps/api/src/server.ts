import Fastify from 'fastify';
import type { Address } from 'viem';
import { fileURLToPath } from 'node:url';
import { loadDeployment, ChainClient, type Deployment } from './chain/client.js';
import { ProjectionStore } from './store/projection.js';
import { VerificationStore } from './store/verification.js';
import { ChainIndexer } from './chain/indexer.js';
import { LoanService } from './services/loan-service.js';
import { ObservabilityService } from './services/observability-service.js';
import { principalList, principalForAddress, principalDefinitions } from './services/principals.js';
import {
  createLoanSchema,
  contributeSchema,
  defaultVoteSchema,
  repaySchema,
  spendSchema,
  createVerificationRequestSchema,
  reviewVerificationRequestSchema,
  registerIdentitySchema,
  DEMO_ACCOUNTS
} from '@credify/shared';
import { ScenarioSeeder } from './services/scenario-seeder.js';
import { config } from './config.js';

function requestId() { return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

export type AppContext = {
  deployment: Deployment;
  chain: ChainClient;
  store: ProjectionStore;
  verificationStore: VerificationStore;
  indexer: ChainIndexer;
  loans: LoanService;
  observability: ObservabilityService;
};

export function buildServer(ctx: AppContext) {
  const { deployment, chain, store, verificationStore, indexer, loans, observability } = ctx;
  const app = Fastify({ logger: { level: 'info' } });
  app.addHook('onRequest', async (req, reply) => {
    reply.header('Access-Control-Allow-Origin', config.corsOrigin);
    reply.header('Access-Control-Allow-Headers', 'content-type, x-demo-principal');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (req.method === 'OPTIONS') return reply.code(204).send();
    return undefined;
  });

  const result = async <T>(fn: () => Promise<T>, reply: any) => {
    const rid = requestId();
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const status = /UNKNOWN_PRINCIPAL|UNKNOWN_MERCHANT/.test(message) ? 400 : 422;
      reply.code(status);
      return { code: message.startsWith('Contract') ? 'CHAIN_REVERT' : 'REQUEST_FAILED', message, requestId: rid };
    }
  };

  app.get('/health', async () => {
    const blockNumber = await chain.blockNumber();
    const pools = await chain.getPools();
    return { ok: true, network: deployment.network, chainId: deployment.chainId, blockNumber: blockNumber.toString(), poolCount: pools.length, demoMode: config.demoMode };
  });

  app.get('/api/v1/demo/principals', async () => principalList(chain));

  app.post('/api/v1/demo/reset', async (_req, reply) => {
    await store.reset();
    await verificationStore.reset();
    await indexer.indexOnce();
    return reply.send({ ok: true, indexedThrough: store.lastIndexedBlock.toString() });
  });

  app.post('/api/v1/evaluator/reindex', async (_req, reply) => {
    await indexer.indexOnce();
    return reply.send({ ok: true, indexedThrough: store.lastIndexedBlock.toString() });
  });

  app.get('/api/v1/loans', async () => { await indexer.indexOnce(); return loans.list(); });

  app.get<{ Params: { pool: string } }>('/api/v1/loans/:pool', async (req, reply) => result(async () => {
    await indexer.indexOnce();
    return loans.detail(req.params.pool as Address);
  }, reply));

  app.post('/api/v1/loans', async (req, reply) => result(async () => {
    const body = createLoanSchema.parse(req.body);
    const created = await loans.create(body);
    await indexer.indexOnce();
    return created;
  }, reply));

  app.post<{ Params: { pool: string } }>('/api/v1/loans/:pool/contribute', async (req, reply) => result(async () => {
    const body = contributeSchema.parse(req.body);
    const tx = await loans.contribute(req.params.pool as Address, body);
    await indexer.indexOnce();
    return { ...tx, loanId: req.params.pool };
  }, reply));

  app.post<{ Params: { pool: string } }>('/api/v1/loans/:pool/spend', async (req, reply) => result(async () => {
    const body = spendSchema.parse(req.body);
    const tx = await loans.spend(req.params.pool as Address, body.borrowerId, body.merchant as Address, BigInt(body.amountWei), body.category);
    await indexer.indexOnce();
    return { ...tx, loanId: req.params.pool };
  }, reply));

  app.post<{ Params: { pool: string } }>('/api/v1/loans/:pool/repay', async (req, reply) => result(async () => {
    const body = repaySchema.parse(req.body);
    const tx = await loans.repay(req.params.pool as Address, body.borrowerId, BigInt(body.amountWei));
    await indexer.indexOnce();
    return { ...tx, loanId: req.params.pool };
  }, reply));

  app.post<{ Params: { pool: string } }>('/api/v1/loans/:pool/claim', async (req, reply) => result(async () => {
    const body = req.body as { lenderId: string };
    const tx = await loans.claim(req.params.pool as Address, body.lenderId);
    await indexer.indexOnce();
    return { ...tx, loanId: req.params.pool };
  }, reply));

  app.post<{ Params: { pool: string } }>('/api/v1/loans/:pool/cancel', async (req, reply) => result(async () => {
    const body = req.body as { operatorId: string };
    const tx = await loans.cancelUnfunded(req.params.pool as Address, body.operatorId);
    await indexer.indexOnce();
    return { ...tx, loanId: req.params.pool };
  }, reply));

  app.post<{ Params: { pool: string } }>('/api/v1/loans/:pool/refund', async (req, reply) => result(async () => {
    const body = req.body as { lenderId: string };
    const tx = await loans.refund(req.params.pool as Address, body.lenderId);
    await indexer.indexOnce();
    return { ...tx, loanId: req.params.pool };
  }, reply));

  app.post<{ Params: { pool: string } }>('/api/v1/loans/:pool/default-vote', async (req, reply) => result(async () => {
    const body = defaultVoteSchema.parse(req.body);
    const tx = await loans.voteDefault(req.params.pool as Address, body.lenderId);
    await indexer.indexOnce();
    return { ...tx, loanId: req.params.pool };
  }, reply));

  // Evaluator Simulation & Time-Warp Controls
  const seeder = new ScenarioSeeder(chain, loans, store, verificationStore, indexer);

  app.post('/api/v1/evaluator/seed-scenario', async (_req, reply) => result(async () => {
    return seeder.seedAll();
  }, reply));

  app.get('/api/v1/evaluator/wallets', async (_req, reply) => result(async () => {
    const wallets = await Promise.all(DEMO_ACCOUNTS.map(async (acc) => {
      const address = acc.address as Address;
      let balanceWei = '0';
      try {
        const bal = await chain.publicClient.getBalance({ address });
        balanceWei = bal.toString();
      } catch {
        balanceWei = '0';
      }

      let isVerified = false;
      try {
        isVerified = await chain.verified(address);
      } catch {
        isVerified = false;
      }

      let reputationScore: number | undefined = undefined;
      if (acc.role === 'BORROWER') {
        try {
          const rep = await chain.reputation(address);
          reputationScore = Number(rep[0]);
        } catch {
          reputationScore = 50;
        }
      }

      return {
        id: acc.id,
        displayName: acc.displayName,
        role: acc.role,
        address: acc.address,
        description: acc.description,
        balanceWei,
        balanceEth: (Number(balanceWei) / 1e18).toFixed(4),
        isVerified,
        reputationScore,
      };
    }));
    return wallets;
  }, reply));

  app.post('/api/v1/evaluator/time-warp', async (req, reply) => result(async () => {
    const body = req.body as { seconds?: number };
    const seconds = Number(body?.seconds) || 15 * 24 * 60 * 60;
    const res = await chain.increaseTime(seconds);
    await indexer.indexOnce();
    return { success: true, warpedSeconds: seconds, currentTimestamp: res.currentTimestamp };
  }, reply));

  app.get('/api/v1/evaluator/time', async (req, reply) => result(async () => {
    const block = await chain.publicClient.getBlock();
    return { currentTimestamp: Number(block.timestamp), blockNumber: block.number.toString() };
  }, reply));

  app.get<{ Params: { pool: string } }>('/api/v1/loans/:pool/activity', async (req) => {
    await indexer.indexOnce();
    const pool = req.params.pool.toLowerCase();
    const all = store.allEvents();

    // 1. Direct pool events
    const poolEvents = all.filter(e => e.loanId.toLowerCase() === pool);

    // 2. Cross-contract lifecycle events on the same transaction hashes
    // (e.g. ReputationUpdated emitted in repay() or voteDefault() txs)
    const txHashes = new Set(poolEvents.map(e => e.transactionHash.toLowerCase()));
    const relatedEvents = all.filter(e =>
      !poolEvents.some(pe => pe.id === e.id) &&
      txHashes.has(e.transactionHash.toLowerCase())
    );

    const combined = [...poolEvents, ...relatedEvents];
    // Sort chronologically from block 0 onwards
    combined.sort((a, b) => {
      const bA = BigInt(a.blockNumber);
      const bB = BigInt(b.blockNumber);
      if (bA !== bB) return Number(bA - bB);
      return a.id.localeCompare(b.id);
    });

    return combined;
  });


  app.get<{ Params: { address: string } }>('/api/v1/reputation/:address', async (req, reply) => result(async () => {
    await indexer.indexOnce();
    const address = req.params.address as Address;
    const baseRep = await loans.reputation(address);

    const addressLower = address.toLowerCase();
    const allEvents = store.allEvents();
    const repEvents = allEvents
      .filter(evt =>
        evt.eventName === 'ReputationUpdated' &&
        evt.data.borrower &&
        evt.data.borrower.toLowerCase() === addressLower
      )
      .sort((a, b) => Number(BigInt(a.blockNumber) - BigInt(b.blockNumber)));

    const successfulAgreements: string[] = [];
    const defaultedAgreements: string[] = [];
    let latestOutcome: any = undefined;
    let prevScore = 50;

    for (const evt of repEvents) {
      const successful = evt.data.successful === 'true';
      const scoreAfter = Number(evt.data.score || 50);
      const matchingLoanEvt = allEvents.find(
        e => e.transactionHash.toLowerCase() === evt.transactionHash.toLowerCase() &&
             e.loanId !== 'reputation' && e.loanId !== 'kyc'
      );
      const loanId = matchingLoanEvt ? matchingLoanEvt.loanId : evt.loanId;
      const delta = scoreAfter - prevScore;
      prevScore = scoreAfter;

      if (successful) {
        if (loanId && loanId !== 'reputation' && !successfulAgreements.includes(loanId)) {
          successfulAgreements.push(loanId);
        }
      } else {
        if (loanId && loanId !== 'reputation' && !defaultedAgreements.includes(loanId)) {
          defaultedAgreements.push(loanId);
        }
      }

      latestOutcome = {
        outcome: successful ? 'SUCCESS' : 'DEFAULT',
        loanId,
        scoreAfter,
        delta: successful ? 8 : -20,
        timestamp: evt.timestamp,
        transactionHash: evt.transactionHash,
        summary: successful
          ? `Full repayment verified on Agreement ${loanId.slice(0, 6)}...${loanId.slice(-4)} (+8 pts)`
          : `Consensus default recorded on Agreement ${loanId.slice(0, 6)}...${loanId.slice(-4)} (-20 pts)`
      };
    }

    return {
      ...baseRep,
      latestOutcome,
      successfulAgreements,
      defaultedAgreements,
    };
  }, reply));

  app.get<{ Params: { address: string } }>('/api/v1/reputation/:address/history', async (req, reply) => result(async () => {
    await indexer.indexOnce();
    const addressLower = req.params.address.toLowerCase();
    const allEvents = store.allEvents();

    // Find all ReputationUpdated events for this borrower, sorted chronologically
    const repEvents = allEvents
      .filter(evt =>
        evt.eventName === 'ReputationUpdated' &&
        evt.data.borrower &&
        evt.data.borrower.toLowerCase() === addressLower
      )
      .sort((a, b) => Number(BigInt(a.blockNumber) - BigInt(b.blockNumber)));

    let prevScore = 50;
    const history = repEvents.map((evt) => {
      const successful = evt.data.successful === 'true';
      const scoreAfter = Number(evt.data.score || 50);
      const successfulLoans = Number(evt.data.successes || 0);
      const defaultedLoans = Number(evt.data.defaults || 0);

      // Find matching loan event on same tx to extract real pool address
      const matchingLoanEvt = allEvents.find(
        e => e.transactionHash.toLowerCase() === evt.transactionHash.toLowerCase() &&
             e.loanId !== 'reputation' && e.loanId !== 'kyc'
      );
      const loanId = matchingLoanEvt ? matchingLoanEvt.loanId : evt.loanId;
      const scoreBefore = prevScore;
      const delta = successful ? 8 : -20;
      prevScore = scoreAfter;

      const outcome = (successful ? 'SUCCESS' : 'DEFAULT') as 'SUCCESS' | 'DEFAULT';
      const summary = successful
        ? `Successful agreement repayment confirmed on-chain. Reputation updated from ${scoreBefore} to ${scoreAfter} (+8 pts).`
        : `Consensus default confirmed on-chain. Reputation updated from ${scoreBefore} to ${scoreAfter} (-20 pts).`;

      return {
        id: evt.id,
        loanId,
        outcome,
        scoreBefore,
        scoreAfter,
        delta,
        successfulLoans,
        defaultedLoans,
        blockNumber: evt.blockNumber,
        transactionHash: evt.transactionHash,
        timestamp: evt.timestamp,
        summary,
        agreementStatus: successful ? 'REPAID' : 'DEFAULTED'
      };
    });

    return history;
  }, reply));



  // Identity & Wallet Resolution
  app.get<{ Params: { address: string } }>('/api/v1/identity/:address', async (req, reply) => result(async () => {
    const address = req.params.address as Address;
    const principal = await principalForAddress(chain, address);
    
    let isVerified = false;
    try {
      isVerified = await chain.verified(address);
    } catch {
      isVerified = false;
    }

    const activeRequest = verificationStore.getByAddress(address);

    let balanceWei = '0';
    try {
      const bal = await chain.publicClient.getBalance({ address });
      balanceWei = bal.toString();
    } catch {
      balanceWei = '0';
    }

    let role: any = 'UNREGISTERED';
    let displayName = 'Unregistered Account';

    if (principal) {
      role = principal.role;
      displayName = principal.displayName;
    } else if (activeRequest) {
      role = activeRequest.role;
      displayName = activeRequest.profile.fullName;
    }

    let verificationStatus = 'NOT_STARTED';
    if (activeRequest?.status === 'REJECTED') {
      verificationStatus = 'REJECTED';
      isVerified = false;
    } else if (isVerified) {
      verificationStatus = 'VERIFIED';
    } else if (activeRequest) {
      verificationStatus = activeRequest.status;
      if (activeRequest.status === 'VERIFIED') {
        isVerified = true;
      }
    }

    let reputationScore: number | undefined;
    if (role === 'BORROWER') {
      try {
        const rep = await chain.reputation(address);
        reputationScore = rep[0];
      } catch {
        reputationScore = 50;
      }
    }

    return {
      address,
      displayName,
      role,
      verificationStatus,
      isVerified,
      activeRequest,
      reputationScore,
      balanceWei,
    };
  }, reply));

  app.post('/api/v1/identity/register', async (req, reply) => result(async () => {
    const body = registerIdentitySchema.parse(req.body);
    const existing = verificationStore.getByAddress(body.walletAddress);
    if (existing) {
      return {
        address: body.walletAddress,
        displayName: existing.profile.fullName,
        role: existing.role,
        verificationStatus: existing.status,
        isVerified: existing.status === 'VERIFIED',
        activeRequest: existing,
      };
    }

    const request = verificationStore.register({
      walletAddress: body.walletAddress,
      role: body.role,
      profile: {
        fullName: body.displayName,
        organization: body.organization,
        role: body.role,
        referenceId: `REG-${body.role.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
        businessCategory: body.businessCategory,
      }
    });
    await verificationStore.save();

    return {
      address: body.walletAddress,
      displayName: body.displayName,
      role: body.role,
      verificationStatus: request.status,
      isVerified: false,
      activeRequest: request,
    };
  }, reply));

  // Verification Lifecycle API
  app.get<{ Querystring: { status?: any } }>('/api/v1/verification/requests', async (req) => {
    return verificationStore.getAll(req.query?.status);
  });

  app.get<{ Params: { address: string } }>('/api/v1/verification/requests/:address', async (req, reply) => result(async () => {
    const reqFound = verificationStore.getByAddress(req.params.address);
    if (!reqFound) {
      return reply.code(404).send({ error: 'Not Found', message: 'No verification request found for address' });
    }
    return reqFound;
  }, reply));

  app.post('/api/v1/verification/requests', async (req, reply) => result(async () => {
    const body = createVerificationRequestSchema.parse(req.body);
    const created = verificationStore.create(body);
    await verificationStore.save();
    return created;
  }, reply));

  app.post<{ Params: { id: string } }>('/api/v1/verification/requests/:id/review', async (req, reply) => result(async () => {
    const body = reviewVerificationRequestSchema.parse(req.body);
    const existing = verificationStore.getById(req.params.id);
    if (!existing) {
      throw new Error(`Verification request not found: ${req.params.id}`);
    }

    if (body.status === 'VERIFIED') {
      if (body.attestationTxHash) {
        existing.status = 'VERIFIED';
        existing.attestationTxHash = body.attestationTxHash as `0x${string}`;
        existing.attestationBlock = body.attestationBlock;
        existing.reviewedBy = (body.reviewedBy || deployment.accounts.deployer) as `0x${string}`;
        existing.reviewedAt = new Date().toISOString();
      } else {
        let attestationHash: `0x${string}` = '0x0000000000000000000000000000000000000000000000000000000000000000';
        let attestationBlock = '1';
        try {
          const attestation = await chain.setVerified('operator', existing.walletAddress as Address, true, existing.credentialHash as `0x${string}`);
          attestationHash = attestation.hash;
          attestationBlock = attestation.receiptBlock;
        } catch (err: any) {
          if (err?.message?.includes('AddressAlreadyInState')) {
            const blk = await chain.blockNumber();
            attestationBlock = blk.toString();
          } else {
            throw err;
          }
        }
        existing.status = 'VERIFIED';
        existing.attestationTxHash = attestationHash;
        existing.attestationBlock = attestationBlock;
        existing.reviewedBy = deployment.accounts.deployer;
        existing.reviewedAt = new Date().toISOString();
      }
      await indexer.indexOnce();
    } else {
      existing.status = 'REJECTED';
      existing.rejectionReason = body.rejectionReason || 'Verification requirements not satisfied.';
      existing.reviewedBy = (body.reviewedBy || deployment.accounts.deployer) as `0x${string}`;
      existing.reviewedAt = new Date().toISOString();
    }

    await verificationStore.save();
    return existing;
  }, reply));

  // Suppliers & Merchant Directory
  app.get('/api/v1/suppliers', async () => {
    await indexer.indexOnce();
    const loansList = await loans.list();
    const merchantRequests = verificationStore.getAll().filter(r => r.role === 'MERCHANT');
    
    const knownMerchants = deployment.accounts.merchants.map((addr, i) => {
      const def = principalDefinitions.find(p => p.id === `merchant-${i === 0 ? 'a' : 'b'}`);
      return {
        address: addr,
        businessName: def?.displayName || `Approved Supplier #${i + 1}`,
        category: i === 0 ? 'Laboratory Materials & Sensors' : 'Precision Optical & Computing Gear',
      };
    });

    const supplierMap = new Map<string, { address: string; businessName: string; category: string }>();
    for (const m of knownMerchants) {
      supplierMap.set(m.address.toLowerCase(), m);
    }
    for (const r of merchantRequests) {
      if (!supplierMap.has(r.walletAddress.toLowerCase())) {
        supplierMap.set(r.walletAddress.toLowerCase(), {
          address: r.walletAddress,
          businessName: r.profile.fullName,
          category: r.profile.businessCategory || 'Equipment & Materials',
        });
      }
    }

    for (const loan of loansList) {
      for (const m of loan.merchants || []) {
        if (!supplierMap.has(m.toLowerCase())) {
          supplierMap.set(m.toLowerCase(), {
            address: m,
            businessName: `Approved Supplier (${m.slice(0, 6)}...${m.slice(-4)})`,
            category: 'Contract Allowlisted Supplier',
          });
        }
      }
    }

    const allEvents = store.allEvents();

    const suppliers = await Promise.all(Array.from(supplierMap.values()).map(async (sup) => {
      let isVerified = false;
      try {
        isVerified = await chain.verified(sup.address as Address);
      } catch {
        isVerified = false;
      }
      
      let authorizedLoansCount = 0;
      let totalDisbursedWei = 0n;

      for (const loan of loansList) {
        if (loan.merchants && loan.merchants.some(m => m.toLowerCase() === sup.address.toLowerCase())) {
          authorizedLoansCount++;
        }
      }

      for (const evt of allEvents) {
        if (evt.eventName === 'SpendExecuted') {
          const recipient = evt.data.merchant;
          if (recipient && recipient.toLowerCase() === sup.address.toLowerCase()) {
            totalDisbursedWei += BigInt(evt.data.amount || '0');
          }
        }
      }

      return {
        address: sup.address,
        businessName: sup.businessName,
        category: sup.category,
        verified: isVerified,
        authorizedLoansCount,
        totalDisbursedWei: totalDisbursedWei.toString(),
      };
    }));

    return suppliers;
  });

  // Dedicated Supplier Disbursements Ledger API
  app.get<{ Params: { address: string } }>('/api/v1/suppliers/:address/disbursements', async (req, reply) => result(async () => {
    await indexer.indexOnce();
    const addressLower = req.params.address.toLowerCase();
    const allEvents = store.allEvents();
    const loansList = await loans.list();
    const loanMap = new Map(loansList.map(l => [l.address.toLowerCase(), l]));

    const spendEvents = allEvents.filter(
      evt => evt.eventName === 'SpendExecuted' &&
             evt.data.merchant &&
             evt.data.merchant.toLowerCase() === addressLower
    );

    let totalDisbursedWei = 0n;
    const disbursements = spendEvents.map(evt => {
      const amountWei = evt.data.amount || '0';
      totalDisbursedWei += BigInt(amountWei);
      const loan = loanMap.get(evt.loanId.toLowerCase());

      const rawCategory = evt.data.category || '';
      let categoryText = evt.data.categoryText;
      if (!categoryText || categoryText === 'Procurement') {
        if (rawCategory.startsWith('0x')) {
          let str = '';
          for (let i = 2; i < rawCategory.length; i += 2) {
            const code = parseInt(rawCategory.slice(i, i + 2), 16);
            if (code >= 32 && code <= 126) str += String.fromCharCode(code);
          }
          categoryText = str.trim() || 'General Procurement';
        } else {
          categoryText = rawCategory || 'General Procurement';
        }
      }

      return {
        id: evt.id,
        loanId: evt.loanId,
        borrowerAddress: loan?.borrower.walletAddress || '',
        borrowerName: loan?.borrower.displayName || 'Borrower',
        amountWei,
        amountEth: (Number(amountWei) / 1e18).toString(),
        category: rawCategory,
        categoryText,
        blockNumber: evt.blockNumber,
        transactionHash: evt.transactionHash,
        timestamp: evt.timestamp,
        summary: evt.summary,
      };
    });

    const authorizedAgreements = loansList.filter(
      l => l.merchants && l.merchants.some(m => m.toLowerCase() === addressLower)
    );

    return {
      supplierAddress: req.params.address,
      disbursements,
      totalDisbursedWei: totalDisbursedWei.toString(),
      totalDisbursedEth: (Number(totalDisbursedWei) / 1e18).toString(),
      count: disbursements.length,
      authorizedAgreementsCount: authorizedAgreements.length,
    };
  }, reply));

  app.get('/api/v1/evaluator/contracts', async () => ({
    network: deployment.network,
    chainId: deployment.chainId,
    contracts: deployment.contracts,
    demoAccounts: deployment.accounts,
    warning: 'All addresses and assets are for local academic demonstration only.'
  }));

  app.get('/api/v1/evaluator/events', async () => { await indexer.indexOnce(); return store.allEvents(); });

  // Technical Console Observability Endpoints
  const registerConsoleRoutes = (prefix: string) => {
    app.get(`${prefix}/network`, async (_req, reply) => result(async () => {
      return observability.getNetwork();
    }, reply));

    app.get<{ Querystring: { limit?: string } }>(`${prefix}/blocks`, async (req, reply) => result(async () => {
      const limit = req.query?.limit ? parseInt(req.query.limit, 10) : 10;
      return observability.getBlocks(limit);
    }, reply));

    app.get<{ Params: { number: string } }>(`${prefix}/blocks/:number`, async (req, reply) => result(async () => {
      const blk = await observability.getBlock(req.params.number);
      if (!blk) {
        return reply.code(404).send({ error: 'Not Found', message: `Block not found: ${req.params.number}` });
      }
      return blk;
    }, reply));

    app.get<{ Querystring: { limit?: string; address?: string; pool?: string } }>(`${prefix}/transactions`, async (req, reply) => result(async () => {
      const limit = req.query?.limit ? parseInt(req.query.limit, 10) : 20;
      return observability.getTransactions(limit, req.query?.address, req.query?.pool);
    }, reply));

    app.get<{ Params: { hash: string } }>(`${prefix}/transactions/:hash`, async (req, reply) => result(async () => {
      const tx = await observability.getTransaction(req.params.hash);
      if (!tx) {
        return reply.code(404).send({ error: 'Not Found', message: `Transaction not found: ${req.params.hash}` });
      }
      return tx;
    }, reply));

    app.get(`${prefix}/contracts`, async (_req, reply) => result(async () => {
      return observability.getContracts();
    }, reply));

    app.get<{ Params: { address: string } }>(`${prefix}/contracts/:address`, async (req, reply) => result(async () => {
      const contract = await observability.getContractDetail(req.params.address);
      if (!contract) {
        return reply.code(404).send({ error: 'Not Found', message: `Contract not found: ${req.params.address}` });
      }
      return contract;
    }, reply));

    app.get<{ Querystring: { contract?: string; eventName?: string; actor?: string; limit?: string } }>(`${prefix}/events`, async (req, reply) => result(async () => {
      await indexer.indexOnce();
      const limit = req.query?.limit ? parseInt(req.query.limit, 10) : 50;
      const res = observability.getEvents({
        contract: req.query?.contract,
        eventName: req.query?.eventName,
        actor: req.query?.actor,
        limit,
      });
      req.log.info({ query: req.query, eventsCount: res.length }, 'console events requested');
      return res;
    }, reply));

    app.get(`${prefix}/indexer`, async (_req, reply) => result(async () => {
      await indexer.indexOnce();
      return observability.getIndexerState();
    }, reply));

    app.get(`${prefix}/verification`, async (_req, reply) => result(async () => {
      return observability.getVerifications();
    }, reply));

    app.get(`${prefix}/agreements`, async (_req, reply) => result(async () => {
      await indexer.indexOnce();
      return observability.getAgreements();
    }, reply));
  };

  registerConsoleRoutes('/api/v1/console');
  registerConsoleRoutes('/api/console');

  return app;
}

async function main() {
  const deployment = await loadDeployment();
  const chain = new ChainClient(deployment);
  const store = new ProjectionStore();
  const verificationStore = new VerificationStore();
  const indexer = new ChainIndexer(chain, store);
  const loans = new LoanService(chain, store);
  await store.load();
  await verificationStore.load();
  const observability = new ObservabilityService(chain, store, verificationStore, loans);

  const app = buildServer({ deployment, chain, store, verificationStore, indexer, loans, observability });

  setInterval(() => { indexer.indexOnce().catch((e) => app.log.error(e)); }, 2500).unref();

  await app.listen({ host: '0.0.0.0', port: config.port });
  app.log.info(`Credify API listening on ${config.port}`);
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  main().catch((error) => { console.error(error); process.exit(1); });
}

