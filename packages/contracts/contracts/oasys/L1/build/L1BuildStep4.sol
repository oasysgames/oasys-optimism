// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { L1BuildAgent } from "./L1BuildAgent.sol";
import { L1BuildParam } from "./L1BuildParam.sol";
import { Lib_AddressManager } from "../../../libraries/resolver/Lib_AddressManager.sol";
import { AddressDictator } from "../../../L1/deployment/AddressDictator.sol";
import { L1CrossDomainMessenger } from "../../../L1/messaging/L1CrossDomainMessenger.sol";
import { L1ChugSplashProxy } from "../../../chugsplash/L1ChugSplashProxy.sol";
import { Lib_PredeployAddresses } from "../../../libraries/constants/Lib_PredeployAddresses.sol";
import { ChugSplashDictator } from "../../../L1/deployment/ChugSplashDictator.sol";
import { OasysL2Addresses } from "../../L2/constants/OasysL2Addresses.sol";

/**
 * @title L1BuildStep3
 * @dev L1BuildStep3 is the parial contract to build the Verse-Layer.
 */
contract L1BuildStep4 {
    /**********************
     * Contract Variables *
     **********************/

    address public agentAddress;
    address public paramAddress;

    /********************
     * Public Functions *
     ********************/

    /**
     * Sets the addresses of the L1BuildAgent and L1BuildParam contract.
     * @param _agentAddress Address of the L1BuildAgent contract.
     * @param _paramAddress Address of the L1BuildParam contract.
     */
    function initialize(address _agentAddress, address _paramAddress) external {
        require(agentAddress == address(0) && paramAddress == address(0), "initialize only once");
        agentAddress = _agentAddress;
        paramAddress = _paramAddress;
    }

    /**
     * Deploys the contracts of L1StandardBridge and L1ERC721Bridge.
     * @param _chainId Chain ID of the Verse-Layer network.
     * @param _builder Address of the verse builder.
     */
    function build(uint256 _chainId, address _builder) external {
        require(msg.sender == agentAddress, "only the L1BuildAgent can call");

        address addressManager = L1BuildAgent(agentAddress).getAddressManager(_chainId);
        Lib_AddressManager addressManagerContract = Lib_AddressManager(addressManager);

        string[] memory names;
        address[] memory addresses;
        (names, addresses) = L1BuildAgent(agentAddress).getNamedAddresses(_chainId);
        AddressDictator addressDictator = new AddressDictator(
            addressManagerContract,
            _builder,
            names,
            addresses
        );
        addressManagerContract.transferOwnership(address(addressDictator));
        addressDictator.setAddresses();

        address l1CrossDomainMessengerProxy = addressManagerContract.getAddress(
            "Proxy__OVM_L1CrossDomainMessenger"
        );
        L1CrossDomainMessenger l1CrossDomainMessenger = L1CrossDomainMessenger(
            l1CrossDomainMessengerProxy
        );
        l1CrossDomainMessenger.initialize(addressManager);
        l1CrossDomainMessenger.transferOwnership(_builder);

        address l1StandardBridgeProxy = addressManagerContract.getAddress(
            "Proxy__OVM_L1StandardBridge"
        );
        L1ChugSplashProxy l1StandardBridgeProxyContract = L1ChugSplashProxy(
            payable(l1StandardBridgeProxy)
        );

        ChugSplashDictator chugSplashDictator = new ChugSplashDictator(
            l1StandardBridgeProxyContract,
            _builder,
            L1BuildParam(paramAddress).l1StandardBridgeCodeHash(),
            bytes32(uint256(0)),
            bytes32(uint256(uint160(address(l1CrossDomainMessengerProxy)))),
            bytes32(uint256(1)),
            bytes32(uint256(uint160(Lib_PredeployAddresses.L2_STANDARD_BRIDGE)))
        );

        l1StandardBridgeProxyContract.setOwner(address(chugSplashDictator));
        chugSplashDictator.doActions(L1BuildParam(paramAddress).l1StandardBridgeCode());

        address l1ERC721BridgeProxy = addressManagerContract.getAddress(
            "Proxy__OVM_L1ERC721Bridge"
        );
        L1ChugSplashProxy l1ERC721BridgeProxyContract = L1ChugSplashProxy(
            payable(l1ERC721BridgeProxy)
        );

        ChugSplashDictator chugSplashDictatorForERC721 = new ChugSplashDictator(
            l1ERC721BridgeProxyContract,
            _builder,
            L1BuildParam(paramAddress).l1ERC721BridgeCodeHash(),
            bytes32(uint256(0)),
            bytes32(uint256(uint160(address(l1CrossDomainMessengerProxy)))),
            bytes32(uint256(1)),
            bytes32(uint256(uint160(OasysL2Addresses.L2_ERC721_BRIDGE)))
        );

        l1ERC721BridgeProxyContract.setOwner(address(chugSplashDictatorForERC721));
        chugSplashDictatorForERC721.doActions(L1BuildParam(paramAddress).l1ERC721BridgeCode());
    }
}
