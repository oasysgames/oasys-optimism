// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Lib_PredeployAddresses } from "../../../libraries/constants/Lib_PredeployAddresses.sol";
import { L1BuildDeposit } from "./L1BuildDeposit.sol";
import { L1BuildStep1 } from "./L1BuildStep1.sol";
import { L1BuildStep2 } from "./L1BuildStep2.sol";
import { L1BuildStep3 } from "./L1BuildStep3.sol";
import { L1BuildStep4 } from "./L1BuildStep4.sol";

/**
 * @title L1BuildAgent
 * @dev L1BuildAgent deploys the contracts needed to build Verse-Layer(L2) on Hub-Layer(L1).
 */
contract L1BuildAgent {
    /**********************
     * Contract Variables *
     **********************/

    address public depositAddress;
    address public step1Address;
    address public step2Address;
    address public step3Address;
    address public step4Address;

    mapping(uint256 => address) private chainAddressManager;
    mapping(uint256 => string[]) private chainContractNames;
    mapping(uint256 => address[]) private chainContractAddresses;

    /***************
     * Constructor *
     ***************/

    /**
     * @param _paramAddress Address of the L1BuildParam contract.
     * @param _depositAddress Address of the L1BuildDeposit contract.
     * @param _verifierInfoAddress Address of the VerifierInfo contract.
     * @param _step1Address Address of the L1BuildStep1 contract.
     * @param _step2Address Address of the L1BuildStep2 contract.
     * @param _step3Address Address of the L1BuildStep3 contract.
     * @param _step4Address Address of the L1BuildStep4 contract.
     */
    constructor(
        address _paramAddress,
        address _depositAddress,
        address _verifierInfoAddress,
        address _step1Address,
        address _step2Address,
        address _step3Address,
        address _step4Address
    ) {
        depositAddress = _depositAddress;
        step1Address = _step1Address;
        step2Address = _step2Address;
        step3Address = _step3Address;
        step4Address = _step4Address;
        L1BuildDeposit(depositAddress).initialize(address(this));
        L1BuildStep1(step1Address).initialize(address(this), _paramAddress);
        L1BuildStep2(step2Address).initialize(address(this), _paramAddress, _verifierInfoAddress);
        L1BuildStep3(step3Address).initialize(address(this));
        L1BuildStep4(step4Address).initialize(address(this), _paramAddress);
    }

    /********************
     * Public Functions *
     ********************/

    /**
     * Sets the addresses of AddressManager, Sequencer and Proposer.
     * @param _chainId Chain ID of the Verse-Layer network.
     * @param _addressManager Address of the Verse-Layer AddressManager contract.
     * @param _sequencer Address of the Verse-Layer Sequencer.
     * @param _proposer Address of the Verse-Layer Proposer.
     * @param _canonicalTransactionChain Address of the CanonicalTransactionChain contract.
     * @param _ctcBatches Address of the CTC-Batches contract.
     */
    function setStep1Addresses(
        uint256 _chainId,
        address _addressManager,
        address _sequencer,
        address _proposer,
        address _canonicalTransactionChain,
        address _ctcBatches
    ) external {
        require(msg.sender == step1Address, "only the L1BuildStep1 can call");
        chainAddressManager[_chainId] = _addressManager;
        setContractNamedAddress(_chainId, "OVM_Sequencer", _sequencer);
        setContractNamedAddress(_chainId, "OVM_Proposer", _proposer);
        setContractNamedAddress(_chainId, "CanonicalTransactionChain", _canonicalTransactionChain);
        setContractNamedAddress(_chainId, "ChainStorageContainer-CTC-batches", _ctcBatches);
    }

    /**
     * Sets the addresses of CanonicalTransactionChain, CTC-Batches, StateCommitmentChain
     * , SCC-Batches and BondManager.
     * @param _chainId Chain ID of the Verse-Layer network.
     * @param _stateCommitmentChain Address of the StateCommitmentChain contract.
     * @param _sccBatches Address of the SCC-Batches contract.
     * @param _bondManager Address of the BondManager contract.
     */
    function setStep2Addresses(
        uint256 _chainId,
        address _stateCommitmentChain,
        address _sccBatches,
        address _bondManager
    ) external {
        require(msg.sender == step2Address, "only the L1BuildStep2 can call");
        setContractNamedAddress(_chainId, "StateCommitmentChain", _stateCommitmentChain);
        setContractNamedAddress(_chainId, "ChainStorageContainer-SCC-batches", _sccBatches);
        setContractNamedAddress(_chainId, "BondManager", _bondManager);
    }

    /**
     * Sets the addresses of L1CrossDomainMessenger, L1CrossDomainMessengerProxy
     * L1StandardBridgeProxy, L1ERC721BridgeProxy
     * @param _chainId Chain ID of the Verse-Layer network.
     * @param _l1CrossDomainMessenger Address of the L1CrossDomainMessenger contract.
     * @param _l1CrossDomainMessengerProxy Address of the L1CrossDomainMessengerProxy contract.
     * @param _l1StandardBridgeProxy Address of the L1StandardBridgeProxy contract.
     * @param _l1ERC721BridgeProxy Address of the L1ERC721BridgeProxy contract.
     */
    function setStep3Addresses(
        uint256 _chainId,
        address _l1CrossDomainMessenger,
        address _l1CrossDomainMessengerProxy,
        address _l1StandardBridgeProxy,
        address _l1ERC721BridgeProxy
    ) external {
        require(msg.sender == step3Address, "only the L1BuildStep3 can call");
        setContractNamedAddress(_chainId, "OVM_L1CrossDomainMessenger", _l1CrossDomainMessenger);
        setContractNamedAddress(
            _chainId,
            "Proxy__OVM_L1CrossDomainMessenger",
            _l1CrossDomainMessengerProxy
        );
        setContractNamedAddress(_chainId, "Proxy__OVM_L1StandardBridge", _l1StandardBridgeProxy);
        setContractNamedAddress(_chainId, "Proxy__OVM_L1ERC721Bridge", _l1ERC721BridgeProxy);
        setContractNamedAddress(
            _chainId,
            "L2CrossDomainMessenger",
            Lib_PredeployAddresses.L2_CROSS_DOMAIN_MESSENGER
        );
    }

    /**
     * Deploys the contracts needed to build Verse-Layer(L2) on Hub-Layer(L1).
     * @param _chainId Chain ID of the Verse-Layer network.
     * @param _sequencer Address of the Verse-Layer Sequencer.
     * @param _proposer Address of the Verse-Layer Proposer.
     */
    function build(
        uint256 _chainId,
        address _sequencer,
        address _proposer
    ) external {
        address _builder = msg.sender;
        L1BuildDeposit(depositAddress).build(_builder);
        L1BuildStep1(step1Address).build(_chainId, _sequencer, _proposer);
        L1BuildStep2(step2Address).build(_chainId, _builder);
        L1BuildStep3(step3Address).build(_chainId, _builder);
        L1BuildStep4(step4Address).build(_chainId, _builder);
    }

    /**
     * Returns the address of the AddressManager contract of the Chain ID.
     * @param _chainId Chain ID of the Verse-Layer network.
     * @return _proposer Address of the Verse-Layer Proposer.
     */
    function getAddressManager(uint256 _chainId) external view returns (address) {
        return chainAddressManager[_chainId];
    }

    /**
     * Returns the array of the name and address of the Verse-Layer contracts on Hub-Layer.
     * @param _chainId Chain ID of the Verse-Layer network.
     * @return (names, addresses) Array of the name and address
     * of the Verse-Layer contracts on Hub-Layer.
     */
    function getNamedAddresses(uint256 _chainId)
        external
        view
        returns (string[] memory, address[] memory)
    {
        return (chainContractNames[_chainId], chainContractAddresses[_chainId]);
    }

    /**********************
     * Internal Functions *
     **********************/

    /**
     * Sets the name and address of the contract
     * @param _chainId Chain ID of the Verse-Layer network.
     * @param _name Name of the contract.
     * @param _address Address of the contract
     */
    function setContractNamedAddress(
        uint256 _chainId,
        string memory _name,
        address _address
    ) internal {
        chainContractNames[_chainId].push(_name);
        chainContractAddresses[_chainId].push(_address);
    }
}
