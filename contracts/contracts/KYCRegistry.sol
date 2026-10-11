// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from '@openzeppelin/contracts/access/AccessControl.sol';
import {IKYCRegistry} from './IKYCRegistry.sol';

contract KYCRegistry is AccessControl, IKYCRegistry {
    bytes32 public constant VERIFIER_ROLE = keccak256('VERIFIER_ROLE');

    error InvalidAccount();
    error InvalidRole();
    error InvalidExpiry();
    error AddressAlreadyInState();

    mapping(address => Record) public records;

    event VerificationUpdated(
        address indexed account,
        Role indexed roleType,
        bool verified,
        uint64 expiresAt,
        bytes32 indexed credentialHash,
        address verifier
    );
    event VerificationRevoked(
        address indexed account,
        Role indexed roleType,
        address verifier
    );

    constructor(address admin, address verifier) {
        address adminAccount = admin == address(0) ? msg.sender : admin;
        _grantRole(DEFAULT_ADMIN_ROLE, adminAccount);
        if (verifier != address(0)) {
            _grantRole(VERIFIER_ROLE, verifier);
        } else if (admin == address(0)) {
            _grantRole(VERIFIER_ROLE, msg.sender);
        }
    }

    function setVerified(
        address account,
        Role roleType,
        bool verified,
        uint64 expiresAt,
        bytes32 credentialHash
    ) public onlyRole(VERIFIER_ROLE) {
        if (account == address(0)) revert InvalidAccount();
        if (roleType == Role.None) revert InvalidRole();
        if (verified && expiresAt != 0 && expiresAt <= block.timestamp) revert InvalidExpiry();

        Record storage rec = records[account];
        if (
            rec.verified == verified &&
            rec.roleType == roleType &&
            rec.expiresAt == expiresAt &&
            rec.credentialHash == credentialHash
        ) {
            revert AddressAlreadyInState();
        }

        rec.roleType = roleType;
        rec.verified = verified;
        rec.expiresAt = expiresAt;
        rec.credentialHash = credentialHash;

        emit VerificationUpdated(account, roleType, verified, expiresAt, credentialHash, msg.sender);
        if (!verified) {
            emit VerificationRevoked(account, roleType, msg.sender);
        }
    }

    function setVerification(
        address account,
        Role roleType,
        uint64 expiresAt,
        bytes32 credentialHash
    ) external onlyRole(VERIFIER_ROLE) {
        setVerified(account, roleType, true, expiresAt, credentialHash);
    }

    function revokeVerification(address account) external onlyRole(VERIFIER_ROLE) {
        if (account == address(0)) revert InvalidAccount();
        Record storage rec = records[account];
        if (!rec.verified) revert AddressAlreadyInState();

        rec.verified = false;
        emit VerificationRevoked(account, rec.roleType, msg.sender);
        emit VerificationUpdated(account, rec.roleType, false, rec.expiresAt, rec.credentialHash, msg.sender);
    }

    function isVerified(address account, Role roleType) public view override returns (bool) {
        Record storage rec = records[account];
        if (!rec.verified) return false;
        if (rec.roleType != roleType) return false;
        if (rec.expiresAt != 0 && block.timestamp >= rec.expiresAt) return false;
        return true;
    }

    function isVerified(address account) public view override returns (bool) {
        Record storage rec = records[account];
        if (!rec.verified) return false;
        if (rec.roleType == Role.None) return false;
        if (rec.expiresAt != 0 && block.timestamp >= rec.expiresAt) return false;
        return true;
    }

    function getRecord(address account) external view override returns (Role roleType, bool verified, uint64 expiresAt, bytes32 credentialHash) {
        Record storage rec = records[account];
        return (rec.roleType, rec.verified, rec.expiresAt, rec.credentialHash);
    }
}
