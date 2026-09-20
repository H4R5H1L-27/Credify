// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

contract KYCRegistry is Ownable {
    error AddressAlreadyInState();

    mapping(address => bool) public verified;
    mapping(address => bytes32) public verificationRef;

    event VerificationUpdated(address indexed account, bool verified, bytes32 indexed verificationRef);

    constructor() Ownable(msg.sender) {}

    function setVerified(address account, bool isVerified, bytes32 ref) external onlyOwner {
        if (verified[account] == isVerified && verificationRef[account] == ref) revert AddressAlreadyInState();
        verified[account] = isVerified;
        verificationRef[account] = ref;
        emit VerificationUpdated(account, isVerified, ref);
    }

    function isVerified(address account) external view returns (bool) {
        return verified[account];
    }
}
