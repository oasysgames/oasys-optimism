// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { L1BuildAgent } from "./L1BuildAgent.sol";
import { L1CrossDomainMessenger } from "../../../L1/messaging/L1CrossDomainMessenger.sol";
import {
    Lib_ResolvedDelegateProxy
} from "../../../libraries/resolver/Lib_ResolvedDelegateProxy.sol";
import { L1ChugSplashProxy } from "../../../chugsplash/L1ChugSplashProxy.sol";

/**
 * @title L1BuildStep3
 * @dev L1BuildStep3 is the parial contract to build the Verse-Layer.
 */
contract L1BuildStep3 {
    /**********************
     * Contract Variables *
     **********************/

    address public agentAddress;

    /********************
     * Public Functions *
     ********************/

    /**
     * Sets the address of the L1BuildAgent contract.
     * @param _agentAddress Address of the L1BuildAgent contract.
     */
    function initialize(address _agentAddress) external {
        require(agentAddress == address(0), "initialize only once");
        agentAddress = _agentAddress;
    }

    /**
     * Deploys the contracts of CrossDomainMessenger, L1StandardBridgeProxy and L1ERC721BridgeProxy.
     * @param _chainId Chain ID of the Verse-Layer network.
     * @param _builder Address of the verse builder.
     */
    function build(uint256 _chainId, address _builder) external {
        require(msg.sender == agentAddress, "only the L1BuildAgent can call");

        address addressManager = L1BuildAgent(agentAddress).getAddressManager(_chainId);

        L1CrossDomainMessenger l1CrossDomainMessengerImpl = new L1CrossDomainMessenger();
        l1CrossDomainMessengerImpl.initialize(addressManager);
        l1CrossDomainMessengerImpl.transferOwnership(_builder);
        Lib_ResolvedDelegateProxy l1CrossDomainMessengerProxy = new Lib_ResolvedDelegateProxy(
            addressManager,
            "OVM_L1CrossDomainMessenger"
        );
        L1ChugSplashProxy l1StandardBridgeProxy = new L1ChugSplashProxy(
            L1BuildAgent(agentAddress).step4Address()
        );
        L1ChugSplashProxy l1ERC721BridgeProxy = new L1ChugSplashProxy(
            L1BuildAgent(agentAddress).step4Address()
        );
        L1BuildAgent(agentAddress).setStep3Addresses(
            _chainId,
            address(l1CrossDomainMessengerImpl),
            address(l1CrossDomainMessengerProxy),
            address(l1StandardBridgeProxy),
            address(l1ERC721BridgeProxy)
        );
    }
}
