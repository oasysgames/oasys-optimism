// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

/**
 * @title IStakeManager
 */
interface IStakeManager {
    /**
     * Returns owner address from operator address.
     * @param operator Operator address.
     * @return owner Owner address.
     */
    function operatorToOwner(address operator) external view returns (address owner);

    /**
     * Returns total staked amount.
     * @param epoch Target epoch number.
     * @return stakes Total staked amount.
     */
    function getTotalStake(uint256 epoch) external view returns (uint256 stakes);

    /**
     * Returns validator information.
     * @param validator Validator address.
     * @return operator Address used for block signing
     * @return active Validator status.
     * @return jailed Jailing status.
     * @return stakes Total staked amounts.
     * @return commissionRate Commission rates.
     */
    function getValidatorInfo(address validator)
        external
        view
        returns (
            address operator,
            bool active,
            bool jailed,
            uint256 stakes,
            uint256 commissionRate
        );
}
