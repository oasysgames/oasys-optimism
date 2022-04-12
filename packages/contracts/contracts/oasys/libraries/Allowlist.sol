// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { IAllowlist } from "./IAllowlist.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Allowlist
 * @dev Allowlist manages the allowed addresses.
 * This contract allows all addresses after renouncing ownership.
 */
contract Allowlist is IAllowlist, Ownable {
    /*************
     * Variables *
     *************/

    address[] private allowlist;

    /********************
     * Public Functions *
     ********************/

    /**
     * Add the address into the allowlist.
     * @param _address Allowed address.
     */
    function addAddress(address _address) external onlyOwner {
        require(!_contains(allowlist, _address), "already added");
        allowlist.push(_address);

        emit AllowlistAdded(_address);
    }

    /**
     * Remove the address from the allowlist.
     * @param _address Removed address.
     */
    function removeAddress(address _address) external onlyOwner {
        require(_contains(allowlist, _address), "address not found");
        uint256 length = allowlist.length;
        bool addressMatched = false;
        for (uint256 i = 0; i < length - 1; i++) {
            if (!addressMatched && allowlist[i] == _address) {
                addressMatched = true;
            }
            if (addressMatched) {
                allowlist[i] = allowlist[i + 1];
            }
        }
        allowlist.pop();

        emit AllowlistRemoved(_address);
    }

    /**
     * Returns the allowlist.
     */
    function getAllowlist() external view returns (address[] memory) {
        return allowlist;
    }

    /**
     * Check if the allowlist contains the address.
     * @param _address Target address.
     */
    function containsAddress(address _address) external view returns (bool) {
        if (owner() == address(0)) {
            return true;
        }
        return _contains(allowlist, _address);
    }

    /**********************
     * Internal Functions *
     **********************/

    /**
     * Check if the array of address contains the address.
     * @param _addresses Array of address.
     * @param _address address.
     * @return Contains of not.
     */
    function _contains(address[] memory _addresses, address _address) internal pure returns (bool) {
        uint256 length = _addresses.length;
        for (uint256 i = 0; i < length; i++) {
            if (_addresses[i] == _address) {
                return true;
            }
        }
        return false;
    }
}
