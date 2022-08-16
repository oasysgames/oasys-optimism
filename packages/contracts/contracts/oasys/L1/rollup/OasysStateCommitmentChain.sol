// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* Library Imports */
import { Lib_OVMCodec } from "../../../libraries/codec/Lib_OVMCodec.sol";
import { PredeployAddresses } from "../../libraries/PredeployAddresses.sol";

/* Internal Imports */
import { StateCommitmentChain } from "../../../L1/rollup/StateCommitmentChain.sol";

/**
 * @title OasysStateCommitmentChain
 * @dev The Oasys State Commitment Chain is the contract that adds verifiability by the verifier
 * to the State Commitment Chain (SCC).
 */
contract OasysStateCommitmentChain is StateCommitmentChain {
    /**********
     * Events *
     **********/

    event StateBatchVerified(uint256 indexed _batchIndex, bytes32 _batchRoot);

    /*************
     * Variables *
     *************/

    uint256 public nextIndex;

    /***************
     * Constructor *
     ***************/

    /**
     * @param _libAddressManager Address of the Address Manager.
     * @param _fraudProofWindow Fraud proof window.
     * @param _sequencerPublishWindow Sequencer publish window.
     */
    constructor(
        address _libAddressManager,
        uint256 _fraudProofWindow,
        uint256 _sequencerPublishWindow
    ) StateCommitmentChain(_libAddressManager, _fraudProofWindow, _sequencerPublishWindow) {}

    /********************
     * Public Functions *
     ********************/

    /**
     * Method called by the OasysStateCommitmentChainVerifier after a verification successful.
     * @param _batchHeader Target batch header.
     */
    function succeedVerification(Lib_OVMCodec.ChainBatchHeader memory _batchHeader) external {
        require(msg.sender == PredeployAddresses.SCC_VERIFIER, "Invalid message sender.");

        require(_isValidBatchHeader(_batchHeader), "Invalid batch header.");

        require(_batchHeader.batchIndex == nextIndex, "Invalid batch index.");

        nextIndex++;

        emit StateBatchVerified(_batchHeader.batchIndex, _batchHeader.batchRoot);
    }

    /**
     * Method called by the OasysStateCommitmentChainVerifier after a verification failure.
     * @param _batchHeader Target batch header.
     */
    function failVerification(Lib_OVMCodec.ChainBatchHeader memory _batchHeader) external {
        require(msg.sender == PredeployAddresses.SCC_VERIFIER, "Invalid message sender.");

        require(_isValidBatchHeader(_batchHeader), "Invalid batch header.");

        require(
            insideFraudProofWindow(_batchHeader),
            "State batches can only be deleted within the fraud proof window."
        );

        _deleteBatch(_batchHeader);
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
        if (_batchHeader.batchIndex < nextIndex) {
            return false;
        }
        (uint256 timestamp, ) = abi.decode(_batchHeader.extraData, (uint256, address));

        require(timestamp != 0, "Batch header timestamp cannot be zero");
        return (timestamp + FRAUD_PROOF_WINDOW) > block.timestamp;
    }
}
