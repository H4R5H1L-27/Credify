// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import {LoanTerms} from './LoanTypes.sol';
import {IKYCRegistry} from './IKYCRegistry.sol';

interface IReputationRegistry {
    function recordOutcome(address borrower, bool successful) external;
}

contract LoanPool is ReentrancyGuard {
    error NotBorrower();
    error BorrowerNotVerified();
    error BorrowerCannotContribute();
    error NotVerifiedLender();
    error NotLender();
    error FundingClosed();
    error ContributionIsZero();
    error TargetExceeded(uint256 attempted, uint256 remaining);
    error NotActive();
    error MerchantNotApproved();
    error SpendLimitExceeded(uint256 attempted, uint256 remaining);
    error MerchantCapExceeded(uint256 attempted, uint256 remaining);
    error RepaymentTooLarge();
    error NothingToClaim();
    error MaturityNotReached();
    error AlreadyVoted();
    error FundingNotExpired();
    error AlreadyRefunded();

    enum Status { Funding, Active, Repaid, Defaulted, Cancelled }

    address public immutable factory;
    address public immutable borrower;
    address public immutable kycRegistry;
    address public immutable reputationRegistry;
    uint256 public immutable targetWei;
    uint256 public immutable createdAt;
    uint256 public immutable durationSeconds;
    uint256 public immutable fundingDeadline;
    uint256 public immutable aprBps;
    uint256 public immutable maxSpendWei;
    uint256 public immutable defaultQuorumBps;
    uint256 public immutable gracePeriodSeconds;
    bytes32 public immutable agreementHash;

    uint256 public maturity;
    Status public status;
    uint256 public totalContributed;
    uint256 public totalRepaid;
    uint256 public totalSpent;
    mapping(address => uint256) public contributed;
    mapping(address => uint256) public claimed;
    mapping(address => bool) public refunded;
    mapping(address => bool) public hasDefaultVoted;
    mapping(address => bool) public approvedMerchant;
    mapping(address => uint256) public merchantCapWei;
    mapping(address => uint256) public merchantSpentWei;
    address[] public approvedMerchants;
    uint256 public defaultVoteWeight;

    event LoanPoolCreated(address indexed borrower, uint256 targetWei, uint256 aprBps, bytes32 indexed agreementHash);
    event Funded(address indexed lender, uint256 amount, uint256 totalContributed);
    event LoanActivated(uint256 timestamp, uint256 maturity);
    event SpendExecuted(address indexed merchant, uint256 amount, bytes32 indexed category);
    event RepaymentReceived(address indexed borrower, uint256 amount, uint256 totalRepaid);
    event RepaymentClaimed(address indexed lender, uint256 amount);
    event DefaultVoteCast(address indexed lender, uint256 weight, uint256 totalVoteWeight);
    event LoanRepaid(uint256 totalRepaid);
    event LoanDefaulted(uint256 totalVoteWeight);
    event FundingCancelled(uint256 timestamp);
    event FundingRefunded(address indexed lender, uint256 amount);

    constructor(
        LoanTerms memory terms_,
        address kycRegistry_,
        address reputationRegistry_
    ) {
        factory = msg.sender;
        borrower = terms_.borrower;
        kycRegistry = kycRegistry_;
        reputationRegistry = reputationRegistry_;
        targetWei = terms_.targetWei;
        createdAt = block.timestamp;
        durationSeconds = terms_.durationSeconds;
        fundingDeadline = block.timestamp + terms_.fundingDurationSeconds;
        aprBps = terms_.aprBps;
        maxSpendWei = terms_.maxSpendWei;
        defaultQuorumBps = terms_.defaultQuorumBps;
        gracePeriodSeconds = terms_.gracePeriodSeconds;
        agreementHash = terms_.agreementHash;
        status = Status.Funding;
        for (uint256 i = 0; i < terms_.merchants.length; i++) {
            address m = terms_.merchants[i];
            approvedMerchant[m] = true;
            approvedMerchants.push(m);
            merchantCapWei[m] = terms_.merchantCapsWei[i];
        }
        emit LoanPoolCreated(terms_.borrower, terms_.targetWei, terms_.aprBps, terms_.agreementHash);
    }

    receive() external payable {
        // Plain transfers are accepted so demo tooling can fund/repay without a special route,
        // but accounting still happens only through fund/repay functions.
    }

    function contribute() external payable nonReentrant {
        if (status != Status.Funding) revert FundingClosed();
        if (msg.sender == borrower) revert BorrowerCannotContribute();
        if (!IKYCRegistry(kycRegistry).isVerified(msg.sender, IKYCRegistry.Role.Lender)) revert NotVerifiedLender();
        if (msg.value == 0) revert ContributionIsZero();
        uint256 remaining = targetWei - totalContributed;
        if (msg.value > remaining) revert TargetExceeded(msg.value, remaining);
        contributed[msg.sender] += msg.value;
        totalContributed += msg.value;
        emit Funded(msg.sender, msg.value, totalContributed);
        if (totalContributed == targetWei) {
            status = Status.Active;
            maturity = block.timestamp + durationSeconds;
            emit LoanActivated(block.timestamp, maturity);
        }
    }

    function cancelUnfunded() external {
        if (status != Status.Funding) revert FundingClosed();
        if (block.timestamp < fundingDeadline) revert FundingNotExpired();
        status = Status.Cancelled;
        emit FundingCancelled(block.timestamp);
    }

    function claimFundingRefund() external nonReentrant returns (uint256 amount) {
        if (status != Status.Cancelled) revert FundingClosed();
        if (refunded[msg.sender]) revert AlreadyRefunded();
        amount = contributed[msg.sender];
        if (amount == 0) revert NothingToClaim();
        refunded[msg.sender] = true;
        (bool ok,) = payable(msg.sender).call{value: amount}('');
        require(ok, 'lender refund failed');
        emit FundingRefunded(msg.sender, amount);
    }

    function spend(address payable merchant, uint256 amount, bytes32 category) external nonReentrant {
        if (msg.sender != borrower) revert NotBorrower();
        if (status != Status.Active) revert NotActive();
        if (!IKYCRegistry(kycRegistry).isVerified(borrower, IKYCRegistry.Role.Borrower)) revert BorrowerNotVerified();
        if (!approvedMerchant[merchant]) revert MerchantNotApproved();
        uint256 remainingGlobal = maxSpendWei - totalSpent;
        if (amount > remainingGlobal) revert SpendLimitExceeded(amount, remainingGlobal);
        uint256 remainingMerchant = merchantCapWei[merchant] - merchantSpentWei[merchant];
        if (amount > remainingMerchant) revert MerchantCapExceeded(amount, remainingMerchant);
        totalSpent += amount;
        merchantSpentWei[merchant] += amount;
        (bool ok,) = merchant.call{value: amount}('');
        require(ok, 'merchant transfer failed');
        emit SpendExecuted(merchant, amount, category);
    }

    function totalRepayable() public view returns (uint256) {
        return targetWei + ((targetWei * aprBps) / 10_000);
    }

    function repay() external payable nonReentrant {
        if (msg.sender != borrower) revert NotBorrower();
        if (status != Status.Active) revert NotActive();
        uint256 remaining = totalRepayable() - totalRepaid;
        if (msg.value == 0 || msg.value > remaining) revert RepaymentTooLarge();
        totalRepaid += msg.value;
        emit RepaymentReceived(msg.sender, msg.value, totalRepaid);
        if (totalRepaid == totalRepayable()) {
            status = Status.Repaid;
            emit LoanRepaid(totalRepaid);
            IReputationRegistry(reputationRegistry).recordOutcome(borrower, true);
        }
    }

    function distributable() public view returns (uint256) {
        if (status == Status.Repaid || status == Status.Defaulted) {
            return totalRepaid + (totalContributed - totalSpent);
        }
        return totalRepaid;
    }

    function claimRepayment() external nonReentrant returns (uint256 amount) {
        uint256 lenderContribution = contributed[msg.sender];
        if (lenderContribution == 0 || totalContributed == 0) revert NothingToClaim();
        uint256 entitled = (distributable() * lenderContribution) / totalContributed;
        amount = entitled - claimed[msg.sender];
        if (amount == 0) revert NothingToClaim();
        claimed[msg.sender] += amount;
        (bool ok,) = payable(msg.sender).call{value: amount}('');
        require(ok, 'lender transfer failed');
        emit RepaymentClaimed(msg.sender, amount);
    }

    function voteDefault() external {
        if (status != Status.Active) revert NotActive();
        if (block.timestamp < maturity + gracePeriodSeconds) revert MaturityNotReached();
        uint256 weight = contributed[msg.sender];
        if (weight == 0) revert NotLender();
        if (hasDefaultVoted[msg.sender]) revert AlreadyVoted();
        hasDefaultVoted[msg.sender] = true;
        defaultVoteWeight += weight;
        emit DefaultVoteCast(msg.sender, weight, defaultVoteWeight);
        uint256 threshold = (totalContributed * defaultQuorumBps) / 10_000;
        if (defaultVoteWeight > threshold) {
            status = Status.Defaulted;
            emit LoanDefaulted(defaultVoteWeight);
            IReputationRegistry(reputationRegistry).recordOutcome(borrower, false);
        }
    }

    function getSummary() external view returns (
        Status _status,
        uint256 _targetWei,
        uint256 _totalContributed,
        uint256 _totalRepaid,
        uint256 _totalRepayable,
        uint256 _totalSpent,
        uint256 _maturity,
        uint256 _defaultVoteWeight,
        uint256 _defaultThreshold,
        uint256 _fundingDeadline,
        uint256 _gracePeriodSeconds,
        bytes32 _agreementHash
    ) {
        _status = status;
        _targetWei = targetWei;
        _totalContributed = totalContributed;
        _totalRepaid = totalRepaid;
        _totalRepayable = totalRepayable();
        _totalSpent = totalSpent;
        _maturity = maturity;
        _defaultVoteWeight = defaultVoteWeight;
        _defaultThreshold = (totalContributed * defaultQuorumBps) / 10_000;
        _fundingDeadline = fundingDeadline;
        _gracePeriodSeconds = gracePeriodSeconds;
        _agreementHash = agreementHash;
    }

    function getLenderInfo(address lender) external view returns (uint256 amount, uint256 claimable, bool voted) {
        amount = contributed[lender];
        uint256 entitled = totalContributed == 0 ? 0 : (distributable() * amount) / totalContributed;
        claimable = entitled - claimed[lender];
        voted = hasDefaultVoted[lender];
    }

    function getApprovedMerchants() external view returns (address[] memory) {
        return approvedMerchants;
    }

    function getMerchantInfo(address merchant) external view returns (bool approved, uint256 capWei, uint256 spentWei) {
        approved = approvedMerchant[merchant];
        capWei = merchantCapWei[merchant];
        spentWei = merchantSpentWei[merchant];
    }
}
