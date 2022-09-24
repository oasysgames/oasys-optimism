// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// a test ERC20 token with an open mint function
contract TestERC20 is ERC20 {
    constructor() ERC20("Test", "TST") {}

    function mint(address to, uint256 value) public {
        _mint(to, value);
    }
}
