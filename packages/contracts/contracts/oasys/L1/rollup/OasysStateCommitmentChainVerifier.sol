// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* External Imports */
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/* Interface Imports */
import { IStakeManager } from "./IStakeManager.sol";
import { OasysStateCommitmentChain } from "./OasysStateCommitmentChain.sol";

/* Library Imports */
import { Lib_OVMCodec } from "../../../libraries/codec/Lib_OVMCodec.sol";
import { PredeployAddresses } from "../../libraries/PredeployAddresses.sol";

/**
 * @title OasysStateCommitmentChainVerifier
 * @dev The Oasys State Commitment Chain Verifier is a contract
 * that verifies based on the verifier's total stake.
 */
contract OasysStateCommitmentChainVerifier {
    /**********
     * Events *
     **********/

    event StateBatchApproved(
        address indexed stateCommitmentChain,
        uint256 indexed batchIndex,
        bytes32 batchRoot
    );
    event StateBatchRejected(
        address indexed stateCommitmentChain,
        uint256 indexed batchIndex,
        bytes32 batchRoot
    );

    /**********
     * Errors *
     **********/

    error InvalidSignature(bytes signature, string reason);
    error InvalidAddressSort(address signer);
    error OutdatedValidatorAddress(address validator);
    error StakeAmountShortage(uint256 required, uint256 verified);

    /********************
     * Public Functions *
     ********************/

    /**
     * Approve the state batch.
     * @param stateCommitmentChain Address of the target OasysStateCommitmentChain.
     * @param batchHeader Target batch header.
     * @param signatures List of signatures.
     */
    function approve(
        address stateCommitmentChain,
        Lib_OVMCodec.ChainBatchHeader memory batchHeader,
        bytes[] memory signatures
    ) external {
        _verifySignatures(stateCommitmentChain, batchHeader, true, signatures);

        OasysStateCommitmentChain(stateCommitmentChain).succeedVerification(batchHeader);

        emit StateBatchApproved(
            stateCommitmentChain,
            batchHeader.batchIndex,
            batchHeader.batchRoot
        );
    }

    /**
     * Reject the state batch.
     * @param stateCommitmentChain Address of the target OasysStateCommitmentChain.
     * @param batchHeader Target batch header.
     * @param signatures List of signatures.
     */
    function reject(
        address stateCommitmentChain,
        Lib_OVMCodec.ChainBatchHeader memory batchHeader,
        bytes[] memory signatures
    ) external {
        _verifySignatures(stateCommitmentChain, batchHeader, false, signatures);

        OasysStateCommitmentChain(stateCommitmentChain).failVerification(batchHeader);

        emit StateBatchRejected(
            stateCommitmentChain,
            batchHeader.batchIndex,
            batchHeader.batchRoot
        );
    }

    /**********************
     * Internal Functions *
     **********************/

    /**
     * Verify signatures.
     * @param stateCommitmentChain Address of the target OasysStateCommitmentChain.
     * @param batchHeader Target state.
     * @param approved Approve or Reject.
     * @param signatures List of signatures.
     */
    function _verifySignatures(
        address stateCommitmentChain,
        Lib_OVMCodec.ChainBatchHeader memory batchHeader,
        bool approved,
        bytes[] memory signatures
    ) internal view {
        address[] memory verifiers = _recoverSigners(
            keccak256(
                abi.encodePacked(
                    block.chainid,
                    stateCommitmentChain,
                    batchHeader.batchIndex,
                    batchHeader.batchRoot,
                    approved
                )
            ),
            signatures
        );

        _verifyTotalStakeOverHalf(verifiers);
    }

    /**
     * Verify total stake is over half.
     * @param verifiers List of verifiers.
     */
    function _verifyTotalStakeOverHalf(address[] memory verifiers) internal view {
        IStakeManager stakeManager = IStakeManager(PredeployAddresses.STAKE_MANAGER);

        uint256 signersCount = verifiers.length;
        uint256 verified = 0;
        for (uint256 i = 0; i < signersCount; i++) {
            address signedOperator = verifiers[i];
            address validatorOwner = stakeManager.operatorToOwner(signedOperator);

            (address currentOperator, , , , uint256 stake) = stakeManager.getValidatorInfo(
                validatorOwner,
                0
            );
            if (signedOperator != currentOperator) {
                revert OutdatedValidatorAddress(validatorOwner);
            }

            verified += stake;
        }

        uint256 required = (stakeManager.getTotalStake(0) / 100) * 51;
        if (verified < required) {
            revert StakeAmountShortage(required, verified);
        }
    }

    /**
     * Returns a list of addresses that signed the hashed message.
     * @param data Data to be signed.
     * @param signatures List of signatures.
     */
    function _recoverSigners(bytes32 data, bytes[] memory signatures)
        internal
        pure
        returns (address[] memory signers)
    {
        signers = new address[](signatures.length);

        bytes32 _hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", data));

        address lastSigner = address(0);
        for (uint256 i = 0; i < signatures.length; i++) {
            bytes memory signature = signatures[i];
            (address signer, ECDSA.RecoverError err) = ECDSA.tryRecover(_hash, signature);

            if (err == ECDSA.RecoverError.InvalidSignature) {
                revert InvalidSignature(signature, "ECDSA: invalid signature");
            } else if (err == ECDSA.RecoverError.InvalidSignatureLength) {
                revert InvalidSignature(signature, "ECDSA: invalid signature length");
            } else if (err == ECDSA.RecoverError.InvalidSignatureS) {
                revert InvalidSignature(signature, "ECDSA: invalid signature 's' value");
            } else if (err == ECDSA.RecoverError.InvalidSignatureV) {
                revert InvalidSignature(signature, "ECDSA: invalid signature 'v' value");
            }

            if (signer <= lastSigner) {
                revert InvalidAddressSort(signer);
            }

            signers[i] = signer;
            lastSigner = signer;
        }
    }
}
