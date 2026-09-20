// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {LoanPool} from './LoanPool.sol';
import {KYCRegistry} from './KYCRegistry.sol';
import {ReputationRegistry} from './ReputationRegistry.sol';

contract LoanFactory is Ownable {
    error BorrowerNotVerified();
    error InvalidTarget();
    error InvalidDuration();
    error InvalidSpendLimit();
    error InvalidQuorum();
    error NoMerchants();

    KYCRegistry public immutable kycRegistry;
    ReputationRegistry public immutable reputationRegistry;
    address[] public pools;

    event LoanCreated(address indexed pool, address indexed borrower, uint256 targetWei, uint256 maturity, uint256 aprBps);

    constructor(address kycRegistry_, address reputationRegistry_) Ownable(msg.sender) {
        kycRegistry = KYCRegistry(kycRegistry_);
        reputationRegistry = ReputationRegistry(reputationRegistry_);
    }

    function createLoan(
        address borrower,
        uint256 targetWei,
        uint256 durationSeconds,
        uint256 aprBps,
        uint256 maxSpendWei,
        uint256 defaultQuorumBps,
        address[] calldata merchants
    ) external returns (address pool) {
        if (!kycRegistry.verified(borrower)) revert BorrowerNotVerified();
        if (targetWei == 0) revert InvalidTarget();
        if (durationSeconds == 0) revert InvalidDuration();
        if (maxSpendWei == 0 || maxSpendWei > targetWei) revert InvalidSpendLimit();
        if (defaultQuorumBps <= 5000 || defaultQuorumBps > 10000) revert InvalidQuorum();
        if (merchants.length == 0) revert NoMerchants();

        LoanPool lp = new LoanPool(
            borrower,
            address(kycRegistry),
            address(reputationRegistry),
            targetWei,
            durationSeconds,
            aprBps,
            maxSpendWei,
            defaultQuorumBps,
            merchants
        );
        pool = address(lp);
        pools.push(pool);
        reputationRegistry.authorizePool(pool, true);
        emit LoanCreated(pool, borrower, targetWei, lp.maturity(), aprBps);
    }

    function getPools() external view returns (address[] memory) {
        return pools;
    }
}
