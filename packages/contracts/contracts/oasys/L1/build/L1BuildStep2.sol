// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { L1BuildAgent } from "./L1BuildAgent.sol";
import { L1BuildParam } from "./L1BuildParam.sol";
import { ChainStorageContainer } from "../../../L1/rollup/ChainStorageContainer.sol";
import { OasysStateCommitmentChain } from "../rollup/OasysStateCommitmentChain.sol";
import { BondManager } from "../../../L1/verification/BondManager.sol";

/**
 * @title L1BuildStep2
 * @dev L1BuildStep2 is the parial contract to build the Verse-Layer.
 */
contract L1BuildStep2 {
    /**********************
     * Contract Variables *
     **********************/

    address public agentAddress;
    address public paramAddress;
    address public verifierInfoAddress;

    /********************
     * Public Functions *
     ********************/

    /**
     * Sets the addresses of the L1BuildAgent and L1BuildParam contract.
     * @param _agentAddress Address of the L1BuildAgent contract.
     * @param _paramAddress Address of the L1BuildParam contract.
     * @param _verifierInfoAddress Address of the VerifierInfo contract.
     */
    function initialize(
        address _agentAddress,
        address _paramAddress,
        address _verifierInfoAddress
    ) external {
        require(
            agentAddress == address(0) &&
                paramAddress == address(0) &&
                verifierInfoAddress == address(0),
            "initialize only once"
        );
        agentAddress = _agentAddress;
        paramAddress = _paramAddress;
        verifierInfoAddress = _verifierInfoAddress;
    }

    /**
     * Deploys the contracts of CanonicalTransactionChain, StateCommitmentChain and BondManager.
     * @param _chainId Chain ID of the Verse-Layer network.
     */
    function build(uint256 _chainId, address _builder) external {
        require(msg.sender == agentAddress, "only the L1BuildAgent can call");

        address addressManager = L1BuildAgent(agentAddress).getAddressManager(_chainId);

        OasysStateCommitmentChain stateCommitmentChain = new OasysStateCommitmentChain(
            addressManager,
            L1BuildParam(paramAddress).fraudProofWindow(),
            L1BuildParam(paramAddress).sequencerPublishWindow(),
            verifierInfoAddress
        );
        stateCommitmentChain.transferOwnership(_builder);

        ChainStorageContainer sccBatches = new ChainStorageContainer(
            addressManager,
            "StateCommitmentChain"
        );

        BondManager bondManager = new BondManager(addressManager);

        L1BuildAgent(agentAddress).setStep2Addresses(
            _chainId,
            address(stateCommitmentChain),
            address(sccBatches),
            address(bondManager)
        );
    }
}
