// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILoanPoolSpend {
    function spend(address payable merchant, uint256 amount, bytes32 category) external;
}

contract MaliciousMerchant {
    bool public attackInitiated;

    receive() external payable {
        if (!attackInitiated) {
            attackInitiated = true;
            // Reentrancy attempt into LoanPool.spend
            ILoanPoolSpend(msg.sender).spend(payable(address(this)), msg.value, bytes32(0));
        }
    }
}

interface ILoanPoolLender {
    function contribute() external payable;
    function claimRepayment() external returns (uint256);
}

contract MaliciousLender {
    bool public attackInitiated;
    address public targetPool;

    function fund(address pool) external payable {
        targetPool = pool;
        ILoanPoolLender(pool).contribute{value: msg.value}();
    }

    function claim() external {
        ILoanPoolLender(targetPool).claimRepayment();
    }

    receive() external payable {
        if (!attackInitiated && targetPool != address(0)) {
            attackInitiated = true;
            // Reentrancy attempt into LoanPool.claimRepayment
            ILoanPoolLender(targetPool).claimRepayment();
        }
    }
}
