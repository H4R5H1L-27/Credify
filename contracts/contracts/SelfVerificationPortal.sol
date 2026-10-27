// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IKYCRegistry} from './IKYCRegistry.sol';

interface IKYCRegistrySetter {
    function setVerification(
        address account,
        IKYCRegistry.Role roleType,
        uint64 expiresAt,
        bytes32 credentialHash
    ) external;
}

contract SelfVerificationPortal {
    address public immutable kycRegistry;

    event SelfVerified(address indexed account, uint8 indexed roleType, uint64 expiresAt);

    constructor(address _kycRegistry) {
        kycRegistry = _kycRegistry;
    }

    function selfVerify(uint8 roleType) external {
        require(roleType >= 1 && roleType <= 3, "Invalid role");
        bytes32 credHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, roleType));
        uint64 expiresAt = uint64(block.timestamp + 365 days);
        IKYCRegistrySetter(kycRegistry).setVerification(
            msg.sender,
            IKYCRegistry.Role(roleType),
            expiresAt,
            credHash
        );
        emit SelfVerified(msg.sender, roleType, expiresAt);
    }
}
