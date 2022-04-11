// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {
    ERC20PresetMinterPauser
} from "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

/**
 * @title L1StandardERC20
 * @dev L1StandardERC20 is the Oasys Standard ERC20 contract.
 */
contract L1StandardERC20 is ERC20PresetMinterPauser {
    /***************
     * Constructor *
     ***************/

    /**
     * @param _name Name of the ERC20.
     * @param _symbol Symbol of the ERC20.
     */
    constructor(string memory _name, string memory _symbol)
        ERC20PresetMinterPauser(_name, _symbol)
    {}
}
