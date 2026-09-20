import { useState } from 'react';
import { useWriteContract, usePublicClient } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { type Address, stringToHex, pad, decodeEventLog } from 'viem';
import { factoryAbi, poolAbi, type TermSheet } from '@credify/shared';
import { useWallet } from '../context/WalletContext';
import { api } from '../lib/api';
import { queryKeys, useEvaluatorContracts } from './useCredify';
import type { TxState, TxLifecycleStep, TxErrorCategory } from '../components/ui/TransactionLifecycle';

export function useContractAction() {
  const { isConnected, isCorrectNetwork, address } = useWallet();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { data: evaluatorContracts } = useEvaluatorContracts();

  const [txState, setTxState] = useState<TxState | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const isMetaMaskMode = Boolean(isConnected && isCorrectNetwork && address);

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
      const errorMsg = 'Incorrect network. Please switch to Hardhat Localhost (Chain ID 31337) in your wallet to sign transactions.';
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
          ? 'Incorrect network. Please switch to Hardhat Localhost (Chain ID 31337).'
          : 'Unable to communicate with EVM node. Ensure local blockchain is running.',
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
      return { error: 'Contribution rejected: connected account is not verified in KYCRegistry.', code: 'NOT_VERIFIED_LENDER', category: 'contract_reverted' };
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
    if (message.includes('MaturityNotReached') || message.includes('0x7fb65b4a') || message.includes('NotAtMaturity')) {
      return { error: 'Default vote rejected: loan pool has not reached maturity date.', code: 'NOT_AT_MATURITY', category: 'contract_reverted' };
    }
    if (message.includes('invalid block tag') || message.includes('-32000')) {
      return { error: 'MetaMask block cache desynced from local node. Please clear activity data in MetaMask.', code: 'METAMASK_BLOCK_CACHE', category: 'network_error' };
    }
    if (message.includes('nonce too low')) {
      return { error: 'MetaMask transaction nonce desynced. Please clear activity data in MetaMask.', code: 'NONCE_TOO_LOW', category: 'network_error' };
    }

    return {
      error: message.slice(0, 200),
      code: 'CONTRACT_REVERTED',
      category: 'contract_reverted',
    };
  };

  // Reusable 5-step lifecycle runner
  const runLifecycle = async <T>(
    operationName: string,
    action: () => Promise<`0x${string}`>,
    onConfirmed?: (receipt: any, txHash: `0x${string}`) => Promise<T> | T
  ): Promise<{ txHash: string; blockNumber?: string; result?: T }> => {
    setIsExecuting(true);

    try {
      assertWalletReady();

      // Step 1: Preparing
      setTxState({
        step: 'preparing',
        title: `Preparing ${operationName}`,
        description: 'Validating inputs, parameters, and nonce on local node...',
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

      const hash = await action();

      // Step 3: Submitted
      setTxState({
        step: 'submitted',
        title: 'Transaction Submitted',
        description: 'Broadcast to local blockchain node. Awaiting block inclusion...',
        txHash: hash,
        isMetaMask: true,
      });

      // Step 4: Confirming
      setTxState({
        step: 'confirming',
        title: 'Waiting for Block Confirmation',
        description: 'Mining transaction into next block...',
        txHash: hash,
        isMetaMask: true,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });

      if (receipt.status === 'reverted') {
        throw new Error('Transaction execution reverted during block inclusion');
      }

      // Step 5: Confirmed & Refresh Authoritative State
      await api.reindex().catch(() => {});
      await invalidateData();

      let customResult: T | undefined;
      if (onConfirmed) {
        customResult = await onConfirmed(receipt, hash);
      }

      setTxState({
        step: 'confirmed',
        title: `${operationName} Confirmed On-Chain`,
        description: `Successfully included in block #${receipt.blockNumber}. Authoritative state refreshed.`,
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        isMetaMask: true,
      });

      return {
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        result: customResult,
      };
    } catch (err) {
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
    const factoryAddress = (evaluatorContracts?.contracts.loanFactory ||
      '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0') as Address;

    const outcome = await runLifecycle(
      'Loan Deployment',
      async () => {
        const nonce = await publicClient!.getTransactionCount({ address: address as Address });
        return writeContractAsync({
          address: factoryAddress,
          abi: factoryAbi,
          functionName: 'createLoan',
          args: [
            address as Address,
            BigInt(args.terms.targetWei),
            BigInt(args.terms.durationSeconds),
            BigInt(args.terms.aprBps),
            BigInt(args.terms.maxSpendWei),
            BigInt(args.terms.defaultQuorumBps),
            args.terms.merchants as Address[],
          ],
          nonce,
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
    const outcome = await runLifecycle(
      'Syndicate Contribution',
      async () => {
        const nonce = await publicClient!.getTransactionCount({ address: address as Address });
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'contribute',
          value: BigInt(amountWei),
          nonce,
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
    const outcome = await runLifecycle(
      'Policy-Restricted Spend',
      async () => {
        const categoryBytes32 = pad(stringToHex(category.slice(0, 32)), { size: 32 });
        const nonce = await publicClient!.getTransactionCount({ address: address as Address });
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'spend',
          args: [merchantAddress as Address, BigInt(amountWei), categoryBytes32],
          nonce,
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
    const outcome = await runLifecycle(
      'Loan Repayment',
      async () => {
        const nonce = await publicClient!.getTransactionCount({ address: address as Address });
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'repay',
          value: BigInt(amountWei),
          nonce,
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
    const outcome = await runLifecycle(
      'Repayment Pull Claim',
      async () => {
        const nonce = await publicClient!.getTransactionCount({ address: address as Address });
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'claimRepayment',
          args: [],
          nonce,
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
    const outcome = await runLifecycle(
      'Lender Refund Claim',
      async () => {
        const nonce = await publicClient!.getTransactionCount({ address: address as Address });
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'claimFundingRefund',
          args: [],
          nonce,
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
    const outcome = await runLifecycle(
      'Default Consensus Vote',
      async () => {
        const nonce = await publicClient!.getTransactionCount({ address: address as Address });
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'voteDefault',
          args: [],
          nonce,
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
    const outcome = await runLifecycle(
      'Pool Cancellation',
      async () => {
        const nonce = await publicClient!.getTransactionCount({ address: address as Address });
        return writeContractAsync({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: 'cancelUnfunded',
          args: [],
          nonce,
        });
      },
      () => {
        invalidateData(poolAddress);
      }
    );
    return { hash: outcome.txHash, receiptBlock: outcome.blockNumber || '' };
  };

  return {
    isMetaMaskMode,
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
  };
}
