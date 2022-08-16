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

    event StateBatchAccepted(
        address indexed stateCommitmentChain,
        uint256 batchIndex,
        bytes32 batchRoot
    );
    event StateBatchRejected(
        address indexed stateCommitmentChain,
        uint256 batchIndex,
        bytes32 batchRoot
    );

    /**********
     * Errors *
     **********/

    error InvalidSignature(bytes signature, string reason);
    error OutdatedValidatorAddress(address validator);
    error StakeAmountShortage(uint256 required, uint256 verified);

    /********************
     * Public Functions *
     ********************/

    /**
     * Accept the state batch.
     * @param stateCommitmentChain Address of the target OasysStateCommitmentChain.
     * @param _batchHeader Target batch header.
     * @param signatures List of signatures.
     */
    function accept(
        address stateCommitmentChain,
        Lib_OVMCodec.ChainBatchHeader memory _batchHeader,
        bytes[] memory signatures
    ) external {
        verifySignatures(stateCommitmentChain, _batchHeader, true, signatures);

        OasysStateCommitmentChain(stateCommitmentChain).succeedVerification(_batchHeader);

        emit StateBatchAccepted(
            stateCommitmentChain,
            _batchHeader.batchIndex,
            _batchHeader.batchRoot
        );
    }

    /**
     * Reject the state batch.
     * @param stateCommitmentChain Address of the target OasysStateCommitmentChain.
     * @param _batchHeader Target batch header.
     * @param signatures List of signatures.
     */
    function reject(
        address stateCommitmentChain,
        Lib_OVMCodec.ChainBatchHeader memory _batchHeader,
        bytes[] memory signatures
    ) external {
        verifySignatures(stateCommitmentChain, _batchHeader, false, signatures);

        OasysStateCommitmentChain(stateCommitmentChain).failVerification(_batchHeader);

        emit StateBatchRejected(
            stateCommitmentChain,
            _batchHeader.batchIndex,
            _batchHeader.batchRoot
        );
    }

    /**
     * Check if the total stake amount of verifiers exceeds 50%.
     * @param stateCommitmentChain Address of the target OasysStateCommitmentChain.
     * @param _batchHeader Target state.
     * @param accepted Accept or Reject.
     * @param signatures List of signatures.
     */
    function verifySignatures(
        address stateCommitmentChain,
        Lib_OVMCodec.ChainBatchHeader memory _batchHeader,
        bool accepted,
        bytes[] memory signatures
    ) public view {
        uint256 required = IStakeManager(PredeployAddresses.STAKE_MANAGER).getTotalStake(0);

        (, uint256[] memory amounts) = getVerifiers(
            stateCommitmentChain,
            _batchHeader,
            accepted,
            signatures
        );

        uint256 verified = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            verified += amounts[i];
        }

        if (verified <= required / 2) {
            revert StakeAmountShortage(required, verified);
        }
    }

    /**
     * Returns a list of verifier addresses and stake amounts.
     * @param stateCommitmentChain Address of the target OasysStateCommitmentChain.
     * @param _batchHeader Target state.
     * @param accepted Accept or Reject.
     * @param signatures List of signatures.
     */
    function getVerifiers(
        address stateCommitmentChain,
        Lib_OVMCodec.ChainBatchHeader memory _batchHeader,
        bool accepted,
        bytes[] memory signatures
    ) public view returns (address[] memory verifiers, uint256[] memory amounts) {
        address[] memory signers = _recoverSigners(
            keccak256(
                abi.encodePacked(
                    block.chainid,
                    stateCommitmentChain,
                    _batchHeader.batchIndex,
                    _batchHeader.batchRoot,
                    accepted
                )
            ),
            signatures
        );

        uint256 signersCount = signers.length;
        verifiers = new address[](signersCount);
        amounts = new uint256[](signersCount);

        IStakeManager stakeManager = IStakeManager(PredeployAddresses.STAKE_MANAGER);

        for (uint256 i = 0; i < signersCount; i++) {
            address signedOperator = signers[i];
            address owner = stakeManager.operatorToOwner(signedOperator);

            (address currentOperator, , , uint256 stake, ) = stakeManager.getValidatorInfo(owner);
            if (signedOperator != currentOperator) {
                revert OutdatedValidatorAddress(owner);
            }

            verifiers[i] = owner;
            amounts[i] = stake;
        }
    }

    /**********************
     * Internal Functions *
     **********************/

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

            require(signer > lastSigner, "Invalid address sort.");

            signers[i] = signer;
            lastSigner = signer;
        }
    }
}
