import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { keccak256, toHex, type Address } from 'viem';
import { config } from '../config.js';
import type {
  VerificationRequest,
  CreateVerificationRequestInput,
  ReviewVerificationRequestInput,
  VerificationStatus,
  StructuredCredential
} from '@credify/shared';

function generateCredentialHash(profile: Record<string, unknown>): `0x${string}` {
  const serialized = JSON.stringify(profile, Object.keys(profile).sort());
  return keccak256(toHex(serialized));
}

function initialRequests(): VerificationRequest[] {
  return [
    {
      id: 'req_v1_borrower',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      role: 'BORROWER',
      profile: {
        fullName: 'Aarav Menon',
        organization: 'Department of Computing & Robotics, University Lab',
        role: 'BORROWER',
        referenceId: 'CRD-BRW-001',
        details: { department: 'Robotics', program: 'Academic Equipment Financing' }
      },
      credentialHash: generateCredentialHash({
        fullName: 'Aarav Menon',
        organization: 'Department of Computing & Robotics, University Lab',
        role: 'BORROWER',
        referenceId: 'CRD-BRW-001'
      }),
      submittedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      status: 'VERIFIED',
      reviewedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      reviewedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      attestationTxHash: '0x1a2b3c4d5e6f7081920314253647586970819203142536475869708192031425',
      attestationBlock: '1'
    },
    {
      id: 'req_v1_lender_alpha',
      walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      role: 'LENDER',
      profile: {
        fullName: 'Meera Capital',
        organization: 'Meera Capital Strategic Endowment Fund',
        role: 'LENDER',
        referenceId: 'CRD-LND-001',
        details: { fundType: 'Academic Research Endowment', mandate: 'Hardware Credit' }
      },
      credentialHash: generateCredentialHash({
        fullName: 'Meera Capital',
        organization: 'Meera Capital Strategic Endowment Fund',
        role: 'LENDER',
        referenceId: 'CRD-LND-001'
      }),
      submittedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      status: 'VERIFIED',
      reviewedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      reviewedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      attestationTxHash: '0x2b3c4d5e6f708192031425364758697081920314253647586970819203142536',
      attestationBlock: '1'
    },
    {
      id: 'req_v1_lender_beta',
      walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      role: 'LENDER',
      profile: {
        fullName: 'Northstar Labs',
        organization: 'Northstar Innovation Grants',
        role: 'LENDER',
        referenceId: 'CRD-LND-002',
        details: { focus: 'Lab Infrastructure' }
      },
      credentialHash: generateCredentialHash({
        fullName: 'Northstar Labs',
        organization: 'Northstar Innovation Grants',
        role: 'LENDER',
        referenceId: 'CRD-LND-002'
      }),
      submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      status: 'VERIFIED',
      reviewedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      reviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      attestationTxHash: '0x3c4d5e6f70819203142536475869708192031425364758697081920314253647',
      attestationBlock: '1'
    },
    {
      id: 'req_v1_lender_gamma',
      walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      role: 'LENDER',
      profile: {
        fullName: 'Blue Oak Partners',
        organization: 'Blue Oak Research Credit Facility',
        role: 'LENDER',
        referenceId: 'CRD-LND-003',
        details: { allocation: 'Syndicated Debt' }
      },
      credentialHash: generateCredentialHash({
        fullName: 'Blue Oak Partners',
        organization: 'Blue Oak Research Credit Facility',
        role: 'LENDER',
        referenceId: 'CRD-LND-003'
      }),
      submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'VERIFIED',
      reviewedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      reviewedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      attestationTxHash: '0x4d5e6f7081920314253647586970819203142536475869708192031425364758',
      attestationBlock: '1'
    },
    {
      id: 'req_v1_merchant_a',
      walletAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
      role: 'MERCHANT',
      profile: {
        fullName: 'BuildRight Supplies',
        organization: 'BuildRight Hardware & Materials Ltd.',
        role: 'MERCHANT',
        referenceId: 'CRD-SUP-001',
        businessCategory: 'Laboratory Materials & Sensors',
        details: { vendorCode: 'VND-0881', authorizedCategory: 'Hardware' }
      },
      credentialHash: generateCredentialHash({
        fullName: 'BuildRight Supplies',
        organization: 'BuildRight Hardware & Materials Ltd.',
        role: 'MERCHANT',
        referenceId: 'CRD-SUP-001'
      }),
      submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      status: 'VERIFIED',
      reviewedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      reviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      attestationTxHash: '0x5e6f708192031425364758697081920314253647586970819203142536475869',
      attestationBlock: '1'
    },
    {
      id: 'req_v1_merchant_b',
      walletAddress: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
      role: 'MERCHANT',
      profile: {
        fullName: 'StudioGrid Equipment',
        organization: 'StudioGrid Scientific Instruments Corp.',
        role: 'MERCHANT',
        referenceId: 'CRD-SUP-002',
        businessCategory: 'Precision Optical & Computing Gear',
        details: { vendorCode: 'VND-1042', authorizedCategory: 'Instruments' }
      },
      credentialHash: generateCredentialHash({
        fullName: 'StudioGrid Equipment',
        organization: 'StudioGrid Scientific Instruments Corp.',
        role: 'MERCHANT',
        referenceId: 'CRD-SUP-002'
      }),
      submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      status: 'PENDING',
    }
  ];
}

