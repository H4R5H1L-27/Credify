// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

contract ReputationRegistry is Ownable {
    error NotAuthorizedPool();

    struct Record {
        uint16 successes;
        uint16 defaults;
        uint16 score;
    }

    mapping(address => Record) private records;
    mapping(address => bool) public authorizedPools;

    event PoolAuthorized(address indexed pool, bool authorized);
    event ReputationUpdated(address indexed borrower, bool successful, uint16 score, uint16 successes, uint16 defaults);

    constructor() Ownable(msg.sender) {}

    function authorizePool(address pool, bool authorized) external onlyOwner {
        authorizedPools[pool] = authorized;
        emit PoolAuthorized(pool, authorized);
    }

    function recordOutcome(address borrower, bool successful) external {
        if (!authorizedPools[msg.sender]) revert NotAuthorizedPool();
        Record storage r = records[borrower];
        if (successful) {
            r.successes += 1;
        } else {
            r.defaults += 1;
        }
        uint256 score = 50 + uint256(r.successes) * 8;
        if (uint256(r.defaults) * 20 > score) score = 0;
        else score -= uint256(r.defaults) * 20;
        if (score > 100) score = 100;
        r.score = uint16(score);
        emit ReputationUpdated(borrower, successful, r.score, r.successes, r.defaults);
    }

    function getScore(address borrower) external view returns (uint16 score, uint16 successes, uint16 defaults) {
        Record memory r = records[borrower];
        score = r.successes == 0 && r.defaults == 0 ? 50 : r.score;
        successes = r.successes;
        defaults = r.defaults;
    }
}
