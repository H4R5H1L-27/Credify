// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct LoanTerms {
    address borrower;
    uint256 targetWei;
    uint256 durationSeconds;
    uint256 fundingDurationSeconds;
    uint256 aprBps;
    uint256 maxSpendWei;
    uint256 defaultQuorumBps;
    uint256 gracePeriodSeconds;
    bytes32 agreementHash;
    address[] merchants;
    uint256[] merchantCapsWei;
}
