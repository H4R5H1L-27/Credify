export const kycAbi = [
  { type: 'function', name: 'isVerified', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'isVerified', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }, { name: 'roleType', type: 'uint8' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'setVerified', stateMutability: 'nonpayable', inputs: [
    { name: 'account', type: 'address' },
    { name: 'roleType', type: 'uint8' },
    { name: 'verified', type: 'bool' },
    { name: 'expiresAt', type: 'uint64' },
    { name: 'credentialHash', type: 'bytes32' }
  ], outputs: [] },
  { type: 'function', name: 'setVerification', stateMutability: 'nonpayable', inputs: [
    { name: 'account', type: 'address' },
    { name: 'roleType', type: 'uint8' },
    { name: 'expiresAt', type: 'uint64' },
    { name: 'credentialHash', type: 'bytes32' }
  ], outputs: [] },
  { type: 'function', name: 'revokeVerification', stateMutability: 'nonpayable', inputs: [
    { name: 'account', type: 'address' }
  ], outputs: [] },
  { type: 'function', name: 'getRecord', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [
    { name: 'roleType', type: 'uint8' },
    { name: 'verified', type: 'bool' },
    { name: 'expiresAt', type: 'uint64' },
    { name: 'credentialHash', type: 'bytes32' }
  ] },
  { type: 'function', name: 'hasRole', stateMutability: 'view', inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'grantRole', stateMutability: 'nonpayable', inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }], outputs: [] },
  { type: 'function', name: 'revokeRole', stateMutability: 'nonpayable', inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }], outputs: [] },
  { type: 'event', name: 'VerificationUpdated', anonymous: false, inputs: [
    { indexed: true, name: 'account', type: 'address' },
    { indexed: true, name: 'roleType', type: 'uint8' },
    { indexed: false, name: 'verified', type: 'bool' },
    { indexed: false, name: 'expiresAt', type: 'uint64' },
    { indexed: true, name: 'credentialHash', type: 'bytes32' },
    { indexed: false, name: 'verifier', type: 'address' }
  ] },
  { type: 'event', name: 'VerificationRevoked', anonymous: false, inputs: [
    { indexed: true, name: 'account', type: 'address' },
    { indexed: true, name: 'roleType', type: 'uint8' },
    { indexed: false, name: 'verifier', type: 'address' }
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
    { name: 'terms', type: 'tuple', components: [
      { name: 'borrower', type: 'address' },
      { name: 'targetWei', type: 'uint256' },
      { name: 'durationSeconds', type: 'uint256' },
      { name: 'fundingDurationSeconds', type: 'uint256' },
      { name: 'aprBps', type: 'uint256' },
      { name: 'maxSpendWei', type: 'uint256' },
      { name: 'defaultQuorumBps', type: 'uint256' },
      { name: 'gracePeriodSeconds', type: 'uint256' },
      { name: 'agreementHash', type: 'bytes32' },
      { name: 'merchants', type: 'address[]' },
      { name: 'merchantCapsWei', type: 'uint256[]' }
    ] }
  ], outputs: [{ name: 'pool', type: 'address' }] },
  { type: 'function', name: 'getPools', stateMutability: 'view', inputs: [], outputs: [{ type: 'address[]' }] },
  { type: 'function', name: 'pause', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'unpause', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'event', name: 'LoanCreated', anonymous: false, inputs: [
    { indexed: true, name: 'pool', type: 'address' },
    { indexed: true, name: 'borrower', type: 'address' },
    { indexed: false, name: 'targetWei', type: 'uint256' },
    { indexed: false, name: 'aprBps', type: 'uint256' },
    { indexed: true, name: 'agreementHash', type: 'bytes32' }
  ] }
] as const;

export const poolAbi = [
  { type: 'function', name: 'borrower', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'targetWei', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'createdAt', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'durationSeconds', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'fundingDeadline', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'maturity', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'aprBps', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'maxSpendWei', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'defaultQuorumBps', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'gracePeriodSeconds', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'agreementHash', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] },
  { type: 'function', name: 'status', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'totalContributed', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'totalRepaid', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'totalSpent', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'totalRepayable', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'distributable', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'getSummary', stateMutability: 'view', inputs: [], outputs: [
    { name: '_status', type: 'uint8' },
    { name: '_targetWei', type: 'uint256' },
    { name: '_totalContributed', type: 'uint256' },
    { name: '_totalRepaid', type: 'uint256' },
    { name: '_totalRepayable', type: 'uint256' },
    { name: '_totalSpent', type: 'uint256' },
    { name: '_maturity', type: 'uint256' },
    { name: '_defaultVoteWeight', type: 'uint256' },
    { name: '_defaultThreshold', type: 'uint256' },
    { name: '_fundingDeadline', type: 'uint256' },
    { name: '_gracePeriodSeconds', type: 'uint256' },
    { name: '_agreementHash', type: 'bytes32' }
  ] },
  { type: 'function', name: 'getLenderInfo', stateMutability: 'view', inputs: [{ name: 'lender', type: 'address' }], outputs: [
    { name: 'amount', type: 'uint256' },
    { name: 'claimable', type: 'uint256' },
    { name: 'voted', type: 'bool' }
  ] },
  { type: 'function', name: 'getApprovedMerchants', stateMutability: 'view', inputs: [], outputs: [{ type: 'address[]' }] },
  { type: 'function', name: 'getMerchantInfo', stateMutability: 'view', inputs: [{ name: 'merchant', type: 'address' }], outputs: [
    { name: 'approved', type: 'bool' },
    { name: 'capWei', type: 'uint256' },
    { name: 'spentWei', type: 'uint256' }
  ] },
  { type: 'function', name: 'claimed', stateMutability: 'view', inputs: [{ name: 'lender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'contributed', stateMutability: 'view', inputs: [{ name: 'lender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'merchantCapWei', stateMutability: 'view', inputs: [{ name: 'merchant', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'merchantSpentWei', stateMutability: 'view', inputs: [{ name: 'merchant', type: 'address' }], outputs: [{ type: 'uint256' }] },
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
    { indexed: false, name: 'aprBps', type: 'uint256' },
    { indexed: true, name: 'agreementHash', type: 'bytes32' }
  ] },
  { type: 'event', name: 'Funded', anonymous: false, inputs: [
    { indexed: true, name: 'lender', type: 'address' },
    { indexed: false, name: 'amount', type: 'uint256' },
    { indexed: false, name: 'totalContributed', type: 'uint256' }
  ] },
  { type: 'event', name: 'LoanActivated', anonymous: false, inputs: [
    { indexed: false, name: 'timestamp', type: 'uint256' },
    { indexed: false, name: 'maturity', type: 'uint256' }
  ] },
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

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_DEFAULT_RPC_URL = 'https://rpc.sepolia.org';
export const SEPOLIA_FAUCET_URL = 'https://sepoliafaucet.com';
export const SEPOLIA_EXPLORER_URL = 'https://sepolia.etherscan.io';

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
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
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
    privateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
    description: 'Approved vendor for workspace gear, studio equipment, and servers'
  }
];

