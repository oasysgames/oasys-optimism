// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/* Library Imports */
import { Lib_PredeployAddresses } from "../../../libraries/constants/Lib_PredeployAddresses.sol";

/* Contract Imports */
import { L2StandardERC20 } from "../../../standards/L2StandardERC20.sol";

/**
 * @title OVM_OAS
 * @dev See: contracts/L2/predeploys/OVM_ETH.sol.
 */
contract OVM_OAS is L2StandardERC20 {
    constructor()
        L2StandardERC20(Lib_PredeployAddresses.L2_STANDARD_BRIDGE, address(0), "OAS", "OAS")
    {}

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        revert("OVM_OAS: transfer is disabled pending further community discussion.");
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        revert("OVM_OAS: approve is disabled pending further community discussion.");
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        revert("OVM_OAS: transferFrom is disabled pending further community discussion.");
    }

    function increaseAllowance(address spender, uint256 addedValue)
        public
        virtual
        override
        returns (bool)
    {
        revert("OVM_OAS: increaseAllowance is disabled pending further community discussion.");
    }

    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        virtual
        override
        returns (bool)
    {
        revert("OVM_OAS: decreaseAllowance is disabled pending further community discussion.");
    }
}
