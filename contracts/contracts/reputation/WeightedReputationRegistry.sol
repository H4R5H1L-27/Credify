// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title WeightedReputationRegistry
 * @notice Sybil-resistant reputation registry that weights reputation updates
 * by verified loan principal volume and counterparty lender diversity to resist wash-loan farming.
 */
contract WeightedReputationRegistry is Ownable {
    error NotAuthorizedPool();

    struct Record {
        uint16 successes;
        uint16 defaults;
        uint16 score;
        uint16 uniqueLendersCount;
        uint256 cumulativeVolumeWei;
    }

    mapping(address => Record) private records;
    mapping(address => mapping(address => bool)) private borrowerLenders;
    mapping(address => bool) public authorizedPools;

    event PoolAuthorized(address indexed pool, bool authorized);
    event ReputationUpdated(
        address indexed borrower,
        bool successful,
        uint16 score,
        uint16 successes,
        uint16 defaults,
        uint256 cumulativeVolumeWei,
        uint16 uniqueLendersCount
    );

    constructor() Ownable(msg.sender) {}

    function authorizePool(address pool, bool authorized) external onlyOwner {
        authorizedPools[pool] = authorized;
        emit PoolAuthorized(pool, authorized);
    }

    /**
     * @notice Backward-compatible outcome recording (standard flat delta +8 / -20).
     */
    function recordOutcome(address borrower, bool successful) external {
        if (!authorizedPools[msg.sender]) revert NotAuthorizedPool();
        Record storage r = records[borrower];
        if (successful) {
            r.successes += 1;
        } else {
            r.defaults += 1;
        }

        uint256 score = 50 + uint256(r.successes) * 8;
        if (uint256(r.defaults) * 20 > score) {
            score = 0;
        } else {
            score -= uint256(r.defaults) * 20;
        }
        if (score > 100) score = 100;
        r.score = uint16(score);

        emit ReputationUpdated(borrower, successful, r.score, r.successes, r.defaults, r.cumulativeVolumeWei, r.uniqueLendersCount);
    }

    /**
     * @notice Advanced Sybil-resistant outcome recording weighted by volume & lender diversity.
     * @param borrower The borrower address.
     * @param successful Whether the loan was fully repaid.
     * @param loanVolumeWei Principal volume of the resolved loan.
     * @param lenders Participating lenders in the syndicate.
     */
    function recordOutcomeWeighted(
        address borrower,
        bool successful,
        uint256 loanVolumeWei,
        address[] calldata lenders
    ) external {
        if (!authorizedPools[msg.sender]) revert NotAuthorizedPool();
        Record storage r = records[borrower];

        if (successful) {
            r.successes += 1;
            r.cumulativeVolumeWei += loanVolumeWei;

            for (uint256 i = 0; i < lenders.length; i++) {
                address lender = lenders[i];
                if (lender != address(0) && lender != borrower && !borrowerLenders[borrower][lender]) {
                    borrowerLenders[borrower][lender] = true;
                    r.uniqueLendersCount += 1;
                }
            }
        } else {
            r.defaults += 1;
        }

        // Calculate weighted score
        // Base score = 50
        // Volume tier bonus:
        // < 0.1 ETH: +1 point per success
        // 0.1 to 1 ETH: +3 points per success
        // 1 to 5 ETH: +6 points per success
        // >= 5 ETH: +8 points per success
        uint256 volumeTierBonus;
        if (loanVolumeWei < 0.1 ether) {
            volumeTierBonus = 1;
        } else if (loanVolumeWei < 1 ether) {
            volumeTierBonus = 3;
        } else if (loanVolumeWei < 5 ether) {
            volumeTierBonus = 6;
        } else {
            volumeTierBonus = 8;
        }

        uint256 score = (r.successes == 0 && r.defaults == 0) ? 50 : (r.score == 0 ? 50 : r.score);
        if (successful) {
            score += volumeTierBonus;
        } else {
            if (score > 25) {
                score -= 25;
            } else {
                score = 0;
            }
        }

        // Counterparty diversity cap:
        // A single lender or self-syndicate cannot farm a score above 65
        if (r.uniqueLendersCount < 2 && score > 65) {
            score = 65;
        } else if (r.uniqueLendersCount < 4 && score > 80) {
            score = 80;
        }

        if (score > 100) score = 100;
        r.score = uint16(score);

        emit ReputationUpdated(borrower, successful, r.score, r.successes, r.defaults, r.cumulativeVolumeWei, r.uniqueLendersCount);
    }

    function getScore(address borrower) external view returns (uint16 score, uint16 successes, uint16 defaults) {
        Record memory r = records[borrower];
        score = r.successes == 0 && r.defaults == 0 ? 50 : r.score;
        successes = r.successes;
        defaults = r.defaults;
    }

    function getDetailedReputation(address borrower) external view returns (
        uint16 score,
        uint16 successes,
        uint16 defaults,
        uint256 cumulativeVolumeWei,
        uint16 uniqueLendersCount
    ) {
        Record memory r = records[borrower];
        score = r.successes == 0 && r.defaults == 0 ? 50 : r.score;
        successes = r.successes;
        defaults = r.defaults;
        cumulativeVolumeWei = r.cumulativeVolumeWei;
        uniqueLendersCount = r.uniqueLendersCount;
    }
}
