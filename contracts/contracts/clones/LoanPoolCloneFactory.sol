// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {Ownable2Step} from '@openzeppelin/contracts/access/Ownable2Step.sol';
import {Pausable} from '@openzeppelin/contracts/utils/Pausable.sol';
import {Clones} from '@openzeppelin/contracts/proxy/Clones.sol';
import {LoanPoolCloneable} from './LoanPoolCloneable.sol';
import {LoanTerms} from '../LoanTypes.sol';
import {IKYCRegistry} from '../IKYCRegistry.sol';

interface IReputationRegistryForCloneFactory {
    function authorizePool(address pool, bool authorized) external;
}

/**
 * @title LoanPoolCloneFactory
 * @notice EIP-1167 Minimal Proxy Factory for LoanPool instances.
 * Reduces deployment gas per pool by ~90-95% compared to direct contract instantiation.
 */
contract LoanPoolCloneFactory is Ownable2Step, Pausable {
    error NotBorrower();
    error BorrowerNotVerified();
    error SupplierNotVerified(address supplier);
    error InvalidTarget();
    error InvalidDuration();
    error InvalidFundingWindow();
    error InvalidAPR();
    error InvalidSpendLimit();
    error InvalidQuorum();
    error InvalidGracePeriod();
    error NoMerchants();
    error TooManyMerchants();
    error MismatchedMerchants();
    error ZeroMerchantAddress();
    error DuplicateMerchantAddress();
    error InvalidMerchantCap();
    error InvalidImplementation();

    address public immutable implementation;
    address public immutable kycRegistry;
    address public immutable reputationRegistry;
    address[] public pools;

    event LoanCreated(
        address indexed pool,
        address indexed borrower,
        uint256 targetWei,
        uint256 aprBps,
        bytes32 indexed agreementHash
    );

    constructor(
        address implementation_,
        address kycRegistry_,
        address reputationRegistry_
    ) Ownable(msg.sender) {
        if (implementation_ == address(0)) revert InvalidImplementation();
        implementation = implementation_;
        kycRegistry = kycRegistry_;
        reputationRegistry = reputationRegistry_;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function createLoan(LoanTerms calldata terms) external whenNotPaused returns (address pool) {
        if (msg.sender != terms.borrower) revert NotBorrower();
        if (!IKYCRegistry(kycRegistry).isVerified(terms.borrower, IKYCRegistry.Role.Borrower)) revert BorrowerNotVerified();
        if (terms.targetWei == 0) revert InvalidTarget();
        if (terms.durationSeconds < 300 || terms.durationSeconds > 365 days) revert InvalidDuration();
        if (terms.fundingDurationSeconds < 300 || terms.fundingDurationSeconds > 90 days) revert InvalidFundingWindow();
        if (terms.aprBps > 5000) revert InvalidAPR();
        if (terms.maxSpendWei == 0 || terms.maxSpendWei > terms.targetWei) revert InvalidSpendLimit();
        if (terms.defaultQuorumBps <= 5000 || terms.defaultQuorumBps > 10000) revert InvalidQuorum();
        if (terms.gracePeriodSeconds > 30 days) revert InvalidGracePeriod();
        if (terms.merchants.length == 0) revert NoMerchants();
        if (terms.merchants.length > 10) revert TooManyMerchants();
        if (terms.merchants.length != terms.merchantCapsWei.length) revert MismatchedMerchants();

        for (uint256 i = 0; i < terms.merchants.length; i++) {
            address m = terms.merchants[i];
            if (m == address(0)) revert ZeroMerchantAddress();
            if (!IKYCRegistry(kycRegistry).isVerified(m, IKYCRegistry.Role.Supplier)) revert SupplierNotVerified(m);
            uint256 cap = terms.merchantCapsWei[i];
            if (cap == 0 || cap > terms.maxSpendWei) revert InvalidMerchantCap();
            for (uint256 j = 0; j < i; j++) {
                if (terms.merchants[j] == m) revert DuplicateMerchantAddress();
            }
        }

        // Deploy EIP-1167 minimal proxy clone
        pool = Clones.clone(implementation);

        // Initialize clone storage
        LoanPoolCloneable(payable(pool)).initialize(
            terms,
            kycRegistry,
            reputationRegistry,
            address(this)
        );

        pools.push(pool);
        IReputationRegistryForCloneFactory(reputationRegistry).authorizePool(pool, true);
        emit LoanCreated(pool, terms.borrower, terms.targetWei, terms.aprBps, terms.agreementHash);
    }

    function getPools() external view returns (address[] memory) {
        return pools;
    }
}
