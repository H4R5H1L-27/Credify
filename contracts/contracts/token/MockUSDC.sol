// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title MockUSDC
 * @notice Mock ERC-20 stablecoin implementation with 6 decimals for academic testing,
 * multi-currency pool simulations, and testnet faucets.
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;

    constructor() ERC20('USD Coin (Mock)', 'USDC') Ownable(msg.sender) {
        // Initial mint to deployer for liquidity seeding (1,000,000 USDC)
        _mint(msg.sender, 1_000_000 * 10 ** DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Test faucet allowing any demo participant or evaluator to mint mock testnet stablecoins.
     * @param to Recipient address.
     * @param amount Amount in 6-decimal units (e.g. 10,000 * 10^6 for 10k USDC).
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Allows token holders to burn excess test balances.
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
