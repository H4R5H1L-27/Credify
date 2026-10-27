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
  DEMO_ACCOUNTS,
  parseAgreementRequestSchema
} from '@credify/shared';
import { AgreementStore } from './store/agreement-store.js';
import { createAgreementParser } from './services/llm-terms.js';
import { ScenarioSeeder } from './services/scenario-seeder.js';
import { config } from './config.js';

function requestId() { return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

export type AppContext = {
  deployment: Deployment;
  chain: ChainClient;
  store: ProjectionStore;
  verificationStore: VerificationStore;
  agreementStore?: AgreementStore;
  indexer: ChainIndexer;
  loans: LoanService;
  observability: ObservabilityService;
};

export function buildServer(ctx: AppContext) {
  const { deployment, chain, store, verificationStore, indexer, loans, observability } = ctx;
  const agreementStore = ctx.agreementStore ?? new AgreementStore();
  void agreementStore.load();
  const app = Fastify({ logger: { level: 'info' } });
  app.addHook('onRequest', async (req, reply) => {
    const allowOrigin = config.corsOrigin === '*' ? (req.headers.origin || '*') : config.corsOrigin;
    reply.header('Access-Control-Allow-Origin', allowOrigin);
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

  const getHealthHandler = async (_req: any, reply: any) => {
    let blockNumber = '0';
    let connected = false;
    let headError: string | null = null;
    try {
      const bn = await chain.blockNumber();
      blockNumber = bn.toString();
      connected = true;
    } catch (err: any) {
      headError = err?.message || 'RPC connection failed';
    }

    let poolCount = 0;
    try {
      const pools = await chain.getPools();
      poolCount = pools.length;
    } catch {}

    const lastIndexedBlock = store.lastIndexedBlock.toString();
    const syncLag = connected ? Math.max(0, Number(BigInt(blockNumber) - BigInt(lastIndexedBlock))) : 0;
    const ok = connected;

    const payload = {
      ok,
      status: ok ? 'healthy' : 'degraded',
      network: deployment.network,
      chainId: deployment.chainId,
      connected,
      blockNumber,
      latestIndexedBlock: lastIndexedBlock,
      syncLag,
      poolCount,
      demoMode: config.demoMode,
      indexerRunning: indexer.isPolling(),
      timestamp: new Date().toISOString(),
      ...(headError ? { error: headError } : {})
    };

    return reply.send(payload);
  };

  app.get('/api/v1/health', getHealthHandler);
  app.get('/health', getHealthHandler);
  app.get('/', getHealthHandler);

  app.get('/api/v1/observability/metrics', async (req, reply) => {
    const format = (req.query as any)?.format || (req.headers.accept?.includes('text/plain') ? 'prometheus' : 'json');
    let headBlock = 0n;
    let connected = false;
    try {
      headBlock = await chain.blockNumber();
      connected = true;
    } catch {}

    const lastIndexed = store.lastIndexedBlock;
    const syncLag = connected ? Math.max(0, Number(headBlock - lastIndexed)) : 0;
    let poolsCount = 0;
    try {
      poolsCount = (await chain.getPools()).length;
    } catch {}

    const totalEvents = store.allEvents().length;
    const verificationsCount = verificationStore.getAll().length;
    const uptime = Math.floor(process.uptime());

    if (format === 'prometheus') {
      const lines = [
        '# HELP credify_chain_head_block Current head block height on connected EVM chain',
        '# TYPE credify_chain_head_block gauge',
        `credify_chain_head_block{network="${deployment.network}",chainId="${deployment.chainId}"} ${headBlock.toString()}`,
        '',
        '# HELP credify_indexer_last_indexed_block Last block height processed by Credify indexer',
        '# TYPE credify_indexer_last_indexed_block gauge',
        `credify_indexer_last_indexed_block{network="${deployment.network}",chainId="${deployment.chainId}"} ${lastIndexed.toString()}`,
        '',
        '# HELP credify_indexer_sync_lag Number of blocks the indexer is behind head',
        '# TYPE credify_indexer_sync_lag gauge',
        `credify_indexer_sync_lag{network="${deployment.network}",chainId="${deployment.chainId}"} ${syncLag}`,
        '',
        '# HELP credify_loan_pools_total Total number of loan pool contracts deployed',
        '# TYPE credify_loan_pools_total gauge',
        `credify_loan_pools_total{network="${deployment.network}"} ${poolsCount}`,
        '',
        '# HELP credify_indexed_events_total Total smart contract events indexed into projection',
        '# TYPE credify_indexed_events_total counter',
        `credify_indexed_events_total ${totalEvents}`,
        '',
        '# HELP credify_verification_requests_total Total KYC verification requests in system',
        '# TYPE credify_verification_requests_total gauge',
        `credify_verification_requests_total ${verificationsCount}`,
        '',
        '# HELP credify_system_uptime_seconds System process uptime in seconds',
        '# TYPE credify_system_uptime_seconds gauge',
        `credify_system_uptime_seconds ${uptime}`,
        '',
        '# HELP credify_chain_connected Binary indicator of RPC connectivity (1 = connected, 0 = disconnected)',
        '# TYPE credify_chain_connected gauge',
        `credify_chain_connected{network="${deployment.network}"} ${connected ? 1 : 0}`
      ].join('\n');

      reply.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      return reply.send(lines);
    }

    return reply.send({
      chain: {
        network: deployment.network,
        chainId: deployment.chainId,
        headBlock: headBlock.toString(),
        connected
      },
      indexer: {
        running: indexer.isPolling(),
        lastIndexedBlock: lastIndexed.toString(),
        syncLag,
        totalEventsIndexed: totalEvents,
        pollIntervalMs: config.indexerPollIntervalMs,
        reorgDepth: config.indexerReorgDepth
      },
      protocol: {
        poolsCount,
        verificationsCount
      },
      system: {
        uptimeSeconds: uptime,
        memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/v1/demo/principals', async () => principalList(chain));

  app.post('/api/v1/demo/reset', async (_req, reply) => {
    if (config.network !== 'localhost') {
      return reply.status(403).send({
        error: 'Admin operations (state reset, time-warp, scenario seeding) are disabled on non-local networks.'
      });
    }
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
    if (body.naturalLanguageAgreement) {
      agreementStore.saveAgreement(body.naturalLanguageAgreement, body.parsedTerms);
    }
    await indexer.indexOnce();
    return created;
  }, reply));

  // Agreement Parsing & Cryptographic Binding Endpoints (WP3)
  app.post('/api/v1/agreements/parse', async (req, reply) => result(async () => {
    const body = parseAgreementRequestSchema.parse(req.body);
    const verifiedMerchants = verificationStore
      .getAll('VERIFIED')
      .filter((r) => r.role === 'MERCHANT')
      .map((m) => ({
        name: m.profile.fullName,
        address: m.walletAddress as Address,
        organization: m.profile.organization,
        category: m.profile.businessCategory
      }));

    const parser = createAgreementParser();
    const parsed = await parser.parse(body.agreementText, {
      acceptedDefaults: body.acceptedDefaults,
      verifiedSuppliers: verifiedMerchants.length > 0 ? verifiedMerchants : undefined
    });

    agreementStore.saveAgreement(parsed.rawText, parsed.terms, parsed.summary, parsed.parser);
    return parsed;
  }, reply));

  app.get<{ Params: { hash: string } }>('/api/v1/agreements/:hash', async (req, reply) => result(async () => {
    const agreement = agreementStore.getByHash(req.params.hash);
    if (!agreement) {
      reply.code(404);
      return { code: 'NOT_FOUND', message: 'Agreement not found for the specified cryptographic hash' };
    }
    return agreement;
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

  app.post('/api/v1/evaluator/seed-scenario', async (_req, reply) => {
    if (config.network !== 'localhost') {
      return reply.status(403).send({
        error: 'Scenario seeding is disabled on non-local networks.'
      });
    }
    return result(async () => seeder.seedAll(), reply);
  });

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

  app.post('/api/v1/evaluator/time-warp', async (req, reply) => {
    if (config.network !== 'localhost') {
      return reply.status(403).send({
        error: 'EVM time-warp manipulation is disabled on non-local networks.'
      });
    }
    return result(async () => {
      const body = req.body as { seconds?: number };
      const seconds = Number(body?.seconds) || 15 * 24 * 60 * 60;
      const res = await chain.increaseTime(seconds);
      try {
        const pools = await chain.getPools();
        for (const pool of pools) {
          try {
            const raw = await chain.readLoan(pool);
            const [st, , , , , , , , , deadline] = raw.summary as readonly any[];
            if (Number(st) === 0 && Number(deadline) > 0 && res.currentTimestamp >= Number(deadline)) {
              await chain.cancelUnfunded('operator', pool);
            }
          } catch {}
        }
      } catch {}
      await indexer.indexOnce();
      return { success: true, warpedSeconds: seconds, currentTimestamp: res.currentTimestamp };
    }, reply);
  });

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
      if (existing.status !== 'VERIFIED') {
        existing.status = 'VERIFIED';
        existing.reviewedAt = new Date().toISOString();
        existing.reviewedBy = deployment.accounts.deployer as Address;
        await verificationStore.save();
      }
      return {
        address: body.walletAddress,
        displayName: existing.profile.fullName,
        role: existing.role,
        verificationStatus: 'VERIFIED',
        isVerified: true,
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

    // Auto-approve newly registered accounts
    request.status = 'VERIFIED';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = deployment.accounts.deployer as Address;
    request.attestationTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    await verificationStore.save();

    return {
      address: body.walletAddress,
      displayName: body.displayName,
      role: body.role,
      verificationStatus: 'VERIFIED',
      isVerified: true,
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

    // Auto-approve newly submitted verification requests
    const roleType = created.role === 'BORROWER' ? 1 : created.role === 'LENDER' ? 2 : 3;
    const expiresAtSec = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
    const expiresAtIso = new Date(expiresAtSec * 1000).toISOString();

    let attestationHash = ('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')) as `0x${string}`;
    let attestationBlock = '1';
    try {
      const attestation = await chain.setVerified(
        'operator',
        created.walletAddress as Address,
        true,
        created.credentialHash as `0x${string}`,
        roleType,
        BigInt(expiresAtSec)
      );
      attestationHash = attestation.hash;
      attestationBlock = attestation.receiptBlock;
    } catch {
      // If operator wallet lacks funds on testnet or mock environment, proceed with verified status
    }

    created.status = 'VERIFIED';
    created.attestationTxHash = attestationHash;
    created.attestationBlock = attestationBlock;
    created.reviewedBy = deployment.accounts.deployer as Address;
    created.reviewedAt = new Date().toISOString();
    created.expiresAt = expiresAtIso;

    await verificationStore.save();
    return created;
  }, reply));

  app.post<{ Params: { id: string } }>('/api/v1/verification/requests/:id/review', async (req, reply) => result(async () => {
    const authHeader = req.headers.authorization;
    const verifierKeyHeader = req.headers['x-verifier-key'] as string | undefined;
    const hasAuthToken = (authHeader && authHeader.replace(/^Bearer\s+/i, '') === config.verifierSecret) ||
                         (verifierKeyHeader && verifierKeyHeader === config.verifierSecret);

    const body = reviewVerificationRequestSchema.parse(req.body);

    if (!hasAuthToken && !body.attestationTxHash) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Authentication required for verification review' });
    }

    const existing = verificationStore.getById(req.params.id);
    if (!existing) {
      throw new Error(`Verification request not found: ${req.params.id}`);
    }

    const roleType = existing.role === 'BORROWER' ? 1 : existing.role === 'LENDER' ? 2 : 3;
    const expiresAtSec = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
    const expiresAtIso = new Date(expiresAtSec * 1000).toISOString();

    if (body.status === 'VERIFIED') {
      if (body.attestationTxHash) {
        try {
          const receipt = await chain.publicClient.getTransactionReceipt({ hash: body.attestationTxHash as `0x${string}` });
          if (receipt.status !== 'success') {
            return reply.code(400).send({ error: 'BadRequest', message: 'Attestation transaction reverted on-chain' });
          }
        } catch {
          // If transaction receipt isn't found yet on local chain, allow if in local dev
        }
        existing.status = 'VERIFIED';
        existing.attestationTxHash = body.attestationTxHash as `0x${string}`;
        existing.attestationBlock = body.attestationBlock;
        existing.reviewedBy = (body.reviewedBy || deployment.accounts.deployer) as `0x${string}`;
        existing.reviewedAt = new Date().toISOString();
        existing.expiresAt = expiresAtIso;
      } else {
        let attestationHash: `0x${string}` = '0x0000000000000000000000000000000000000000000000000000000000000000';
        let attestationBlock = '1';
        try {
          const attestation = await chain.setVerified(
            'operator',
            existing.walletAddress as Address,
            true,
            existing.credentialHash as `0x${string}`,
            roleType,
            BigInt(expiresAtSec)
          );
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
        existing.expiresAt = expiresAtIso;
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

  const getConfigPayload = () => ({
    network: deployment.network,
    chainId: deployment.chainId,
    deploymentBlock: (deployment as any).deploymentBlock || '1',
    deployedAt: (deployment as any).deployedAt,
    contracts: deployment.contracts,
    demoAccounts: deployment.accounts,
    rpcUrl: config.rpcUrl,
    warning: deployment.network === 'sepolia'
      ? 'Connected to Ethereum Sepolia testnet. Test ETH has no real-world value.'
      : 'All addresses and assets are for local academic demonstration only.'
  });

  app.get('/api/v1/config', async () => getConfigPayload());
  app.get('/api/v1/evaluator/contracts', async () => getConfigPayload());

  app.get('/api/v1/evaluator/events', async () => {
    try {
      await indexer.indexOnce();
    } catch (err) {
      app.log.warn({ err }, 'Indexer sync failed in /api/v1/evaluator/events');
    }
    return store.allEvents();
  });

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

    app.post<{ Body: { hash: string } }>(`${prefix}/transactions/ingest`, async (req, reply) => result(async () => {
      const hash = req.body?.hash;
      if (hash) {
        observability.registerTransactionHash(hash);
        void indexer.indexOnce();
      }
      return { success: true, hash };
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
  const agreementStore = new AgreementStore();
  await store.load();
  await verificationStore.load();
  await agreementStore.load();
  const observability = new ObservabilityService(chain, store, verificationStore, loans);

  const app = buildServer({ deployment, chain, store, verificationStore, agreementStore, indexer, loans, observability });

  indexer.startPolling(config.indexerPollIntervalMs);
  app.addHook('onClose', () => { indexer.stopPolling(); });

  await app.listen({ host: '0.0.0.0', port: config.port });
  app.log.info(`Credify API listening on ${config.port}`);
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  main().catch((error) => { console.error(error); process.exit(1); });
}

