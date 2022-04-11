// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { StateCommitmentChain } from "../../../L1/rollup/StateCommitmentChain.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Lib_OVMCodec } from "../../../libraries/codec/Lib_OVMCodec.sol";
import { IVerifierInfo } from "./IVerifierInfo.sol";

/**
 * @title OasysStateCommitmentChain
 * @dev The Oasys State Commitment Chain is the contract that adds verifiability by the verifier
 * to the State Commitment Chain (SCC).
 */
contract OasysStateCommitmentChain is StateCommitmentChain, Ownable {
    /**********
     * Events *
     **********/

    event Verify(uint256 indexed _index, string _name);
    event VerifiedIndex(uint256 _index);
    event VerifierAdded(string indexed _name);
    event VerifierRemoved(string indexed _name);
    event ThresholdUpdated(uint256 _threshold);

    /*************
     * Variables *
     *************/

    uint256 public nextIndex;
    uint256 public threshold;
    bytes32[] public verifiers;
    address public verifierInfo;
    mapping(bytes32 => uint256) public verifierNextIndex;

    /***************
     * Constructor *
     ***************/

    /**
     * @param _libAddressManager Address of the Address Manager.
     * @param _fraudProofWindow Fraud proof window.
     * @param _sequencerPublishWindow Sequencer publish window.
     * @param _verifierInfo Address of the VerifierInfo.
     */
    constructor(
        address _libAddressManager,
        uint256 _fraudProofWindow,
        uint256 _sequencerPublishWindow,
        address _verifierInfo
    ) StateCommitmentChain(_libAddressManager, _fraudProofWindow, _sequencerPublishWindow) {
        verifierInfo = _verifierInfo;
    }

    /********************
     * Public Functions *
     ********************/

    /**
     * Add the verifier.
     * @param _name Verifier name.
     */
    function addVerifier(string memory _name) external onlyOwner {
        bytes32 nameHash = IVerifierInfo(verifierInfo).computeNameHash(_name);
        require(!_contains(verifiers, nameHash), "already added");

        verifiers.push(nameHash);
        verifierNextIndex[nameHash] = batches().length();

        emit VerifierAdded(_name);
    }

    /**
     * Remove the verifier.
     * @param _name Verifier name.
     */
    function removeVerifier(string memory _name) external onlyOwner {
        bytes32 nameHash = IVerifierInfo(verifierInfo).computeNameHash(_name);
        require(_contains(verifiers, nameHash), "Verifier not contained.");

        uint256 length = verifiers.length;
        bool verifierMatched = false;
        for (uint256 i = 0; i < length - 1; i++) {
            if (!verifierMatched && verifiers[i] == nameHash) {
                verifierMatched = true;
            }
            if (verifierMatched) {
                verifiers[i] = verifiers[i + 1];
            }
        }
        verifiers.pop();
        if (threshold > length - 1) {
            threshold = length - 1;
        }

        emit VerifierRemoved(_name);
    }

    /**
     * Update the verification threshold.
     * @param _threshold Verification threshold.
     */
    function updateThreshold(uint256 _threshold) external onlyOwner {
        if (threshold == _threshold) {
            return;
        }
        require(verifiers.length >= _threshold, "Verifier shortage.");
        if (threshold == 0) {
            nextIndex = batches().length();
        }
        threshold = _threshold;

        emit ThresholdUpdated(_threshold);
    }

    /**
     * Verify the state commitment by verifier.
     * @param _verifier Verifier name.
     * @param _batchHeader Batch header.
     */
    function verifyStateCommitmentByVerifier(
        string memory _verifier,
        Lib_OVMCodec.ChainBatchHeader memory _batchHeader
    ) external {
        require(_isValidBatchHeader(_batchHeader), "Invalid batch header.");
        bytes32 nameHash = IVerifierInfo(verifierInfo).computeNameHash(_verifier);
        require(
            nameHash == IVerifierInfo(verifierInfo).getNameHash(msg.sender),
            "Invalid verifier."
        );
        uint256 index = _batchHeader.batchIndex;
        require(verifierNextIndex[nameHash] == index, "Invalid batch index.");
        verifierNextIndex[nameHash]++;

        emit Verify(index, _verifier);

        _updateVerifiedIndex(index);
    }

    /**
     * Reflesh the verified index.
     */
    function refleshVerifiedIndex() external {
        while (_updateVerifiedIndex(nextIndex)) {}
    }

    /**
     * Checks whether a given batch has exceeded the verification threshold,
     * or is still inside its fraud proof window.
     * @param _batchHeader Header of the batch to check.
     * @return _inside Whether or not the batch is verified, or inside the fraud proof window.
     */
    function insideFraudProofWindow(Lib_OVMCodec.ChainBatchHeader memory _batchHeader)
        public
        view
        override
        returns (bool _inside)
    {
        if (threshold == 0) {
            return false;
        }
        if (_batchHeader.batchIndex < nextIndex) {
            return false;
        }
        (uint256 timestamp, ) = abi.decode(_batchHeader.extraData, (uint256, address));

        require(timestamp != 0, "Batch header timestamp cannot be zero");
        return (timestamp + FRAUD_PROOF_WINDOW) > block.timestamp;
    }

    /**********************
     * Internal Functions *
     **********************/

    /**
     * Update the verified index.
     * @param _index Target index.
     */
    function _updateVerifiedIndex(uint256 _index) internal returns (bool) {
        if (nextIndex != _index) {
            return false;
        }
        uint256 verifiedCount;
        uint256 length = verifiers.length;
        for (uint256 i = 0; i < length; i++) {
            if (verifierNextIndex[verifiers[i]] > _index) {
                verifiedCount++;
            }
        }
        if (verifiedCount < threshold) {
            return false;
        }
        nextIndex++;

        emit VerifiedIndex(_index);

        return true;
    }

    /**
     * Check if the array of verifier contains the verifier.
     * @param _verifiers Array of verifier.
     * @param _verifier verifier.
     * @return Contains of not.
     */
    function _contains(bytes32[] memory _verifiers, bytes32 _verifier)
        internal
        pure
        returns (bool)
    {
        uint256 length = _verifiers.length;
        for (uint256 i = 0; i < length; i++) {
            if (_verifiers[i] == _verifier) {
                return true;
            }
        }
        return false;
    }
}
