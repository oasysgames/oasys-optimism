// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { L1StandardERC721 } from "./L1StandardERC721.sol";

/**
 * @title L1StandardERC721Factory
 * @dev L1StandardERC721Factory deploys the Oasys Standard ERC721 contract.
 */
contract L1StandardERC721Factory {
    /**********
     * Events *
     **********/

    event ERC721Created(string indexed _symbol, address indexed _address);

    /********************
     * Public Functions *
     ********************/

    /**
     * Deploys the Oasys Standard ERC721.
     * @param _name Name of the ERC721.
     * @param _symbol Symbol of the ERC721.
     * @param _baseTokenURI Base token URI of the ERC721.
     */
    function createStandardERC721(
        string memory _name,
        string memory _symbol,
        string memory _baseTokenURI
    ) external {
        L1StandardERC721 erc721 = new L1StandardERC721(_name, _symbol, _baseTokenURI, msg.sender);

        emit ERC721Created(_symbol, address(erc721));
    }
}