export class VerificationStore {
  private readonly file: string;
  private requests: VerificationRequest[] = [];
  private loaded = false;

  constructor(fileName = 'verification-requests.json') {
    this.file = `${config.dataDir}/${fileName}`;
  }

  async load() {
    if (this.loaded) return;
    await mkdir(config.dataDir, { recursive: true });
    try {
      this.requests = JSON.parse(await readFile(this.file, 'utf8')) as VerificationRequest[];
    } catch {
      this.requests = initialRequests();
      await this.save();
    }
    this.loaded = true;
  }

  async save() {
    await mkdir(config.dataDir, { recursive: true });
    await writeFile(this.file, JSON.stringify(this.requests, null, 2));
  }

  getAll(filter?: VerificationStatus): VerificationRequest[] {
    const list = [...this.requests].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    if (filter) {
      return list.filter((r) => r.status === filter);
    }
    return list;
  }

  getById(id: string): VerificationRequest | undefined {
    return this.requests.find((r) => r.id === id);
  }

  getByAddress(address: string): VerificationRequest | undefined {
    const lower = address.toLowerCase();
    return this.requests.find((r) => r.walletAddress.toLowerCase() === lower);
  }

  register(input: {
    walletAddress: string;
    role: 'BORROWER' | 'LENDER' | 'MERCHANT';
    profile: StructuredCredential;
  }): VerificationRequest {
    const existingIndex = this.requests.findIndex(
      (r) => r.walletAddress.toLowerCase() === input.walletAddress.toLowerCase()
    );

    const credentialHash = generateCredentialHash(input.profile as unknown as Record<string, unknown>);
    const request: VerificationRequest = {
      id: existingIndex >= 0 ? this.requests[existingIndex].id : `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      walletAddress: input.walletAddress as `0x${string}`,
      role: input.role,
      profile: input.profile,
      credentialHash,
      submittedAt: new Date().toISOString(),
      status: 'NOT_STARTED',
    };

    if (existingIndex >= 0) {
      this.requests[existingIndex] = request;
    } else {
      this.requests.unshift(request);
    }

    return request;
  }

  create(input: CreateVerificationRequestInput): VerificationRequest {
    const existingIndex = this.requests.findIndex(
      (r) => r.walletAddress.toLowerCase() === input.walletAddress.toLowerCase()
    );

    const credentialHash = generateCredentialHash(input.profile as unknown as Record<string, unknown>);
    const request: VerificationRequest = {
      id: existingIndex >= 0 ? this.requests[existingIndex].id : `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      walletAddress: input.walletAddress as `0x${string}`,
      role: input.role,
      profile: input.profile,
      credentialHash,
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
      rejectionReason: undefined,
      attestationTxHash: undefined,
      attestationBlock: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined,
    };

    if (existingIndex >= 0) {
      this.requests[existingIndex] = request;
    } else {
      this.requests.unshift(request);
    }

    return request;
  }

  update(id: string, input: ReviewVerificationRequestInput): VerificationRequest {
    const req = this.getById(id);
    if (!req) {
      throw new Error(`Verification request not found: ${id}`);
    }

    req.status = input.status;
    if (input.reviewedBy) req.reviewedBy = input.reviewedBy as `0x${string}`;
    req.reviewedAt = new Date().toISOString();
    if (input.rejectionReason) req.rejectionReason = input.rejectionReason;
    if (input.attestationTxHash) req.attestationTxHash = input.attestationTxHash as `0x${string}`;
    if (input.attestationBlock) req.attestationBlock = input.attestationBlock;

    return req;
  }

  async reset() {
    this.requests = initialRequests();
    this.loaded = true;
    await this.save();
  }
}
