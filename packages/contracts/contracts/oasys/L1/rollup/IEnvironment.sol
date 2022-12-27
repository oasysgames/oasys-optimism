// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

/**
 * @title IEnvironment
 */
interface IEnvironment {
    /**
     * Returns the current epoch number.
     * @return Current epoch number.
     */
    function epoch() external view returns (uint256);
}
