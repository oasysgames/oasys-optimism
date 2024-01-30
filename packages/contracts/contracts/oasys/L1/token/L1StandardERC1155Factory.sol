// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { L1StandardERC1155 } from "./L1StandardERC1155.sol";

/**
 * @title L1StandardERC1155Factory
 * @dev L1StandardERC1155Factory deploys the Oasys Standard ERC1155 contract.
 */
contract L1StandardERC1155Factory {
    /**********
     * Events *
     **********/

    event ERC1155Created(string indexed _uri, address indexed _address);

    /********************
     * Public Functions *
     ********************/

    /**
     * Deploys the Oasys Standard ERC1155.
     * @param _uri URI of the ERC1155.
     */
    function createStandardERC1155(string memory uri_) external {
        L1StandardERC1155 ERC1155 = new L1StandardERC1155(msg.sender, uri_);
        emit ERC1155Created(uri_, address(ERC1155));
    }
}
