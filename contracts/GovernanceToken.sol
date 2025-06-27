// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";

/**
 * @title GovernanceToken
 * @dev ERC20 token with voting power for the DAO
 */
contract GovernanceToken is ERC20, IVotes {
    mapping(address => address) private _delegation;
    mapping(address => uint256) private _delegates;

    constructor() ERC20("GovernanceToken", "GT") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function delegates(address account) public view override returns (address) {
        return _delegation[account] == address(0) ? account : _delegation[account];
    }

    function delegate(address delegatee) public override {
        _delegate(msg.sender, delegatee);
    }

    function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) public override {
        // Simplified implementation - in production you'd want proper signature verification
        _delegate(msg.sender, delegatee);
    }

    function getVotes(address account) public view override returns (uint256) {
        return _delegates[delegates(account)];
    }

    function getPastVotes(address account, uint256 blockNumber) public view override returns (uint256) {
        // Simplified implementation - returns current votes
        return getVotes(account);
    }

    function getPastTotalSupply(uint256 blockNumber) public view override returns (uint256) {
        // Simplified implementation - returns current total supply
        return totalSupply();
    }

    function _delegate(address delegator, address delegatee) internal {
        address currentDelegate = delegates(delegator);
        uint256 delegatorBalance = balanceOf(delegator);
        
        _delegation[delegator] = delegatee;
        
        _moveVotingPower(currentDelegate, delegatee, delegatorBalance);
    }

    function _moveVotingPower(address src, address dst, uint256 amount) internal {
        if (src != dst && amount > 0) {
            if (src != address(0)) {
                _delegates[src] -= amount;
            }
            if (dst != address(0)) {
                _delegates[dst] += amount;
            }
        }
    }

    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);
        
        if (from != address(0)) {
            _moveVotingPower(delegates(from), address(0), value);
        }
        if (to != address(0)) {
            _moveVotingPower(address(0), delegates(to), value);
        }
    }
} 