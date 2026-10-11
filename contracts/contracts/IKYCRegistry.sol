// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IKYCRegistry {
    enum Role {
        None,
        Borrower,
        Lender,
        Supplier
    }

    struct Record {
        Role roleType;
        bool verified;
        uint64 expiresAt;
        bytes32 credentialHash;
    }

    function isVerified(address account, Role roleType) external view returns (bool);
    function isVerified(address account) external view returns (bool);
    function getRecord(address account) external view returns (Role roleType, bool verified, uint64 expiresAt, bytes32 credentialHash);
    function records(address account) external view returns (Role roleType, bool verified, uint64 expiresAt, bytes32 credentialHash);
}
