// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

/**
 * @title IStakeManager
 */
interface IStakeManager {
    /**
     * Returns total staked amount.
     * @param epoch Target epoch number.
     * @return stakes Total staked amount.
     */
    function getTotalStake(uint256 epoch) external view returns (uint256 stakes);

    /**
     * Returns the staked amount of the operator.
     * @param operator Operator address.
     * @param epoch Target epoch number.
     * @return stakes Staked amounts.
     */
    function getOperatorStakes(address operator, uint256 epoch)
        external
        view
        returns (uint256 stakes);
}
