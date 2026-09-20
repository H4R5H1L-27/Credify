export const kycAbi = [
  { type: 'function', name: 'isVerified', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'setVerified', stateMutability: 'nonpayable', inputs: [
    { name: 'account', type: 'address' },
    { name: 'isVerified', type: 'bool' },
    { name: 'ref', type: 'bytes32' }
  ], outputs: [] },
  { type: 'event', name: 'VerificationUpdated', anonymous: false, inputs: [
    { indexed: true, name: 'account', type: 'address' },
    { indexed: false, name: 'verified', type: 'bool' },
    { indexed: true, name: 'verificationRef', type: 'bytes32' }
  ] }
] as const;

export const reputationAbi = [
  { type: 'function', name: 'getScore', stateMutability: 'view', inputs: [{ name: 'borrower', type: 'address' }], outputs: [{ name: 'score', type: 'uint16' }, { name: 'successes', type: 'uint16' }, { name: 'defaults', type: 'uint16' }] },
  { type: 'event', name: 'ReputationUpdated', anonymous: false, inputs: [
    { indexed: true, name: 'borrower', type: 'address' },
    { indexed: false, name: 'successful', type: 'bool' },
    { indexed: false, name: 'score', type: 'uint16' },
    { indexed: false, name: 'successes', type: 'uint16' },
    { indexed: false, name: 'defaults', type: 'uint16' }
  ] }
] as const;

export const factoryAbi = [
  { type: 'function', name: 'createLoan', stateMutability: 'nonpayable', inputs: [
    { name: 'borrower', type: 'address' },
    { name: 'targetWei', type: 'uint256' },
    { name: 'durationSeconds', type: 'uint256' },
    { name: 'aprBps', type: 'uint256' },
    { name: 'maxSpendWei', type: 'uint256' },
    { name: 'defaultQuorumBps', type: 'uint256' },
    { name: 'merchants', type: 'address[]' }
  ], outputs: [{ name: 'pool', type: 'address' }] },
  { type: 'function', name: 'getPools', stateMutability: 'view', inputs: [], outputs: [{ type: 'address[]' }] },
  { type: 'event', name: 'LoanCreated', anonymous: false, inputs: [
    { indexed: true, name: 'pool', type: 'address' },
    { indexed: true, name: 'borrower', type: 'address' },
    { indexed: false, name: 'targetWei', type: 'uint256' },
    { indexed: false, name: 'maturity', type: 'uint256' },
    { indexed: false, name: 'aprBps', type: 'uint256' }
  ] }
] as const;

