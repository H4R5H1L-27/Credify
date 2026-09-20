// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

interface IKYCRegistry {
    function isVerified(address account) external view returns (bool);
}

interface IReputationRegistry {
    function recordOutcome(address borrower, bool successful) external;
}

contract LoanPool is ReentrancyGuard {
    error NotBorrower();
    error NotVerifiedLender();
    error FundingClosed();
    error ContributionIsZero();
    error TargetExceeded(uint256 attempted, uint256 remaining);
    error NotActive();
    error MerchantNotApproved();
    error SpendLimitExceeded(uint256 attempted, uint256 remaining);
    error RepaymentTooLarge();
    error NothingToClaim();
    error MaturityNotReached();
    error AlreadyVoted();
    error DefaultThresholdNotReached(uint256 voteWeight, uint256 threshold);
    error CannotResolveAgain();
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
    uint256 public immutable maturity;
    uint256 public immutable aprBps;
    uint256 public immutable maxSpendWei;
    uint256 public immutable defaultQuorumBps;

    Status public status;
    uint256 public totalContributed;
    uint256 public totalRepaid;
    uint256 public totalSpent;
    mapping(address => uint256) public contributed;
    mapping(address => uint256) public claimed;
    mapping(address => bool) public refunded;
    mapping(address => bool) public hasDefaultVoted;
    mapping(address => bool) public approvedMerchant;
    address[] public approvedMerchants;
    uint256 public defaultVoteWeight;

    event LoanPoolCreated(address indexed borrower, uint256 targetWei, uint256 maturity, uint256 aprBps);
    event Funded(address indexed lender, uint256 amount, uint256 totalContributed);
    event LoanActivated(uint256 timestamp);
    event SpendExecuted(address indexed merchant, uint256 amount, bytes32 indexed category);
    event RepaymentReceived(address indexed borrower, uint256 amount, uint256 totalRepaid);
    event RepaymentClaimed(address indexed lender, uint256 amount);
    event DefaultVoteCast(address indexed lender, uint256 weight, uint256 totalVoteWeight);
    event LoanRepaid(uint256 totalRepaid);
    event LoanDefaulted(uint256 totalVoteWeight);
    event FundingCancelled(uint256 timestamp);
    event FundingRefunded(address indexed lender, uint256 amount);

    constructor(
        address borrower_,
        address kycRegistry_,
        address reputationRegistry_,
        uint256 targetWei_,
        uint256 durationSeconds_,
        uint256 aprBps_,
        uint256 maxSpendWei_,
        uint256 defaultQuorumBps_,
        address[] memory merchants_
    ) {
        factory = msg.sender;
        borrower = borrower_;
        kycRegistry = kycRegistry_;
        reputationRegistry = reputationRegistry_;
        targetWei = targetWei_;
        createdAt = block.timestamp;
        durationSeconds = durationSeconds_;
        maturity = block.timestamp + durationSeconds_;
        aprBps = aprBps_;
        maxSpendWei = maxSpendWei_;
        defaultQuorumBps = defaultQuorumBps_;
        status = Status.Funding;
        for (uint256 i = 0; i < merchants_.length; i++) { approvedMerchant[merchants_[i]] = true; approvedMerchants.push(merchants_[i]); }
        emit LoanPoolCreated(borrower_, targetWei_, maturity, aprBps_);
    }

    receive() external payable {
        // Plain transfers are accepted so demo tooling can fund/repay without a special route,
        // but accounting still happens only through fund/repay functions.
    }

    function contribute() external payable nonReentrant {
        if (status != Status.Funding) revert FundingClosed();
        if (!IKYCRegistry(kycRegistry).isVerified(msg.sender)) revert NotVerifiedLender();
        if (msg.value == 0) revert ContributionIsZero();
        uint256 remaining = targetWei - totalContributed;
        if (msg.value > remaining) revert TargetExceeded(msg.value, remaining);
        contributed[msg.sender] += msg.value;
        totalContributed += msg.value;
        emit Funded(msg.sender, msg.value, totalContributed);
        if (totalContributed == targetWei) {
            status = Status.Active;
            emit LoanActivated(block.timestamp);
        }
    }

    function cancelUnfunded() external {
        if (status != Status.Funding) revert FundingClosed();
        if (block.timestamp < maturity) revert FundingNotExpired();
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
        if (!approvedMerchant[merchant]) revert MerchantNotApproved();
        uint256 remaining = maxSpendWei - totalSpent;
        if (amount > remaining) revert SpendLimitExceeded(amount, remaining);
        totalSpent += amount;
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

    function claimRepayment() external nonReentrant returns (uint256 amount) {
        uint256 lenderContribution = contributed[msg.sender];
        if (lenderContribution == 0 || totalContributed == 0) revert NothingToClaim();
        uint256 entitled = (totalRepaid * lenderContribution) / totalContributed;
        amount = entitled - claimed[msg.sender];
        if (amount == 0) revert NothingToClaim();
        claimed[msg.sender] += amount;
        (bool ok,) = payable(msg.sender).call{value: amount}('');
        require(ok, 'lender transfer failed');
        emit RepaymentClaimed(msg.sender, amount);
    }

    function voteDefault() external {
        if (status != Status.Active) revert NotActive();
        if (block.timestamp < maturity) revert MaturityNotReached();
        uint256 weight = contributed[msg.sender];
        if (weight == 0) revert NotVerifiedLender();
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
        uint256 _defaultThreshold
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
    }

    function getLenderInfo(address lender) external view returns (uint256 amount, uint256 claimable, bool voted) {
        amount = contributed[lender];
        uint256 entitled = totalContributed == 0 ? 0 : (totalRepaid * amount) / totalContributed;
        claimable = entitled - claimed[lender];
        voted = hasDefaultVoted[lender];
    }

    function getApprovedMerchants() external view returns (address[] memory) {
        return approvedMerchants;
    }
}
