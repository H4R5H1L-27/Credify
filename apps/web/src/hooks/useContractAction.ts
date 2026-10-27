import { useState } from 'react';
import { useWriteContract, usePublicClient } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { type Address, stringToHex, pad, decodeEventLog } from 'viem';
import { factoryAbi, poolAbi, kycAbi, type TermSheet } from '@credify/shared';
import { useWallet } from '../context/WalletContext';
import { useIdentity } from '../context/IdentityContext';
import { api, consoleApi } from '../lib/api';
import { trackSubmittedTx, trackConfirmedTx } from '../lib/clientTxTracker';
import { queryKeys, useEvaluatorContracts } from './useCredify';
import type { TxState, TxLifecycleStep, TxErrorCategory } from '../components/ui/TransactionLifecycle';

export function useContractAction() {
  const { isConnected, isCorrectNetwork, address, targetNetworkName, targetChainId } = useWallet();
  const { isGuidedMode, activePersona, activePersonaId } = useIdentity();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { data: evaluatorContracts } = useEvaluatorContracts();

  const [txState, setTxState] = useState<TxState | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const isMetaMaskMode = !isGuidedMode && Boolean(isConnected && isCorrectNetwork && address);

  const resetTxState = () => {
    setTxState(null);
    setIsExecuting(false);
  };

  const invalidateData = async (loanId?: string) => {
    try {
      await api.reindex();
    } catch {}
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.loans }),
      queryClient.invalidateQueries({ queryKey: queryKeys.health }),
      loanId ? queryClient.invalidateQueries({ queryKey: queryKeys.loan(loanId) }) : Promise.resolve(),
      loanId ? queryClient.invalidateQueries({ queryKey: queryKeys.loanActivity(loanId) }) : Promise.resolve(),
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluatorEvents }),
      queryClient.invalidateQueries({ queryKey: ['console'] }),
      queryClient.invalidateQueries({ queryKey: ['evaluatorWallets'] }),
      queryClient.invalidateQueries({ queryKey: ['consoleContracts'] }),
      queryClient.invalidateQueries({ queryKey: ['consoleBlocks'] }),
      queryClient.invalidateQueries({ queryKey: ['consoleNetwork'] }),
      queryClient.invalidateQueries({ queryKey: ['consoleTransactions'] }),
      queryClient.invalidateQueries({ queryKey: ['indexerState'] }),
      queryClient.invalidateQueries({ queryKey: ['consoleEvents'] }),
      queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
      queryClient.invalidateQueries({ queryKey: ['supplier-disbursements'] }),
      queryClient.invalidateQueries({ queryKey: ['identity'] }),
      queryClient.invalidateQueries({ queryKey: ['reputation'] }),
      queryClient.invalidateQueries({ queryKey: ['claims'] }),
    ]);
  };

  const assertWalletReady = () => {
    if (!isConnected || !address) {
      const errorMsg = 'Wallet not connected. Please connect your Web3 wallet (MetaMask) to sign and execute this blockchain transaction.';
      setTxState({
        step: 'failed',
        title: 'Wallet Connection Required',
        error: errorMsg,
        errorCode: 'WALLET_NOT_CONNECTED',
        errorCategory: 'network_error',
        isMetaMask: true,
      });
      throw new Error(errorMsg);
    }

    if (!isCorrectNetwork) {
      const errorMsg = `Incorrect network. Please switch to ${targetNetworkName} (Chain ID ${targetChainId}) in your wallet to sign transactions.`;
      setTxState({
        step: 'failed',
        title: 'Wrong Network',
        error: errorMsg,
        errorCode: 'WRONG_NETWORK',
        errorCategory: 'network_error',
        isMetaMask: true,
      });
      throw new Error(errorMsg);
    }

    if (!publicClient) {
      const errorMsg = 'EVM client not initialized. Please ensure local node is running.';
      setTxState({
        step: 'failed',
        title: 'Network Error',
        error: errorMsg,
        errorCode: 'CLIENT_NOT_INITIALIZED',
        errorCategory: 'network_error',
        isMetaMask: true,
      });
      throw new Error(errorMsg);
    }
  };

  // Helper to categorize errors into the 4 required specifications
  const classifyError = (err: unknown): { error: string; code?: string; category: TxErrorCategory } => {
    const message = err instanceof Error ? err.message : String(err);

    // 1. User rejected wallet request
    if (
      message.includes('User rejected') ||
      message.includes('User denied') ||
      message.includes('user rejected') ||
      message.includes('4001') ||
      message.includes('UserRejectedRequestError')
    ) {
      return {
        error: 'Transaction signature was rejected by the user in MetaMask.',
        code: 'USER_REJECTED',
        category: 'user_rejected',
      };
    }

    // 2. Network error
    if (
      message.includes('Failed to fetch') ||
      message.includes('network error') ||
      message.includes('CLIENT_NOT_INITIALIZED') ||
      message.includes('WRONG_NETWORK') ||
      message.includes('WALLET_NOT_CONNECTED') ||
      message.includes('ECONNREFUSED') ||
      message.includes('could not detect network') ||
      message.includes('connection refused')
    ) {
      return {
        error: message.includes('WALLET_NOT_CONNECTED')
          ? 'Wallet not connected. Please connect MetaMask to continue.'
          : message.includes('WRONG_NETWORK')
          ? `Incorrect network. Please switch to ${targetNetworkName} (Chain ID ${targetChainId}).`
          : `Unable to communicate with EVM node. Ensure ${targetNetworkName} node or RPC is reachable.`,
        code: 'NETWORK_ERROR',
        category: 'network_error',
      };
    }

    // 3. Confirmation failure
    if (
      message.includes('TransactionReceiptNotFoundError') ||
      message.includes('timed out') ||
      message.includes('transaction was replaced') ||
      message.includes('Transaction failed') ||
      message.includes('status: "reverted"') ||
      message.includes('confirmation failure')
    ) {
      return {
        error: 'Transaction broadcast but failed confirmation on-chain or was dropped.',
        code: 'CONFIRMATION_FAILURE',
        category: 'confirmation_failure',
      };
    }

    // 4. Contract reverted (check specific custom errors)
    if (message.includes('BorrowerNotVerified')) {
      return { error: 'Loan deployment reverted: borrower address is not verified in KYCRegistry.', code: 'BORROWER_NOT_VERIFIED', category: 'contract_reverted' };
    }
    if (message.includes('InvalidTarget')) {
      return { error: 'Loan deployment reverted: funding target must be greater than zero.', code: 'INVALID_TARGET', category: 'contract_reverted' };
    }
    if (message.includes('InvalidSpendLimit')) {
      return { error: 'Loan deployment reverted: spending cap cannot exceed funding target.', code: 'INVALID_SPEND_LIMIT', category: 'contract_reverted' };
    }
    if (message.includes('InvalidQuorum')) {
      return { error: 'Loan deployment reverted: default quorum must be between 50.01% and 100%.', code: 'INVALID_QUORUM', category: 'contract_reverted' };
    }
    if (message.includes('NoMerchants')) {
      return { error: 'Loan deployment reverted: at least one approved merchant is required.', code: 'NO_MERCHANTS', category: 'contract_reverted' };
    }
    if (message.includes('TargetExceeded') || message.includes('0x37047d17')) {
      return { error: 'Contribution rejected: amount exceeds remaining pool target capacity.', code: 'TARGET_EXCEEDED', category: 'contract_reverted' };
    }
    if (message.includes('NotVerifiedLender') || message.includes('0xa373b4a9')) {
      return {
        error: 'Syndicate Contribution Rejected: Connected wallet is not verified under IKYCRegistry.Role.Lender. Under protocol policy (LoanPool.sol line 111), non-lenders (merchants, borrowers, unregistered callers) cannot deposit capital or acquire voting power.',
        code: 'NOT_VERIFIED_LENDER',
        category: 'contract_reverted',
      };
    }
    if (message.includes('FundingClosed') || message.includes('0xf3e84c4c')) {
      return { error: 'Contribution rejected: funding window for this loan pool is closed.', code: 'FUNDING_CLOSED', category: 'contract_reverted' };
    }
    if (message.includes('ContributionIsZero') || message.includes('0x0c7f4bf8')) {
      return { error: 'Contribution rejected: amount must be greater than zero.', code: 'CONTRIBUTION_IS_ZERO', category: 'contract_reverted' };
    }
    if (message.includes('MerchantNotApproved') || message.includes('0x7290a612')) {
      return {
        error: 'Spend rejected: recipient address is not an approved supplier on the agreement allowlist. All disbursements must go directly to allowlisted suppliers.',
        code: 'MERCHANT_NOT_APPROVED',
        category: 'contract_reverted',
      };
    }
    if (message.includes('SpendLimitExceeded') || message.includes('0x1d54b615')) {
      return {
        error: 'Spend rejected: requested amount exceeds remaining spending capacity under agreement policy.',
        code: 'SPEND_LIMIT_EXCEEDED',
        category: 'contract_reverted',
      };
    }
    if (message.includes('NotBorrower') || message.includes('0xcb1e8f38')) {
      return {
        error: 'Spend rejected: only the authorized borrower wallet can execute supplier disbursements.',
        code: 'NOT_BORROWER',
        category: 'contract_reverted',
      };
    }
    if (message.includes('NotActive') || message.includes('0x80cb55e2')) {
      return {
        error: 'Spend rejected: agreement is not in ACTIVE status. Spending is only unlocked once 100% funding is reached.',
        code: 'NOT_ACTIVE',
        category: 'contract_reverted',
      };
    }
    if (message.includes('RepaymentTooLarge') || message.includes('0x6f610913')) {
      return { error: 'Repayment rejected: amount exceeds remaining total repayable balance.', code: 'REPAYMENT_TOO_LARGE', category: 'contract_reverted' };
    }
    if (message.includes('NothingToClaim') || message.includes('0x969bf728')) {
      return { error: 'Claim rejected: no pro-rata repayments currently available for this lender.', code: 'NOTHING_TO_CLAIM', category: 'contract_reverted' };
    }
    if (message.includes('AlreadyVoted') || message.includes('0x7c9a1cf9')) {
      return { error: 'Vote rejected: this lender has already cast a default vote for this pool.', code: 'ALREADY_VOTED', category: 'contract_reverted' };
    }
    if (message.includes('BorrowerCannotContribute')) {
      return { error: 'Contribution rejected: the borrower cannot contribute to their own credit agreement.', code: 'BORROWER_CANNOT_CONTRIBUTE', category: 'contract_reverted' };
    }
    if (message.includes('MerchantCapExceeded') || message.includes('MerchantSpendCapExceeded') || message.includes('0xbc328f2b')) {
      return { error: 'Spend rejected: requested amount exceeds the spending cap allocated for this specific supplier.', code: 'MERCHANT_CAP_EXCEEDED', category: 'contract_reverted' };
    }
    if (message.includes('FundingNotExpired')) {
      return { error: 'Cancellation rejected: funding deadline has not yet passed.', code: 'FUNDING_NOT_EXPIRED', category: 'contract_reverted' };
    }
    if (message.includes('AlreadyClaimed')) {
      return { error: 'Claim rejected: entitlement has already been fully claimed.', code: 'ALREADY_CLAIMED', category: 'contract_reverted' };
    }
    if (message.includes('NotLender') || message.includes('NonLender')) {
      return { error: 'Default vote rejected: only verified contributing lenders in this pool can cast default votes.', code: 'NOT_LENDER', category: 'contract_reverted' };
    }
    if (message.includes('GracePeriodActive')) {
      return { error: 'Default vote rejected: post-maturity grace period is currently active.', code: 'GRACE_PERIOD_ACTIVE', category: 'contract_reverted' };
    }
    if (message.includes('MaturityNotReached') || message.includes('0x7fb65b4a') || message.includes('NotAtMaturity')) {
      return { error: 'Default vote rejected: loan pool has not reached maturity date and grace period.', code: 'NOT_AT_MATURITY', category: 'contract_reverted' };
    }
    if (message.includes('invalid block tag') || message.includes('-32000')) {
      return {
        error: 'MetaMask block cache desynced after local node restart. In MetaMask, open Settings > Advanced > Clear activity tab data.',
        code: 'METAMASK_BLOCK_CACHE',
        category: 'network_error',
      };
    }
    if (
      message.includes('nonce too low') ||
      message.includes('nonce too high') ||
      message.includes('Nonce too high') ||
      message.includes('Nonce too low') ||
      message.includes('replacement transaction underpriced')
    ) {
      return {
        error: 'MetaMask nonce desynced after chain restart. In MetaMask, open Settings > Advanced > Clear activity tab data to reset local nonce cache.',
        code: 'NONCE_DESYNC',
        category: 'network_error',
      };
    }

    return {
      error: message.slice(0, 200),
      code: 'CONTRACT_REVERTED',
      category: 'contract_reverted',
    };
  };

  // Guided Mode lifecycle runner (server-signed presentation without MetaMask)
  const runGuidedLifecycle = async <T>(
    operationName: string,
    action: () => Promise<{ txHash: `0x${string}`; receiptBlock?: string; result?: T }>,
    poolAddress?: string
  ): Promise<{ txHash: string; blockNumber?: string; result?: T }> => {
    setIsExecuting(true);
    try {
      setTxState({
        step: 'preparing',
        title: `Preparing ${operationName}`,
        description: `Validating parameters for ${activePersona.displayName}...`,
        isMetaMask: false,
      });

      await new Promise((resolve) => setTimeout(resolve, 80));

      setTxState({
        step: 'awaiting_wallet',
        title: 'Executing Guided Action',
        description: `Server-signing transaction via demo key: ${activePersona.displayName}...`,
        isMetaMask: false,
      });

      const outcome = await action();

      setTxState({
        step: 'confirming',
        title: 'Confirming On-Chain',
        description: 'Transaction broadcast to network. Mining into next block...',
        txHash: outcome.txHash,
        blockNumber: outcome.receiptBlock,
        isMetaMask: false,
      });

      await api.reindex().catch(() => {});
      await invalidateData(poolAddress);

      setTxState({
        step: 'confirmed',
        title: `${operationName} Confirmed On-Chain`,
        description: `Successfully included in block #${outcome.receiptBlock || 'latest'}. Executed via Guided Presenter Mode.`,
        txHash: outcome.txHash,
        blockNumber: outcome.receiptBlock,
        isMetaMask: false,
      });

      return {
        txHash: outcome.txHash,
        blockNumber: outcome.receiptBlock,
        result: outcome.result,
      };
    } catch (err) {
      const { error, code, category } = classifyError(err);
      setTxState({
        step: 'failed',
        title: `${operationName} Failed`,
        error,
        errorCode: code,
        errorCategory: category,
        isMetaMask: false,
      });
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  // Reusable 5-step lifecycle runner for MetaMask Wallet Mode
  const runLifecycle = async <T>(
    operationName: string,
    action: () => Promise<`0x${string}`>,
    onConfirmed?: (receipt: any, txHash: `0x${string}`) => Promise<T> | T
  ): Promise<{ txHash: string; blockNumber?: string; result?: T }> => {
    setIsExecuting(true);
    let broadcastHash: string | undefined;

    try {
      assertWalletReady();

      // Step 1: Preparing
      setTxState({
        step: 'preparing',
        title: `Preparing ${operationName}`,
        description: 'Validating inputs and preparing transaction parameters...',
        isMetaMask: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 80));

      // Step 2: Awaiting Wallet Signature
      setTxState({
        step: 'awaiting_wallet',
        title: 'Sign in MetaMask',
        description: `Please review and approve the ${operationName.toLowerCase()} in your wallet...`,
        isMetaMask: true,
      });

      broadcastHash = await action();

      // Immediately register in client transaction tracker so console displays it instantly
      if (broadcastHash) {
        trackSubmittedTx({
          hash: broadcastHash,
          operationName,
          from: address || '',
        });
        consoleApi.ingestTransaction(broadcastHash).catch(() => {});
      }

      // Step 3: Submitted
      setTxState({
        step: 'submitted',
        title: 'Transaction Submitted',
        description: 'Broadcast to EVM network. Awaiting block inclusion...',
        txHash: broadcastHash,
        isMetaMask: true,
      });

      // Step 4: Confirming
      setTxState({
        step: 'confirming',
        title: 'Waiting for Block Confirmation',
        description: 'Mining transaction into next block...',
        txHash: broadcastHash,
        isMetaMask: true,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: broadcastHash as `0x${string}` });

      if (receipt.status === 'reverted') {
        trackConfirmedTx(broadcastHash, receipt);
        throw new Error('Transaction execution reverted during block inclusion');
      }

      // Update client transaction tracker with confirmed block and receipt
      trackConfirmedTx(broadcastHash, receipt);

      // Step 5: Confirmed & Refresh Authoritative State
      await api.reindex().catch(() => {});
      await invalidateData();

      let customResult: T | undefined;
      if (onConfirmed) {
        customResult = await onConfirmed(receipt, broadcastHash as `0x${string}`);
      }

      setTxState({
        step: 'confirmed',
        title: `${operationName} Confirmed On-Chain`,
        description: `Successfully included in block #${receipt.blockNumber}. Authoritative state refreshed.`,
        txHash: broadcastHash,
        blockNumber: receipt.blockNumber.toString(),
        isMetaMask: true,
      });

      return {
        txHash: broadcastHash,
        blockNumber: receipt.blockNumber.toString(),
        result: customResult,
      };
    } catch (err) {
      if (typeof broadcastHash === 'string') {
        trackConfirmedTx(broadcastHash, { status: 'reverted' });
      }
      const { error, code, category } = classifyError(err);
      if (category === 'user_rejected') {
        setTxState({
          step: 'rejected',
          title: 'Signature Denied',
          error,
          errorCode: code,
          errorCategory: category,
          isMetaMask: true,
        });
      } else {
        setTxState({
          step: 'failed',
          title: `${operationName} Failed`,
          error,
          errorCode: code,
          errorCategory: category,
          isMetaMask: true,
        });
      }
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  // 1. Create Loan Agreement
  const executeCreateLoan = async (args: {
    naturalLanguageText: string;
    terms: TermSheet;
  }): Promise<{ loanId: string; poolAddress: string; txHash: string }> => {
    if (isGuidedMode) {
      const outcome = await runGuidedLifecycle('Loan Deployment', async () => {
        const res = await api.createLoan({
          borrowerId: activePersonaId,
          naturalLanguageAgreement: args.naturalLanguageText,
          parsedTerms: args.terms,
        });
        return {
          txHash: res.transactionHash as `0x${string}`,
          receiptBlock: '',
          result: { poolAddress: res.loanId },
        };
      });
      const identifiedPool = outcome.result?.poolAddress || outcome.txHash;
      return {
        loanId: identifiedPool,
        poolAddress: identifiedPool,
        txHash: outcome.txHash,
      };
    }

    const factoryAddress = evaluatorContracts?.contracts?.loanFactory as Address;
    if (!factoryAddress) {
      throw new Error(
        'LoanFactory contract address is not configured. Please ensure the backend is running and contracts are deployed.'
      );
    }

    const isSepolia = factoryAddress.toLowerCase() === '0xd5230d26a83e15da5b4f22b9b06054f96fb47c89' || targetChainId === 11155111;

    // Filter/map merchants to ensure they match verified suppliers on target chain
    let targetMerchants: readonly `0x${string}`[] = args.terms.merchants as readonly `0x${string}`[];
    if (isSepolia) {
      const sepoliaSuppliers = ['0x921D30Fa5E257a3f527cc325Be117A5e66165F3A' as `0x${string}`, '0x8538A473C611a0199728A5f63372279EFA005722' as `0x${string}`];
      targetMerchants = targetMerchants.map((m) => {
        const lower = m.toLowerCase();
        if (lower === '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc') return sepoliaSuppliers[0];
        if (lower === '0x976ea74026e726554db657fa54763abd0c3a0aa9') return sepoliaSuppliers[1];
        return m;
      }) as readonly `0x${string}`[];
      if (targetMerchants.length === 0) {
        targetMerchants = [sepoliaSuppliers[0]];
      }
    }

    const outcome = await runLifecycle(
      'Loan Deployment',
      async () => {
        const terms = {
          borrower: address as Address,
          targetWei: BigInt(args.terms.targetWei),
          durationSeconds: BigInt(args.terms.durationSeconds),
          fundingDurationSeconds: BigInt((args.terms as any).fundingDurationSeconds ?? (isSepolia ? 300 : 7 * 86400)),
          aprBps: BigInt(args.terms.aprBps),
          maxSpendWei: BigInt(args.terms.maxSpendWei),
          defaultQuorumBps: BigInt(args.terms.defaultQuorumBps),
          gracePeriodSeconds: BigInt((args.terms as any).gracePeriodSeconds ?? (isSepolia ? 300 : 3 * 86400)),
          agreementHash: ((args.terms as any).agreementHash ?? '0x0000000000000000000000000000000000000000000000000000000000000000') as `0x${string}`,
          merchants: targetMerchants,
          merchantCapsWei: targetMerchants.map(() => BigInt(args.terms.maxSpendWei) / BigInt(targetMerchants.length || 1)),
        };
        return writeContractAsync({
          address: factoryAddress,
          abi: factoryAbi,
          functionName: 'createLoan',
          args: [terms],
        });
      },
      (receipt, hash) => {
        let poolAddress: string = hash;
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: factoryAbi,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'LoanCreated' && (decoded.args as any)?.pool) {
              poolAddress = (decoded.args as any).pool;
              break;
            }
          } catch {
            // Not a LoanCreated event log
          }
        }
        return { poolAddress };
      }
    );

    const identifiedPool = outcome.result?.poolAddress || outcome.txHash;
    return {
      loanId: identifiedPool,
      poolAddress: identifiedPool,
      txHash: outcome.txHash,
    };
  };

  // 2. Contribute to Pool
  const executeContribute = async (poolAddress: string, amountWei: string) => {
    if (isGuidedMode) {
      const outcome = await runGuidedLifecycle(
        'Syndicate Contribution',
        async () => {
          const res = await api.contribute(poolAddress, activePersonaId, amountWei);
          return {
            txHash: res.hash as `0x${string}`,
            receiptBlock: res.receiptBlock,
          };
        },
        poolAddress
      );
      return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
    }

    const outcome = await runLifecycle(
      'Syndicate Contribution',
      async () => {
        if (publicClient) {
          await publicClient.simulateContract({
            address: poolAddress as Address,
            abi: poolAbi,
            functionName: 'contribute',
            value: BigInt(amountWei),
            account: address as Address,
          });
        }
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'contribute',
          value: BigInt(amountWei),
        });
      },
      () => {
        invalidateData(poolAddress);
      }
    );
    return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
  };

  // 3. Restricted Spend
  const executeSpend = async (
    poolAddress: string,
    merchantAddress: string,
    amountWei: string,
    category: string
  ) => {
    if (isGuidedMode) {
      const outcome = await runGuidedLifecycle(
        'Policy-Restricted Spend',
        async () => {
          const res = await api.spend(poolAddress, activePersonaId, merchantAddress, amountWei, category);
          return {
            txHash: res.hash as `0x${string}`,
            receiptBlock: res.receiptBlock,
          };
        },
        poolAddress
      );
      return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
    }

    const outcome = await runLifecycle(
      'Policy-Restricted Spend',
      async () => {
        const categoryBytes32 = pad(stringToHex(category.slice(0, 32)), { size: 32 });
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'spend',
          args: [merchantAddress as Address, BigInt(amountWei), categoryBytes32],
          gas: 500000n,
        });
      },
      () => {
        invalidateData(poolAddress);
      }
    );
    return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
  };

  // 4. Repay
  const executeRepay = async (poolAddress: string, amountWei: string) => {
    if (isGuidedMode) {
      const outcome = await runGuidedLifecycle(
        'Loan Repayment',
        async () => {
          const res = await api.repay(poolAddress, activePersonaId, amountWei);
          return {
            txHash: res.hash as `0x${string}`,
            receiptBlock: res.receiptBlock,
          };
        },
        poolAddress
      );
      return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
    }

    const outcome = await runLifecycle(
      'Loan Repayment',
      async () => {
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'repay',
          value: BigInt(amountWei),
        });
      },
      () => {
        invalidateData(poolAddress);
      }
    );
    return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
  };

  // 5. Claim Repayment
  const executeClaim = async (poolAddress: string) => {
    if (isGuidedMode) {
      const outcome = await runGuidedLifecycle(
        'Repayment Pull Claim',
        async () => {
          const res = await api.claimRepayment(poolAddress, activePersonaId);
          return {
            txHash: res.hash as `0x${string}`,
            receiptBlock: res.receiptBlock,
          };
        },
        poolAddress
      );
      return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
    }

    const outcome = await runLifecycle(
      'Repayment Pull Claim',
      async () => {
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'claimRepayment',
          args: [],
        });
      },
      () => {
        invalidateData(poolAddress);
      }
    );
    return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
  };

  // 6. Claim Refund on Cancelled Pool
  const executeClaimRefund = async (poolAddress: string) => {
    if (isGuidedMode) {
      const outcome = await runGuidedLifecycle(
        'Lender Refund Claim',
        async () => {
          const res = await api.claimRefund(poolAddress, activePersonaId);
          return {
            txHash: res.hash as `0x${string}`,
            receiptBlock: res.receiptBlock,
          };
        },
        poolAddress
      );
      return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
    }

    const outcome = await runLifecycle(
      'Lender Refund Claim',
      async () => {
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'claimFundingRefund',
          args: [],
        });
      },
      () => {
        invalidateData(poolAddress);
      }
    );
    return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
  };

  // 7. Vote Default
  const executeVoteDefault = async (poolAddress: string) => {
    if (isGuidedMode) {
      const outcome = await runGuidedLifecycle(
        'Default Consensus Vote',
        async () => {
          const res = await api.voteDefault(poolAddress, activePersonaId);
          return {
            txHash: res.hash as `0x${string}`,
            receiptBlock: res.receiptBlock,
          };
        },
        poolAddress
      );
      return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
    }

    const outcome = await runLifecycle(
      'Default Consensus Vote',
      async () => {
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'voteDefault',
          args: [],
        });
      },
      () => {
        invalidateData(poolAddress);
      }
    );
    return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
  };

  // 8. Cancel Unfunded Pool
  const executeCancelUnfunded = async (poolAddress: string) => {
    if (isGuidedMode) {
      const outcome = await runGuidedLifecycle(
        'Pool Cancellation',
        async () => {
          const res = await api.cancelUnfunded(poolAddress, activePersonaId || 'operator');
          return {
            txHash: res.hash as `0x${string}`,
            receiptBlock: res.receiptBlock,
          };
        },
        poolAddress
      );
      return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
    }

    const outcome = await runLifecycle(
      'Pool Cancellation',
      async () => {
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'cancelUnfunded',
          args: [],
        });
      },
      () => {
        invalidateData(poolAddress);
      }
    );
    return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
  };

  // 9. Attest Account On-Chain (KYCRegistry)
  const executeAttestOnChain = async (
    targetAccount: Address,
    roleType: number = 1
  ) => {
    const kycAddress = evaluatorContracts?.contracts?.kycRegistry as Address;
    if (!kycAddress) throw new Error('KYCRegistry contract address not configured.');
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 365 * 86400);
    const credentialHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}` as `0x${string}`;

    const outcome = await runLifecycle('KYC Attestation', async () => {
      return writeContractAsync({
        address: kycAddress,
        abi: kycAbi,
        functionName: 'setVerification',
        args: [targetAccount, roleType, expiresAt, credentialHash],
      });
    });
    return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
  };

  return {
    isMetaMaskMode,
    isGuidedMode,
    isExecuting,
    txState,
    resetTxState,
    executeCreateLoan,
    executeContribute,
    executeSpend,
    executeRepay,
    executeClaim,
    executeClaimRefund,
    executeVoteDefault,
    executeCancelUnfunded,
    executeAttestOnChain,
  };
}