export const poolAbi = [
  { type: 'function', name: 'borrower', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'targetWei', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'createdAt', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'durationSeconds', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'maturity', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'aprBps', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'maxSpendWei', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'defaultQuorumBps', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'status', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'totalContributed', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'totalRepaid', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'totalSpent', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'totalRepayable', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'getSummary', stateMutability: 'view', inputs: [], outputs: [
    { name: '_status', type: 'uint8' },
    { name: '_targetWei', type: 'uint256' },
    { name: '_totalContributed', type: 'uint256' },
    { name: '_totalRepaid', type: 'uint256' },
    { name: '_totalRepayable', type: 'uint256' },
    { name: '_totalSpent', type: 'uint256' },
    { name: '_maturity', type: 'uint256' },
    { name: '_defaultVoteWeight', type: 'uint256' },
    { name: '_defaultThreshold', type: 'uint256' }
  ] },
  { type: 'function', name: 'getLenderInfo', stateMutability: 'view', inputs: [{ name: 'lender', type: 'address' }], outputs: [
    { name: 'amount', type: 'uint256' },
    { name: 'claimable', type: 'uint256' },
    { name: 'voted', type: 'bool' }
  ] },
  { type: 'function', name: 'getApprovedMerchants', stateMutability: 'view', inputs: [], outputs: [{ type: 'address[]' }] },
  { type: 'function', name: 'claimed', stateMutability: 'view', inputs: [{ name: 'lender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'contributed', stateMutability: 'view', inputs: [{ name: 'lender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'contribute', stateMutability: 'payable', inputs: [], outputs: [] },
  { type: 'function', name: 'spend', stateMutability: 'nonpayable', inputs: [
    { name: 'merchant', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'category', type: 'bytes32' }
  ], outputs: [] },
  { type: 'function', name: 'repay', stateMutability: 'payable', inputs: [], outputs: [] },
  { type: 'function', name: 'claimRepayment', stateMutability: 'nonpayable', inputs: [], outputs: [{ name: 'amount', type: 'uint256' }] },
  { type: 'function', name: 'hasDefaultVoted', stateMutability: 'view', inputs: [{ name: 'lender', type: 'address' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'defaultVoteWeight', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'voteDefault', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'cancelUnfunded', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'claimFundingRefund', stateMutability: 'nonpayable', inputs: [], outputs: [{ name: 'amount', type: 'uint256' }] },
  { type: 'event', name: 'LoanPoolCreated', anonymous: false, inputs: [
    { indexed: true, name: 'borrower', type: 'address' },
    { indexed: false, name: 'targetWei', type: 'uint256' },
    { indexed: false, name: 'maturity', type: 'uint256' },
    { indexed: false, name: 'aprBps', type: 'uint256' }
  ] },
  { type: 'event', name: 'Funded', anonymous: false, inputs: [
    { indexed: true, name: 'lender', type: 'address' },
    { indexed: false, name: 'amount', type: 'uint256' },
    { indexed: false, name: 'totalContributed', type: 'uint256' }
  ] },
  { type: 'event', name: 'LoanActivated', anonymous: false, inputs: [{ indexed: false, name: 'timestamp', type: 'uint256' }] },
  { type: 'event', name: 'SpendExecuted', anonymous: false, inputs: [
    { indexed: true, name: 'merchant', type: 'address' },
    { indexed: false, name: 'amount', type: 'uint256' },
    { indexed: true, name: 'category', type: 'bytes32' }
  ] },
  { type: 'event', name: 'RepaymentReceived', anonymous: false, inputs: [
    { indexed: true, name: 'borrower', type: 'address' },
    { indexed: false, name: 'amount', type: 'uint256' },
    { indexed: false, name: 'totalRepaid', type: 'uint256' }
  ] },
  { type: 'event', name: 'RepaymentClaimed', anonymous: false, inputs: [
    { indexed: true, name: 'lender', type: 'address' },
    { indexed: false, name: 'amount', type: 'uint256' }
  ] },
  { type: 'event', name: 'DefaultVoteCast', anonymous: false, inputs: [
    { indexed: true, name: 'lender', type: 'address' },
    { indexed: false, name: 'weight', type: 'uint256' },
    { indexed: false, name: 'totalVoteWeight', type: 'uint256' }
  ] },
  { type: 'event', name: 'LoanRepaid', anonymous: false, inputs: [{ indexed: false, name: 'totalRepaid', type: 'uint256' }] },
  { type: 'event', name: 'LoanDefaulted', anonymous: false, inputs: [{ indexed: false, name: 'totalVoteWeight', type: 'uint256' }] },
  { type: 'event', name: 'FundingCancelled', anonymous: false, inputs: [{ indexed: false, name: 'timestamp', type: 'uint256' }] },
  { type: 'event', name: 'FundingRefunded', anonymous: false, inputs: [
    { indexed: true, name: 'lender', type: 'address' },
    { indexed: false, name: 'amount', type: 'uint256' }
  ] }
] as const;

export const HARDHAT_CHAIN_ID = 31337;
export const HARDHAT_RPC_URL = 'http://127.0.0.1:8545';

export type DemoAccountPreset = {
  id: string;
  displayName: string;
  role: 'BORROWER' | 'LENDER' | 'MERCHANT' | 'DEMO_OPERATOR';
  address: `0x${string}`;
  privateKey: `0x${string}`;
  description: string;
};

export const DEMO_ACCOUNTS: DemoAccountPreset[] = [
  {
    id: 'operator',
    displayName: 'Credify Deployer & Operator',
    role: 'DEMO_OPERATOR',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    description: 'Protocol deployer, KYC verifier, and system operator'
  },
  {
    id: 'borrower',
    displayName: 'Aarav Menon',
    role: 'BORROWER',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    description: 'Verified borrower creating loans, executing spends, and making repayments'
  },
  {
    id: 'lender-alpha',
    displayName: 'Meera Capital',
    role: 'LENDER',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    description: 'Lead institutional lender (typically 60% pool allocation)'
  },
  {
    id: 'lender-beta',
    displayName: 'Northstar Labs',
    role: 'LENDER',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
    description: 'Syndicate participant lender (typically 40% pool allocation)'
  },
  {
    id: 'lender-gamma',
    displayName: 'Blue Oak Partners',
    role: 'LENDER',
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    privateKey: '0x47e179ec197488593b100287e941669c6bf3605b514b9128c373e59ff5250160',
    description: 'Alternative syndicate lender for governance voting demonstration'
  },
  {
    id: 'merchant-a',
    displayName: 'BuildRight Supplies',
    role: 'MERCHANT',
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
    description: 'Approved vendor for raw materials, inventory, and hardware'
  },
  {
    id: 'merchant-b',
    displayName: 'StudioGrid Equipment',
    role: 'MERCHANT',
    address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    privateKey: '0x92db14e403b83dde3dfb0224da0772d44e2583de4959838b0e264e1a367b6173',
    description: 'Approved vendor for workspace gear, studio equipment, and servers'
  }
];