export const portalAbi = [
  { type: 'constructor', inputs: [{ name: '_kycRegistry', type: 'address' }], stateMutability: 'nonpayable' },
  { type: 'function', name: 'selfVerify', stateMutability: 'nonpayable', inputs: [{ name: 'roleType', type: 'uint8' }], outputs: [] },
  { type: 'function', name: 'kycRegistry', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  { type: 'event', name: 'SelfVerified', anonymous: false, inputs: [
    { indexed: true, name: 'account', type: 'address' },
    { indexed: true, name: 'roleType', type: 'uint8' },
    { indexed: false, name: 'expiresAt', type: 'uint64' }
  ] }
] as const;

export const portalBytecode = '0x60a060405234801561000f575f80fd5b506040516106eb3803806106eb833981810160405281019061003191906100c9565b8073ffffffffffffffffffffffffffffffffffffffff1660808173ffffffffffffffffffffffffffffffffffffffff1681525050506100f4565b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6100988261006f565b9050919050565b6100a88161008e565b81146100b2575f80fd5b50565b5f815190506100c38161009f565b92915050565b5f602082840312156100de576100dd61006b565b5b5f6100eb848285016100b5565b91505092915050565b6080516105d86101135f395f818161010c015261020401526105d85ff3fe608060405234801561000f575f80fd5b5060043610610034575f3560e01c8063157f1c9e146100385780634b155b9714610054575b5f80fd5b610052600480360381019061004d9190610260565b610072565b005b61005c610202565b60405161006991906102ca565b60405180910390f35b60018160ff161015801561008a575060038160ff1611155b6100c9576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100c09061033d565b60405180910390fd5b5f3342836040516020016100df939291906103fd565b6040516020818303038152906040528051906020012090505f6301e13380426101089190610466565b90507f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff16635e96b78c338560ff16600381111561015d5761015c610499565b5b84866040518563ffffffff1660e01b815260040161017e9493929190610546565b5f604051808303815f87803b158015610195575f80fd5b505af11580156101a7573d5f803e3d5ffd5b505050508260ff163373ffffffffffffffffffffffffffffffffffffffff167fe17c8a0874a4faa18f57b2a052be7649d29d76e436c150e5656b9d289e4f338e836040516101f59190610589565b60405180910390a3505050565b7f000000000000000000000000000000000000000000000000000000000000000081565b5f80fd5b5f60ff82169050919050565b61023f8161022a565b8114610249575f80fd5b50565b5f8135905061025a81610236565b92915050565b5f6020828403121561027557610274610226565b5b5f6102828482850161024c565b91505092915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6102b48261028b565b9050919050565b6102c4816102aa565b82525050565b5f6020820190506102dd5f8301846102bb565b92915050565b5f82825260208201905092915050565b7f496e76616c696420726f6c6500000000000000000000000000000000000000005f82015250565b5f610327600c836102e3565b9150610332826102f3565b602082019050919050565b5f6020820190508181035f8301526103548161031b565b9050919050565b5f8160601b9050919050565b5f6103718261035b565b9050919050565b5f61038282610367565b9050919050565b61039a610395826102aa565b610378565b82525050565b5f819050919050565b5f819050919050565b6103c36103be826103a0565b6103a9565b82525050565b5f8160f81b9050919050565b5f6103df826103c9565b9050919050565b6103f76103f28261022a565b6103d5565b82525050565b5f6104088286610389565b60148201915061041882856103b2565b60208201915061042882846103e6565b600182019150819050949350505050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f610470826103a0565b915061047b836103a0565b925082820190508082111561049357610492610439565b5b92915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602160045260245ffd5b600481106104d7576104d6610499565b5b50565b5f8190506104e7826104c6565b919050565b5f6104f6826104da565b9050919050565b610506816104ec565b82525050565b5f67ffffffffffffffff82169050919050565b6105288161050c565b82525050565b5f819050919050565b6105408161052e565b82525050565b5f6080820190506105595f8301876102bb565b61056660208301866104fd565b610573604083018561051f565b6105806060830184610537565b95945050505050565b5f60208201905061059c5f83018461051f565b9291505056fea264697066735822122014ad14bf68e5bb93af9a8ec2887f38a4a19865ee7d46f073b90217fc9b4174c564736f6c63430008180033' as const;
