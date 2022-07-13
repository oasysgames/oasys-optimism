// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { L1BuildAgent } from "./L1BuildAgent.sol";
import { L1BuildParam } from "./L1BuildParam.sol";
import { Lib_AddressManager } from "../../../libraries/resolver/Lib_AddressManager.sol";
import { ChainStorageContainer } from "../../../L1/rollup/ChainStorageContainer.sol";
import { CanonicalTransactionChain } from "../../../L1/rollup/CanonicalTransactionChain.sol";

/**
 * @title L1BuildStep1
 * @dev L1BuildStep1 is the parial contract to build the Verse-Layer.
 */
contract L1BuildStep1 {
    /**********************
     * Contract Variables *
     **********************/

    address public agentAddress;
    address public paramAddress;

    /********************
     * Public Functions *
     ********************/

    /**
     * Sets the address of the L1BuildAgent contract.
     * @param _agentAddress Address of the L1BuildAgent contract.
     * @param _paramAddress Address of the L1BuildParam contract.
     */
    function initialize(address _agentAddress, address _paramAddress) external {
        require(agentAddress == address(0) && paramAddress == address(0), "initialize only once");
        agentAddress = _agentAddress;
        paramAddress = _paramAddress;
    }

    /**
     * Deploys the contracts of AddressManager.
     * @param _chainId Chain ID of the Verse-Layer network.
     * @param _sequencer Address of the Verse-Layer Sequencer.
     * @param _proposer Address of the Verse-Layer Proposer.
     */
    function build(
        uint256 _chainId,
        address _sequencer,
        address _proposer
    ) external {
        require(msg.sender == agentAddress, "only the L1BuildAgent can call");
        Lib_AddressManager addressManager = new Lib_AddressManager();
        addressManager.transferOwnership(L1BuildAgent(agentAddress).step4Address());

        CanonicalTransactionChain canonicalTransactionChain = new CanonicalTransactionChain(
            address(addressManager),
            L1BuildParam(paramAddress).maxTransactionGasLimit(),
            L1BuildParam(paramAddress).l2GasDiscountDivisor(),
            L1BuildParam(paramAddress).enqueueGasCost()
        );

        ChainStorageContainer ctcBatches = new ChainStorageContainer(
            address(addressManager),
            "CanonicalTransactionChain"
        );

        L1BuildAgent(agentAddress).setStep1Addresses(
            _chainId,
            address(addressManager),
            _sequencer,
            _proposer,
            address(canonicalTransactionChain),
            address(ctcBatches)
        );
    }
}
